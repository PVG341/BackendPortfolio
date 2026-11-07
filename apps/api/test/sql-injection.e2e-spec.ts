import { randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { SqlInjectionResponse } from '@portfolio/contracts';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { configureApplication, createFastifyAdapter } from '../src/bootstrap.js';
import { PostgresService } from '../src/infrastructure/postgres/postgres.service.js';
import { RedisService } from '../src/infrastructure/redis/redis.service.js';

const namespace = `portfolio-e2e-${randomUUID()}`;
const endpoint = '/api/v1/playground/sql-injection/query';

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

describe('SQL injection sandbox (e2e)', () => {
  let app: NestFastifyApplication;
  let redis: RedisService;
  let databaseUrl: string;

  beforeAll(async () => {
    process.env.ABUSE_KEY_NAMESPACE = namespace;
    process.env.TRUST_PROXY_HOPS = '0';

    const { AppModule } = await import('../src/app.module.js');

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(createFastifyAdapter());
    configureApplication(app, { shutdownHooks: false });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    redis = app.get(RedisService);
    await waitForRedis(redis);

    databaseUrl = app.get(ConfigService).getOrThrow<string>('DEMO_DATABASE_URL');

    // Fail fast if Postgres is not reachable or credentials are wrong.
    await app.get(PostgresService).executeReadOnly('SELECT 1');
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(async () => {
    await clearAbuseKeys(redis, namespace);
  });

  function query(mode: 'unsafe' | 'safe', username: string) {
    return app.inject({
      method: 'POST',
      url: endpoint,
      payload: { mode, username },
    });
  }

  it('returns all demo rows for an unsafe injection payload', async () => {
    const response = await query('unsafe', "' OR '1'='1' --");

    expect(response.statusCode).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');

    const body = response.json<SqlInjectionResponse>();

    expect(body.mode).toBe('unsafe');
    expect(body.rowCount).toBe(3);
    expect(body.rows.map((row) => row.username).sort()).toEqual(['alice', 'bob', 'charlie']);
  });

  it('returns no rows for the same payload in safe mode', async () => {
    const response = await query('safe', "' OR '1'='1' --");

    expect(response.statusCode).toBe(200);

    const body = response.json<SqlInjectionResponse>();

    expect(body).toMatchObject({
      mode: 'safe',
      rows: [],
      rowCount: 0,
    });
  });

  it('returns the targeted row for a comment injection payload', async () => {
    const response = await query('unsafe', "alice'--");

    expect(response.statusCode).toBe(200);
    expect(response.json<SqlInjectionResponse>().rows).toEqual([
      { id: 1, username: 'alice', role: 'admin' },
    ]);
  });

  it('does not execute stacked statements', async () => {
    const blocked = await query('unsafe', "'; DROP TABLE demo.users; --");

    expect(blocked.statusCode).toBe(400);

    const followUp = await query('unsafe', "' OR '1'='1' --");

    expect(followUp.statusCode).toBe(200);
    expect(followUp.json<SqlInjectionResponse>().rowCount).toBe(3);
  });

  it('normalizes query errors without leaking database details', async () => {
    const response = await query('unsafe', "alice'");

    expect(response.statusCode).toBe(400);
    expect(response.json<{ message: string }>().message).toBe('Query rejected by the SQL sandbox');
    expect(response.body).not.toContain('demo.users');
    expect(response.body).not.toContain('42601');
    expect(response.body).not.toContain('at ');
  });

  it('stops long-running queries with the sandbox timeout', async () => {
    const startedAt = performance.now();

    const response = await query('unsafe', "alice' OR pg_sleep(2) IS NOT NULL --");

    const elapsedMs = performance.now() - startedAt;

    expect(response.statusCode).toBe(400);
    expect(elapsedMs).toBeLessThan(1_500);
  });

  it.each([
    {},
    { mode: 'unsafe' },
    { username: 'alice' },
    { mode: 'drop', username: 'alice' },
    { mode: 'unsafe', username: 'a'.repeat(65) },
    { mode: 'unsafe', username: 'ali\nce' },
    { mode: 'unsafe', username: 'alice', sql: 'select 1' },
  ])('rejects malformed SQL payload %#', async (payload) => {
    const response = await app.inject({
      method: 'POST',
      url: endpoint,
      payload,
    });

    expect(response.statusCode).toBe(400);
  });

  it('blocks the 31st SQL request from one IP', async () => {
    const responses = await Promise.all(Array.from({ length: 31 }, () => query('safe', 'alice')));

    expect(responses.filter((response) => response.statusCode === 200)).toHaveLength(30);

    const blocked = responses.find((response) => response.statusCode === 429);

    expect(blocked).toBeDefined();
    expect(blocked?.headers['retry-after']).toBeDefined();
    expect(blocked?.json()).toMatchObject({
      statusCode: 429,
      scope: 'service',
    });
  });

  it('enforces reader-only, read-only, and timeout at the database layer', async () => {
    const client = new pg.Client({ connectionString: databaseUrl });
    await client.connect();

    try {
      const identity = await client.query(
        "SELECT current_user, current_setting('transaction_read_only') AS read_only",
      );

      expect(identity.rows[0]).toEqual({
        current_user: 'portfolio_demo_reader',
        read_only: 'on',
      });

      await expect(
        client.query("UPDATE demo.users SET role = 'admin' WHERE username = 'bob'"),
      ).rejects.toMatchObject({
        code: expect.stringMatching(/^(25006|42501)$/),
      });

      await expect(
        client.query("INSERT INTO demo.users (username, role) VALUES ('mallory', 'admin')"),
      ).rejects.toMatchObject({
        code: expect.stringMatching(/^(25006|42501)$/),
      });

      const startedAt = performance.now();

      await expect(client.query('SELECT pg_sleep(1)')).rejects.toMatchObject({
        code: '57014',
      });

      expect(performance.now() - startedAt).toBeLessThan(1_500);
    } finally {
      await client.end();
    }
  });
});
