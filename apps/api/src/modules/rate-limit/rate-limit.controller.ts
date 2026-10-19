import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  GoneException,
  Header,
  HttpCode,
  Post,
  Req,
  Res,
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  parseRateLimitRequest,
  parseSessionConfig,
  parseSessionTokenRequest,
} from '@portfolio/contracts';
import {
  AbuseProtectionService,
  type AbuseScope,
} from '../abuse-protection/abuse-protection.service.js';
import { RateLimitService } from './rate-limit.service.js';

@Controller('playground/rate-limit')
export class RateLimitController {
  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly abuseProtection: AbuseProtectionService,
  ) {}

  private async enforceServiceQuota(
    scope: AbuseScope,
    ip: string,
    response: FastifyReply,
  ): Promise<void> {
    try {
      const decision = await this.abuseProtection.consume(scope, ip);

      if (decision.allowed) {
        return;
      }

      response.header('Retry-After', String(Math.max(1, Math.ceil(decision.retryAfterMs / 1000))));

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          scope: 'service',
          message: 'Service rate limit exceeded',
          retryAfterMs: decision.retryAfterMs,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === HttpStatus.TOO_MANY_REQUESTS) {
        throw error;
      }

      throw new ServiceUnavailableException('Redis is unavailable');
    }
  }

  @Post('session')
  @Header('Cache-Control', 'no-store')
  async createSession(
    @Req() httpRequest: FastifyRequest,
    @Res({ passthrough: true }) response: FastifyReply,
    @Body() body: unknown,
  ) {
    await this.enforceServiceQuota('session', httpRequest.ip, response);

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
  async request(
    @Req() httpRequest: FastifyRequest,
    @Res({ passthrough: true }) response: FastifyReply,
    @Body() body: unknown,
  ) {
    await this.enforceServiceQuota('request', httpRequest.ip, response);

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
  async resetSession(
    @Req() httpRequest: FastifyRequest,
    @Res({ passthrough: true }) response: FastifyReply,
    @Body() body: unknown,
  ): Promise<void> {
    await this.enforceServiceQuota('session', httpRequest.ip, response);

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
