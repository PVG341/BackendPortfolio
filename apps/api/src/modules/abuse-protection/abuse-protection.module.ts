import { Module } from '@nestjs/common';
import { RedisModule } from '../../infrastructure/redis/redis.module.js';
// import { AbuseProtectionGuard } from './abuse-protection.guard.js';
import { AbuseProtectionService } from './abuse-protection.service.js';

@Module({
  imports: [RedisModule],
  providers: [AbuseProtectionService],
  exports: [AbuseProtectionService],
})
export class AbuseProtectionModule {}
