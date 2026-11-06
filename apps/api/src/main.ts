import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';
import { configureApplication, createFastifyAdapter } from './bootstrap.js';

async function start(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, createFastifyAdapter());

  configureApplication(app);

  const config = app.get(ConfigService);

  await app.listen(config.getOrThrow<number>('PORT'), '0.0.0.0');
}

void start().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
