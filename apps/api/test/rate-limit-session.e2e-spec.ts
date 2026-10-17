import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { RateLimitService } from '../src/modules/rate-limit/rate-limit.service.js';
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

async function sendSlidingRequest(app: NestFastifyApplication, token: string) {
  return app.inject({
    method: 'POST',
    url: '/api/v1/playground/rate-limit/request',
    payload: {
      token,
      algorithm: 'sliding',
    },
  });
}

async function createSession(
  app: NestFastifyApplication,
  limit = 5,
  windowSeconds = 60,
): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/playground/rate-limit/session',
    payload: { limit, windowSeconds },
  });

  expect(response.statusCode).toBe(201);

  return response.json<{ token: string }>().token;
}

async function sendFixedRequest(app: NestFastifyApplication, token: string) {
  return app.inject({
    method: 'POST',
    url: '/api/v1/playground/rate-limit/request',
    payload: {
      token,
      algorithm: 'fixed',
    },
  });
}

describe('Rate-limit sessions (e2e)', () => {
  let app: NestFastifyApplication;
  let rateLimitService: RateLimitService;
  const createdTokens: string[] = [];

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());

    app.setGlobalPrefix('api/v1');

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    const redis = app.get(RedisService);
    await waitForRedis(redis);

    rateLimitService = app.get(RateLimitService);
  });

  afterEach(async () => {
    await Promise.all(createdTokens.splice(0).map((token) => rateLimitService.resetSession(token)));
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a 15-minute session with a server-generated token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/playground/rate-limit/session',
      payload: {
        limit: 5,
        windowSeconds: 10,
      },
    });

    expect(response.statusCode).toBe(201);

    const body = response.json<{
      token: string;
      config: { limit: number; windowSeconds: number };
      expiresAt: number;
    }>();

    createdTokens.push(body.token);

    expect(body.token).toMatch(/^[a-f0-9]{64}$/);
    expect(body.config).toEqual({
      limit: 5,
      windowSeconds: 10,
    });
    expect(body.expiresAt).toBeGreaterThan(Date.now());
  });

  it('rejects malformed session configuration before creating state', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/playground/rate-limit/session',
      payload: {
        limit: 5.5,
        windowSeconds: 10,
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('resets only the requested session', async () => {
    const first = await app.inject({
      method: 'POST',
      url: '/api/v1/playground/rate-limit/session',
      payload: { limit: 5, windowSeconds: 10 },
    });

    const second = await app.inject({
      method: 'POST',
      url: '/api/v1/playground/rate-limit/session',
      payload: { limit: 3, windowSeconds: 20 },
    });

    const firstToken = first.json<{ token: string }>().token;
    const secondToken = second.json<{ token: string }>().token;

    createdTokens.push(firstToken, secondToken);

    const reset = await app.inject({
      method: 'DELETE',
      url: '/api/v1/playground/rate-limit/session',
      payload: { token: firstToken },
    });

    expect(reset.statusCode).toBe(204);
    expect(await rateLimitService.getSession(firstToken)).toBeNull();
    expect(await rateLimitService.getSession(secondToken)).toEqual({
      limit: 3,
      windowSeconds: 20,
    });
  });

  it('returns 429 for the sixth request in one fixed window', async () => {
    const token = await createSession(app);
    createdTokens.push(token);

    const responses = [];

    for (let request = 0; request < 6; request += 1) {
      responses.push(await sendFixedRequest(app, token));
    }

    expect(responses.map((response) => response.statusCode)).toEqual([
      200, 200, 200, 200, 200, 429,
    ]);

    const blocked = responses[5].json<{
      allowed: boolean;
      limit: number;
      remaining: number;
      retryAfterMs: number;
    }>();

    expect(blocked).toMatchObject({
      allowed: false,
      limit: 5,
      remaining: 0,
    });
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
    expect(responses[5].headers['retry-after']).toBeDefined();
  });

  it('does not allow more than the configured quota under concurrency', async () => {
    const token = await createSession(app);
    createdTokens.push(token);

    const responses = await Promise.all(
      Array.from({ length: 20 }, () => sendFixedRequest(app, token)),
    );

    expect(responses.filter((response) => response.statusCode === 200)).toHaveLength(5);
    expect(responses.filter((response) => response.statusCode === 429)).toHaveLength(15);
  });

  it('returns 410 for a request after its session is reset', async () => {
    const token = await createSession(app);
    createdTokens.push(token);

    await app.inject({
      method: 'DELETE',
      url: '/api/v1/playground/rate-limit/session',
      payload: { token },
    });

    const response = await sendFixedRequest(app, token);

    expect(response.statusCode).toBe(410);
  });

  it('returns 429 for the sixth request in one sliding window', async () => {
    const token = await createSession(app);
    createdTokens.push(token);

    const responses = [];

    for (let request = 0; request < 6; request += 1) {
      responses.push(await sendSlidingRequest(app, token));
    }

    expect(responses.map((response) => response.statusCode)).toEqual([
      200, 200, 200, 200, 200, 429,
    ]);

    const blocked = responses[5].json<{
      allowed: boolean;
      algorithm: string;
      remaining: number;
      retryAfterMs: number;
    }>();

    expect(blocked).toMatchObject({
      allowed: false,
      algorithm: 'sliding',
      remaining: 0,
    });
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
    expect(responses[5].headers['retry-after']).toBeDefined();
  });

  it('uses the oldest accepted request as sliding-window resetAt', async () => {
    const token = await createSession(app, 2, 1);
    createdTokens.push(token);

    const first = await sendSlidingRequest(app, token);
    const firstDecision = first.json<{ resetAt: number }>();

    await new Promise((resolve) => setTimeout(resolve, 100));

    const second = await sendSlidingRequest(app, token);
    expect(second.statusCode).toBe(200);

    const blocked = await sendSlidingRequest(app, token);
    const blockedDecision = blocked.json<{
      allowed: boolean;
      resetAt: number;
      retryAfterMs: number;
    }>();

    expect(blocked.statusCode).toBe(429);
    expect(blockedDecision.allowed).toBe(false);
    expect(blockedDecision.resetAt).toBe(firstDecision.resetAt);
    expect(blockedDecision.retryAfterMs).toBeGreaterThan(0);

    await new Promise((resolve) => setTimeout(resolve, blockedDecision.retryAfterMs + 50));

    const recovered = await sendSlidingRequest(app, token);

    expect(recovered.statusCode).toBe(200);
  });

  it('does not allow more than the quota under sliding-window concurrency', async () => {
    const token = await createSession(app);
    createdTokens.push(token);

    const responses = await Promise.all(
      Array.from({ length: 20 }, () => sendSlidingRequest(app, token)),
    );

    expect(responses.filter((response) => response.statusCode === 200)).toHaveLength(5);

    expect(responses.filter((response) => response.statusCode === 429)).toHaveLength(15);
  });
});
