import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module.js';
import { API_PREFIX, configureApplication, createFastifyAdapter } from '../src/bootstrap.js';

describe('API shell (e2e)', () => {
  let app: NestFastifyApplication;
  let origin: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(createFastifyAdapter());
    configureApplication(app, { shutdownHooks: false });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    origin = app.get(ConfigService).getOrThrow<string>('CORS_ORIGIN');
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /api/v1/health returns a healthy response', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/${API_PREFIX}/health`,
    });

    expect(response.statusCode).toBe(200);

    const body = response.json<{
      status: string;
      service: string;
      timestamp: string;
    }>();

    expect(body.status).toBe('ok');
    expect(body.service).toBe('backend-portfolio-api');
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
  });

  it('does not expose health without the API prefix', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(404);
  });

  it('exposes rate-limit headers to the configured browser origin', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/${API_PREFIX}/health`,
      headers: { origin },
    });

    expect(response.headers['access-control-allow-origin']).toBe(origin);
    expect(String(response.headers['access-control-expose-headers']).toLowerCase()).toContain(
      'retry-after',
    );
  });

  it('answers CORS preflight for the session endpoint', async () => {
    const response = await app.inject({
      method: 'OPTIONS',
      url: `/${API_PREFIX}/playground/rate-limit/session`,
      headers: {
        origin,
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type',
      },
    });

    expect([200, 204]).toContain(response.statusCode);
    expect(response.headers['access-control-allow-origin']).toBe(origin);
  });

  it('rejects a JSON body above the body limit', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/${API_PREFIX}/playground/rate-limit/session`,
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({
        limit: 5,
        windowSeconds: 10,
        padding: 'x'.repeat(17 * 1024),
      }),
    });

    expect(response.statusCode).toBe(413);
    expect(response.body).not.toContain('at ');
  });
});
