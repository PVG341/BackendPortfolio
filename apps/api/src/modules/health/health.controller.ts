import { Controller, Get, Header, Inject, ServiceUnavailableException } from '@nestjs/common';
import { RedisService } from '../../infrastructure/redis/redis.service.js';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(RedisService)
    private readonly redis: RedisService,
  ) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  check() {
    return {
      status: 'ok',
      service: 'backend-portfolio-api',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  @Header('Cache-Control', 'no-store')
  live() {
    return {
      status: 'alive',
    };
  }

  @Get('ready')
  @Header('Cache-Control', 'no-store')
  async ready() {
    try {
      await this.redis.ping();

      return {
        status: 'ready',
        redis: 'up',
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'not_ready',
        redis: 'down',
      });
    }
  }
}
