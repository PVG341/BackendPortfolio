import { randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureApplication, createFastifyAdapter } from '../src/bootstrap.js';
import { RedisService } from '../src/infrastructure/redis/redis.service.js';
import { EMAIL_SENDER, type EmailMessage } from '../src/modules/contact/email-sender.js';

const namespace = `portfolio-e2e-${randomUUID()}`;
const endpoint = '/api/v1/contact';

const fakeSender = {
  send: vi.fn(async (_message: EmailMessage) => undefined),
};

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

async function clearAbuseKeys(redis: RedisService, prefix: string): Promise<void> {
  const client = redis.getClient();
  let cursor = '0';

  do {
    const [nextCursor, keys] = await client.scan(
      cursor,
      'MATCH',
      `${prefix}:{abuse}:*`,
      'COUNT',
      100,
    );

    if (keys.length > 0) {
      await client.del(...keys);
    }

    cursor = nextCursor;
  } while (cursor !== '0');
}

describe('Contact endpoint (e2e)', () => {
  let app: NestFastifyApplication;
  let redis: RedisService;
  let contactTo: string;
  let contactFrom: string;

  beforeAll(async () => {
    process.env.ABUSE_KEY_NAMESPACE = namespace;
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

    redis = app.get(RedisService);
    await waitForRedis(redis);

    contactTo = app.get(ConfigService).getOrThrow<string>('CONTACT_TO_EMAIL');
    contactFrom = app.get(ConfigService).getOrThrow<string>('CONTACT_FROM_EMAIL');
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(async () => {
    await clearAbuseKeys(redis, namespace);
    fakeSender.send.mockClear();
  });

  function submit(payload: unknown) {
    return app.inject({
      method: 'POST',
      url: endpoint,
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify(payload),
    });
  }

  function validPayload(overrides: Record<string, unknown> = {}) {
    return {
      name: 'Alice',
      email: 'alice@example.com',
      message: 'Hello from the portfolio test',
      website: '',
      ...overrides,
    };
  }

  it('accepts a valid contact request and sends to the server recipient', async () => {
    const response = await submit(validPayload());

    expect(response.statusCode).toBe(202);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.json()).toEqual({ status: 'accepted' });
    expect(fakeSender.send).toHaveBeenCalledTimes(1);

    const sent = fakeSender.send.mock.calls[0][0];

    expect(sent).toMatchObject({
      to: contactTo,
      from: contactFrom,
      replyTo: 'alice@example.com',
      subject: 'Portfolio contact request',
    });
    expect(sent.text).toContain('Alice');
    expect(sent.text).toContain('Hello from the portfolio test');
    expect(sent.text).not.toContain('<html');
  });

  it('accepts a honeypot submission without sending email', async () => {
    const response = await submit(validPayload({ website: 'http://bot.example' }));

    expect(response.statusCode).toBe(202);
    expect(fakeSender.send).not.toHaveBeenCalled();
  });

  it('rejects a client-controlled recipient field', async () => {
    const response = await submit(validPayload({ to: 'attacker@example.com' }));

    expect(response.statusCode).toBe(400);
    expect(fakeSender.send).not.toHaveBeenCalled();
  });

  it.each([
    {},
    { name: 'Alice', email: 'alice@example.com' },
    { name: 'Alice', email: 'not-an-email', message: 'Hello' },
    { name: 'Alice', email: 'alice@example.com', message: '' },
    { name: 'Alice', email: 'alice@example.com', message: 'a'.repeat(2001) },
    { name: 'Ali\nce', email: 'alice@example.com', message: 'Hello' },
  ])('rejects invalid contact payload %#', async (payload) => {
    const response = await submit(payload);

    expect(response.statusCode).toBe(400);
    expect(fakeSender.send).not.toHaveBeenCalled();
  });

  it('accepts a 2000-character Vietnamese message', async () => {
    const response = await submit(validPayload({ message: 'ế'.repeat(2000) }));

    expect(response.statusCode).toBe(202);
    expect(fakeSender.send).toHaveBeenCalledTimes(1);
  });

  it('rejects a body above the 16 KiB limit', async () => {
    const response = await app.inject({
      method: 'POST',
      url: endpoint,
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify(validPayload({ website: 'x'.repeat(17 * 1024) })),
    });

    expect(response.statusCode).toBe(413);
    expect(fakeSender.send).not.toHaveBeenCalled();
  });

  it('normalizes provider failures without leaking details', async () => {
    fakeSender.send.mockRejectedValueOnce(new Error('resend 401: invalid api key'));

    const response = await submit(validPayload());

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({
      statusCode: 503,
      message: 'Contact delivery is temporarily unavailable',
    });
    expect(response.body).not.toContain('resend');
    expect(response.body).not.toContain('401');
    expect(response.body).not.toContain('api key');
    expect(fakeSender.send).toHaveBeenCalledTimes(1);
  });

  it('blocks the 4th contact request from one IP', async () => {
    const responses = [];

    for (let index = 0; index < 4; index += 1) {
      responses.push(await submit(validPayload()));
    }

    expect(responses.map((response) => response.statusCode)).toEqual([202, 202, 202, 429]);
    expect(fakeSender.send).toHaveBeenCalledTimes(3);

    const blocked = responses[3];

    expect(blocked.headers['retry-after']).toBeDefined();
    expect(blocked.json()).toMatchObject({
      statusCode: 429,
      scope: 'service',
    });
  });
});
