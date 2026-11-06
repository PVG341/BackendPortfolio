import { type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyAdapter } from '@nestjs/platform-fastify';

export const API_PREFIX = 'api/v1';
export const BODY_LIMIT_BYTES = 16 * 1024;

export const RATE_LIMIT_HEADERS = [
  'Retry-After',
  'X-RateLimit-Limit',
  'X-RateLimit-Remaining',
  'X-RateLimit-Reset',
] as const;

export function getTrustProxyHops(environment: NodeJS.ProcessEnv = process.env): number {
  const value = environment.TRUST_PROXY_HOPS ?? '0';

  if (!/^\d+$/.test(value)) {
    throw new Error('TRUST_PROXY_HOPS must be a non-negative integer');
  }

  const hops = Number(value);

  if (hops > 10) {
    throw new Error('TRUST_PROXY_HOPS must be between 0 and 10');
  }

  return hops;
}

export function createFastifyAdapter(options: { bodyLimit?: number } = {}): FastifyAdapter {
  const trustProxyHops = getTrustProxyHops();

  return new FastifyAdapter({
    trustProxy: (_address, index) => index < trustProxyHops,
    bodyLimit: options.bodyLimit ?? BODY_LIMIT_BYTES,
  });
}

export function configureApplication(
  app: INestApplication,
  options: { shutdownHooks?: boolean } = {},
): void {
  const config = app.get(ConfigService);

  app.setGlobalPrefix(API_PREFIX);

  app.enableCors({
    origin: config.getOrThrow<string>('CORS_ORIGIN'),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    exposedHeaders: [...RATE_LIMIT_HEADERS],
  });

  if (options.shutdownHooks ?? true) {
    app.enableShutdownHooks();
  }
}
