import {
  BadRequestException,
  Body,
  Controller,
  Header,
  HttpCode,
  Post,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { SqlInjectionResponse } from '@portfolio/contracts';
import { parseSqlInjectionRequest } from '@portfolio/contracts';
import {
  SqlDemoRejectedError,
  SqlDemoUnavailableError,
} from '../../infrastructure/postgres/postgres.errors.js';
import { UseAbuseProtection } from '../abuse-protection/abuse-protection.decorator.js';
import { SqlPlaygroundService } from './sql-playground.service.js';

@Controller('playground/sql-injection')
export class SqlPlaygroundController {
  constructor(private readonly service: SqlPlaygroundService) {}

  @Post('query')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @UseAbuseProtection('sql')
  async query(@Body() body: unknown): Promise<SqlInjectionResponse> {
    const request = parseSqlInjectionRequest(body);

    if (request === null) {
      throw new BadRequestException('Invalid SQL demo request');
    }

    try {
      return await this.service.execute(request.mode, request.username);
    } catch (error) {
      if (error instanceof SqlDemoRejectedError) {
        throw new BadRequestException('Query rejected by the SQL sandbox');
      }

      if (error instanceof SqlDemoUnavailableError) {
        throw new ServiceUnavailableException('SQL demo is temporarily unavailable');
      }

      throw new ServiceUnavailableException('SQL demo is temporarily unavailable');
    }
  }
}
