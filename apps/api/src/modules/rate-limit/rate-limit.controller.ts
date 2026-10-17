import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  GoneException,
  Header,
  HttpCode,
  Post,
  Res,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import {
  parseSessionConfig,
  parseSessionTokenRequest,
  parseRateLimitRequest,
} from '@portfolio/contracts';
import { RateLimitService } from './rate-limit.service.js';

@Controller('playground/rate-limit')
export class RateLimitController {
  constructor(private readonly rateLimitService: RateLimitService) {}

  @Post('session')
  @Header('Cache-Control', 'no-store')
  async createSession(@Body() body: unknown) {
    const config = parseSessionConfig(body);

    if (config === null) {
      throw new BadRequestException('Invalid session configuration');
    }

    try {
      return await this.rateLimitService.createSession(config);
    } catch {
      throw new ServiceUnavailableException('Redis is unavailable');
    }
  }

  @Post('request')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  async request(@Body() body: unknown, @Res({ passthrough: true }) response: FastifyReply) {
    const request = parseRateLimitRequest(body);

    if (request === null) {
      throw new BadRequestException('Invalid rate-limit request');
    }

    try {
      const decision =
        request.algorithm === 'fixed'
          ? await this.rateLimitService.requestFixedWindow(request.token)
          : await this.rateLimitService.requestSlidingWindow(request.token);

      if (decision === null) {
        throw new GoneException('Rate-limit session expired or was reset');
      }

      response.header('X-RateLimit-Limit', String(decision.limit));
      response.header('X-RateLimit-Remaining', String(decision.remaining));
      response.header('X-RateLimit-Reset', String(Math.ceil(decision.resetAt / 1000)));

      if (!decision.allowed) {
        response.header(
          'Retry-After',
          String(Math.max(1, Math.ceil(decision.retryAfterMs / 1000))),
        );
        response.code(429);
      }

      return decision;
    } catch (error) {
      if (error instanceof GoneException) {
        throw error;
      }

      throw new ServiceUnavailableException('Redis is unavailable');
    }
  }

  @Delete('session')
  @HttpCode(204)
  @Header('Cache-Control', 'no-store')
  async resetSession(@Body() body: unknown): Promise<void> {
    const request = parseSessionTokenRequest(body);

    if (request === null) {
      throw new BadRequestException('Invalid session token');
    }

    try {
      await this.rateLimitService.resetSession(request.token);
    } catch {
      throw new ServiceUnavailableException('Redis is unavailable');
    }
  }
}
