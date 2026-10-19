import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';

function getTrustProxyHops(): number {
  const value = process.env.TRUST_PROXY_HOPS ?? '0';

  if (!/^\d+$/.test(value)) {
    throw new Error('TRUST_PROXY_HOPS must be a non-negative integer');
  }

  const hops = Number(value);

  if (hops > 10) {
    throw new Error('TRUST_PROXY_HOPS must be between 0 and 10');
  }

  return hops;
}

async function bootstrap() {
  const trustProxyHops = getTrustProxyHops();
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      trustProxy: (_address, index) => index < trustProxyHops,
      bodyLimit: 4 * 1024,
    }),
  );

  const config = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: config.getOrThrow<string>('CORS_ORIGIN'),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    exposedHeaders: [
      'Retry-After',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
  });

  app.enableShutdownHooks();

  await app.listen(config.getOrThrow<number>('PORT'), '0.0.0.0');
}

bootstrap().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
