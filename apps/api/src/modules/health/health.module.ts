import { Module } from '@nestjs/common';
import { RedisModule } from '../../infrastructure/redis/redis.module.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [RedisModule],
  controllers: [HealthController],
})
export class HealthModule {}
