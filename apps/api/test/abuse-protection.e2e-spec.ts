import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import type { Redis } from 'ioredis';
import { RedisService } from '../src/infrastructure/redis/redis.service.js';

async function waitForRedis(redis: RedisService): Promise<void> {
  const deadline = Date.now() + 3_000;

  while (Date.now() < deadline) {
    try {
      await redis.ping();
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  throw new Error('Redis did not become ready within 3 seconds');
}

describe('Abuse protection (e2e)', () => {
  const namespace = `portfolio-e2e-${randomUUID()}`;
  const sessionToken = 'a'.repeat(64);

  let app: NestFastifyApplication;
  let redis: Redis;

  beforeAll(async () => {
    process.env.ABUSE_KEY_NAMESPACE = namespace;
    process.env.ABUSE_KEY_SECRET = 'e2e-secret-that-is-long-enough-for-hmac-sha256-testing';
    process.env.TRUST_PROXY_HOPS = '1';

    const { AppModule } = await import('../src/app.module.js');

    app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter({
        trustProxy: (_address, index) => index < 1,
      }),
    );

    app.setGlobalPrefix('api/v1');

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const redisService = app.get(RedisService);
    await waitForRedis(redisService);
    redis = redisService.getClient();
  });

  beforeEach(async () => {
    let cursor = '0';

    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        'MATCH',
        `${namespace}:{abuse}:*`,
        'COUNT',
        100,
      );

      if (keys.length > 0) {
        await redis.del(...keys);
      }

      cursor = nextCursor;
    } while (cursor !== '0');
  });

  afterAll(async () => {
    await app.close();
  });

  function resetSessionFrom(ip: string) {
    return app.inject({
      method: 'DELETE',
      url: '/api/v1/playground/rate-limit/session',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': ip,
      },
      payload: JSON.stringify({
        token: sessionToken,
      }),
    });
  }

  it('allows 30 session operations then blocks the 31st from one IP', async () => {
    const responses = await Promise.all(
      Array.from({ length: 31 }, () => resetSessionFrom('198.51.100.10')),
    );

    expect(responses.filter((response) => response.statusCode === 204)).toHaveLength(30);

    const blocked = responses.find((response) => response.statusCode === 429);

    expect(blocked).toBeDefined();
    expect(blocked?.headers['retry-after']).toBeDefined();
    expect(blocked?.json()).toMatchObject({
      statusCode: 429,
      scope: 'service',
      message: 'Service rate limit exceeded',
    });
  });

  it('blocks the 301st session operation across distinct IPs', async () => {
    const responses = await Promise.all(
      Array.from({ length: 301 }, (_, index) => {
        const thirdOctet = Math.floor(index / 256);
        const fourthOctet = index % 256;

        return resetSessionFrom(`198.51.${thirdOctet}.${fourthOctet}`);
      }),
    );

    expect(responses.filter((response) => response.statusCode === 204)).toHaveLength(300);

    const blocked = responses.find((response) => response.statusCode === 429);

    expect(blocked).toBeDefined();
    expect(blocked?.headers['retry-after']).toBeDefined();
    expect(blocked?.json()).toMatchObject({
      statusCode: 429,
      scope: 'service',
      message: 'Service rate limit exceeded',
    });
  });
});
