import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { HealthModule } from './modules/health/health.module.js';
import { ConfigModule } from '@nestjs/config';
// import { fileURLToPath } from 'node:url';
import { validateEnvironment } from './config/env.validation.js';
import { RateLimitModule } from './modules/rate-limit/rate-limit.module.js';
import { APP_GUARD } from '@nestjs/core';
import { AbuseProtectionGuard } from './modules/abuse-protection/abuse-protection.guard.js';
import { AbuseProtectionModule } from './modules/abuse-protection/abuse-protection.module.js';
import { SqlPlaygroundModule } from './modules/sql-playground/sql-playground.module.js';
import { ContactModule } from './modules/contact/contact.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnvironment,
    }),
    HealthModule,
    RateLimitModule,
    AbuseProtectionModule,
    SqlPlaygroundModule,
    ContactModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AbuseProtectionGuard,
    },
  ],
})
export class AppModule {}
