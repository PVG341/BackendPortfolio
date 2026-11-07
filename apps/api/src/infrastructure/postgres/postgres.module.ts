import { Module } from '@nestjs/common';
import { PostgresService } from './postgres.service.js';

@Module({
  providers: [PostgresService],
  exports: [PostgresService],
})
export class PostgresModule {}
