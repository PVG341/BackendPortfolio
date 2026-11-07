import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AbuseProtectionService, type AbuseScope } from './abuse-protection.service.js';
import { ABUSE_PROTECTION_SCOPE } from './abuse-protection.decorator.js';

@Injectable()
export class AbuseProtectionGuard implements CanActivate {
  constructor(
    private readonly abuse: AbuseProtectionService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const scope = this.reflector.get<AbuseScope | undefined>(
      ABUSE_PROTECTION_SCOPE,
      context.getHandler(),
    );

    if (scope === undefined) {
      return true;
    }

    const http = context.switchToHttp();
    const request = http.getRequest<FastifyRequest>();
    const reply = http.getResponse<FastifyReply>();

    let decision;
    try {
      decision = await this.abuse.consume(scope, request.ip);
    } catch {
      throw new ServiceUnavailableException('Redis is unavailable');
    }

    if (decision.allowed) {
      return true;
    }

    reply.header('Retry-After', String(Math.max(1, Math.ceil(decision.retryAfterMs / 1000))));

    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        scope: 'service',
        message: 'Service rate limit exceeded',
        retryAfterMs: decision.retryAfterMs,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
