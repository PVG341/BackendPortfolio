import { Module } from '@nestjs/common';
import { RedisModule } from '../../infrastructure/redis/redis.module.js';
import { RateLimitController } from './rate-limit.controller.js';
import { RateLimitService } from './rate-limit.service.js';

@Module({
  imports: [RedisModule],
  controllers: [RateLimitController],
  providers: [RateLimitService],
  exports: [RateLimitService],
})
export class RateLimitModule {}
