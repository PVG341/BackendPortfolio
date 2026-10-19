import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';
import { RedisService } from '../../infrastructure/redis/redis.service.js';
import { abuseProtectionScript } from '../rate-limit/scripts.js';

export type AbuseScope = 'session' | 'request';

interface AbusePolicy {
  ipLimit: number;
  serviceLimit: number;
}

export interface AbuseDecision {
  allowed: boolean;
  retryAfterMs: number;
}

const policies: Record<AbuseScope, AbusePolicy> = {
  session: {
    ipLimit: 30,
    serviceLimit: 300,
  },
  request: {
    ipLimit: 120,
    serviceLimit: 3000,
  },
};

const WINDOW_MS = 60_000;

@Injectable()
export class AbuseProtectionService {
  private readonly namespace: string;
  private readonly secret: string;

  constructor(
    private readonly redis: RedisService,
    config: ConfigService,
  ) {
    this.namespace = config.getOrThrow<string>('ABUSE_KEY_NAMESPACE');
    this.secret = config.getOrThrow<string>('ABUSE_KEY_SECRET');
  }

  async consume(scope: AbuseScope, ip: string): Promise<AbuseDecision> {
    const policy = policies[scope];
    const ipHash = createHmac('sha256', this.secret).update(ip).digest('hex');

    const result = await this.redis
      .getClient()
      .eval(
        abuseProtectionScript,
        2,
        `${this.namespace}:{abuse}:ip:${scope}:${ipHash}`,
        `${this.namespace}:{abuse}:service:${scope}`,
        WINDOW_MS,
        policy.ipLimit,
        policy.serviceLimit,
      );

    if (!Array.isArray(result) || result.length !== 2) {
      throw new Error('Invalid abuse protection response');
    }

    const [allowed, retryAfterMs] = result.map(Number);

    if ((allowed !== 0 && allowed !== 1) || !Number.isFinite(retryAfterMs)) {
      throw new Error('Invalid abuse protection values');
    }

    return {
      allowed: allowed === 1,
      retryAfterMs: Math.max(0, retryAfterMs),
    };
  }
}
