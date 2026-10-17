import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  const config = app.get(ConfigService);

  // API version prefix
  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: config.getOrThrow<string>('CORS_ORIGIN'),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  app.enableShutdownHooks();

  const port = config.getOrThrow<number>('PORT');

  await app.listen(port, '0.0.0.0');

  console.log(`Backend listening on http://localhost:${port}`);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
