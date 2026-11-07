import { randomUUID } from 'node:crypto';
import { Test } from '@nestjs/testing';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { configureApplication, createFastifyAdapter } from '../src/bootstrap.js';
import { EMAIL_SENDER } from '../src/modules/contact/email-sender.js';

const fakeSender = {
  send: vi.fn(async () => undefined),
};

describe('Redis outage (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    process.env.REDIS_URL = 'redis://127.0.0.1:1';
    process.env.ABUSE_KEY_NAMESPACE = `portfolio-e2e-${randomUUID()}`;
    process.env.TRUST_PROXY_HOPS = '0';

    const { AppModule } = await import('../src/app.module.js');

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EMAIL_SENDER)
      .useValue(fakeSender)
      .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(createFastifyAdapter());
    configureApplication(app, { shutdownHooks: false });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('returns 503 for readiness when Redis is unavailable', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health/ready',
    });

    expect(response.statusCode).toBe(503);
  });

  it('returns 503 before processing a contact request', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/contact',
      payload: {
        name: 'Alice',
        email: 'alice@example.com',
        message: 'Hello',
        website: '',
      },
    });

    expect(response.statusCode).toBe(503);
    expect(fakeSender.send).not.toHaveBeenCalled();
  });

  it('returns 503 for session creation when Redis is unavailable', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/playground/rate-limit/session',
      payload: { limit: 5, windowSeconds: 10 },
    });

    expect(response.statusCode).toBe(503);
  });
});
