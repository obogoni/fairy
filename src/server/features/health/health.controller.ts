import { Controller, Get, Inject, Res } from '@nestjs/common';
import type { Response } from 'express';
import type { Pool } from 'pg';
import { Public } from '../../common/public.decorator.js';
import { PG_POOL } from '../../db/tokens.js';

type HealthStatus = { status: 'ok' } | { status: 'unavailable' };

@Controller('health')
export class HealthController {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  /** Never touches the database, so uptime checks don't keep Neon awake (D3, server.md). */
  @Public()
  @Get('live')
  live(): HealthStatus {
    return { status: 'ok' };
  }

  /** Only the deploy calls this, before switching traffic to a new color. */
  @Public()
  @Get('ready')
  async ready(@Res({ passthrough: true }) res: Response): Promise<HealthStatus> {
    try {
      await this.pool.query('select 1');
      return { status: 'ok' };
    } catch {
      res.status(503);
      return { status: 'unavailable' };
    }
  }
}
