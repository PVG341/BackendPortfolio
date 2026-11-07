import { Injectable } from '@nestjs/common';
import type { SqlDemoRow, SqlInjectionMode, SqlInjectionResponse } from '@portfolio/contracts';
import { PostgresService } from '../../infrastructure/postgres/postgres.service.js';
import { buildUnsafeDemoQuery, SAFE_DEMO_QUERY } from './demo-queries.js';

@Injectable()
export class SqlPlaygroundService {
  constructor(private readonly postgres: PostgresService) {}

  async execute(mode: SqlInjectionMode, username: string): Promise<SqlInjectionResponse> {
    const isUnsafe = mode === 'unsafe';

    const result = await this.postgres.executeReadOnly(
      isUnsafe ? buildUnsafeDemoQuery(username) : SAFE_DEMO_QUERY,
      isUnsafe ? [] : [username],
    );

    const rows = normalizeRows(result.rows);

    return {
      mode,
      rows,
      rowCount: rows.length,
      durationMs: result.durationMs,
    };
  }
}

function normalizeRows(rows: unknown[]): SqlDemoRow[] {
  return rows.slice(0, 50).flatMap((row) => {
    if (typeof row !== 'object' || row === null) {
      return [];
    }

    const record = row as Record<string, unknown>;
    const id = Number(record.id);

    if (
      !Number.isInteger(id) ||
      typeof record.username !== 'string' ||
      typeof record.role !== 'string'
    ) {
      return [];
    }

    return [{ id, username: record.username, role: record.role }];
  });
}
