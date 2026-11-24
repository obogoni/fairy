import { Global, Inject, Logger, Module, type OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import type { AppConfig } from '../config/config.js';
import { createDb } from './drizzle.js';
import { TenantDb } from './tenant-db.js';
import { DRIZZLE, PG_POOL } from './tokens.js';

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>): Pool => {
        const pool = new Pool({
          connectionString: config.get('DATABASE_URL', { infer: true }),
          // Small and quick to release idle connections, so Neon can sleep (D3); spike #3 tunes it.
          max: 5,
          idleTimeoutMillis: 10_000,
          connectionTimeoutMillis: 3_000,
        });
        const logger = new Logger('Pool');
        pool.on('error', (error) => {
          logger.error({ error: { class: error.name } }, 'pool.idle_client_error');
        });
        return pool;
      },
    },
    { provide: DRIZZLE, inject: [PG_POOL], useFactory: createDb },
    TenantDb,
  ],
  exports: [PG_POOL, DRIZZLE, TenantDb],
})
export class DbModule implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
