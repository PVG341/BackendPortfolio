import { Injectable } from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import {
  parseSessionConfig,
  type Algorithm,
  type RateLimitDecision,
  type SessionConfig,
} from '@portfolio/contracts';
import { RedisService } from '../../infrastructure/redis/redis.service.js';
import { fixedWindowScript, slidingWindowScript } from './scripts.js';

export const SESSION_TTL_MS = 15 * 60 * 1000;

export interface CreatedSession {
  token: string;
  config: SessionConfig;
  expiresAt: number;
}

export function sessionKey(token: string): string {
  return `portfolio:{${token}}:session`;
}

export function fixedWindowKey(token: string): string {
  return `portfolio:{${token}}:fixed`;
}

export function slidingWindowKey(token: string): string {
  return `portfolio:{${token}}:sliding`;
}

@Injectable()
export class RateLimitService {
  constructor(private readonly redis: RedisService) {}

  private parseScriptDecision(result: unknown, algorithm: Algorithm): RateLimitDecision | null {
    if (!Array.isArray(result)) {
      throw new Error('Unexpected Redis script response');
    }

    const values = result.map(Number);

    if (values.length === 1 && values[0] === -1) {
      return null;
    }

    if (
      values.length !== 5 ||
      (values[0] !== 0 && values[0] !== 1) ||
      values.slice(1).some((value) => !Number.isFinite(value))
    ) {
      throw new Error('Invalid Redis script response');
    }

    return {
      allowed: values[0] === 1,
      algorithm,
      limit: values[1],
      remaining: values[2],
      resetAt: values[3],
      retryAfterMs: Math.max(0, values[4]),
    };
  }

  async createSession(config: SessionConfig): Promise<CreatedSession> {
    const client = this.redis.getClient();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const token = randomBytes(32).toString('hex');

      const result = await client.set(
        sessionKey(token),
        JSON.stringify(config),
        'PX',
        SESSION_TTL_MS,
        'NX',
      );

      if (result === 'OK') {
        return {
          token,
          config,
          expiresAt: Date.now() + SESSION_TTL_MS,
        };
      }
    }

    throw new Error('Could not allocate a unique session token');
  }

  async getSession(token: string): Promise<SessionConfig | null> {
    const value = await this.redis.getClient().get(sessionKey(token));

    if (value === null) {
      return null;
    }

    try {
      return parseSessionConfig(JSON.parse(value));
    } catch {
      return null;
    }
  }

  async resetSession(token: string): Promise<void> {
    await this.redis
      .getClient()
      .del(sessionKey(token), fixedWindowKey(token), slidingWindowKey(token));
  }

  async requestFixedWindow(token: string): Promise<RateLimitDecision | null> {
    const result = await this.redis
      .getClient()
      .eval(fixedWindowScript, 2, sessionKey(token), fixedWindowKey(token));

    return this.parseScriptDecision(result, 'fixed');
  }

  async requestSlidingWindow(token: string): Promise<RateLimitDecision | null> {
    const result = await this.redis
      .getClient()
      .eval(slidingWindowScript, 2, sessionKey(token), slidingWindowKey(token), randomUUID());

    return this.parseScriptDecision(result, 'sliding');
  }
}
