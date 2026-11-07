import { Module } from '@nestjs/common';
import { PostgresModule } from '../../infrastructure/postgres/postgres.module.js';
import { SqlPlaygroundController } from './sql-playground.controller.js';
import { SqlPlaygroundService } from './sql-playground.service.js';

@Module({
  imports: [PostgresModule],
  controllers: [SqlPlaygroundController],
  providers: [SqlPlaygroundService],
})
export class SqlPlaygroundModule {}
