import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pg from 'pg';
import type { Pool, PoolClient } from 'pg';
import { SqlDemoRejectedError, SqlDemoUnavailableError } from './postgres.errors.js';

const { Pool: PgPool } = pg;

const QUERY_TIMEOUT_MS = 250;

const UNAVAILABLE_CODES = new Set([
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENOTFOUND',
  '28P01',
  '3D000',
  '57P01',
  '53300',
]);

const REJECTED_CODES = new Set([
  '57014', // statement timeout
  '42501', // insufficient privilege
  '25006', // read-only transaction
  '42601', // syntax error
  '42703', // undefined column
  '42P01', // undefined table
  '22P02', // invalid text representation
]);

@Injectable()
export class PostgresService implements OnModuleDestroy {
  private readonly logger = new Logger(PostgresService.name);
  private readonly pool: Pool;

  constructor(config: ConfigService) {
    this.pool = new PgPool({
      connectionString: config.getOrThrow<string>('DEMO_DATABASE_URL'),
      max: 2,
      connectionTimeoutMillis: 1500,
      idleTimeoutMillis: 5000,
      query_timeout: 1000,
      application_name: 'portfolio-sql-demo',
    });

    this.pool.on('error', (error: Error) => {
      this.logger.warn(`Postgres pool error: ${error.name}`);
    });
  }

  async executeReadOnly(
    text: string,
    values: string[] = [],
  ): Promise<{ rows: unknown[]; durationMs: number }> {
    const client = await this.connect();
    const startedAt = performance.now();

    try {
      await client.query('BEGIN READ ONLY');
      await client.query(`SET LOCAL statement_timeout = ${QUERY_TIMEOUT_MS}`);

      const result =
        values.length > 0 ? await client.query({ text, values }) : await client.query(text);

      await client.query('COMMIT');

      return {
        rows: result.rows as unknown[],
        durationMs: Math.round(performance.now() - startedAt),
      };
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      this.logger.warn(`SQL demo query failed: ${getErrorCode(error) ?? 'unknown'}`);
      throw mapPostgresError(error);
    } finally {
      client.release();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  private async connect(): Promise<PoolClient> {
    try {
      return await this.pool.connect();
    } catch (error) {
      this.logger.warn(`Postgres connection failed: ${getErrorCode(error) ?? 'unknown'}`);
      throw new SqlDemoUnavailableError();
    }
  }
}

function getErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return undefined;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}

function mapPostgresError(error: unknown): Error {
  const code = getErrorCode(error);

  if (code && UNAVAILABLE_CODES.has(code)) {
    return new SqlDemoUnavailableError();
  }

  if (code && REJECTED_CODES.has(code)) {
    return new SqlDemoRejectedError();
  }

  return new SqlDemoUnavailableError();
}
