import { Module } from '@nestjs/common';
import { RedisModule } from '../../infrastructure/redis/redis.module.js';
import { AbuseProtectionModule } from '../abuse-protection/abuse-protection.module.js';
import { RateLimitController } from './rate-limit.controller.js';
import { RateLimitService } from './rate-limit.service.js';

@Module({
  imports: [RedisModule, AbuseProtectionModule],
  controllers: [RateLimitController],
  providers: [RateLimitService],
  exports: [RateLimitService],
})
export class RateLimitModule {}
