import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(
    @Inject(ConfigService)
    config: ConfigService,
  ) {
    this.client = new Redis(config.getOrThrow<string>('REDIS_URL'), {
      connectTimeout: 1500,
      commandTimeout: 2000,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 0,
      autoResendUnfulfilledCommands: false,
      retryStrategy: (attempt) => Math.min(attempt * 200, 2000),
    });

    this.client.on('error', () => {
      this.logger.warn('Redis connection or command error');
    });

    this.client.on('ready', () => {
      this.logger.log('Redis connection ready');
    });
  }

  async ping(): Promise<void> {
    if (this.client.status !== 'ready') {
      throw new Error('Redis is not ready');
    }

    const response = await this.client.ping();

    if (response !== 'PONG') {
      throw new Error('Redis returned an unexpected response');
    }
  }

  getClient(): Redis {
    return this.client;
  }

  onModuleDestroy(): void {
    this.client.disconnect();
  }
}
