import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type { Db, Tx } from './drizzle.js';
import { DRIZZLE } from './tokens.js';

/**
 * The only way to query tenant data (ADR 0004). The tenant is set with `set_config(..., true)`,
 * local to the transaction, so it ends with it and never leaks through the pool (D2).
 */
@Injectable()
export class TenantDb {
  constructor(@Inject(DRIZZLE) private readonly db: Db) {}

  withTenant<T>(tenantId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`select set_config('app.tenant_id', ${tenantId}, true)`);
      return fn(tx);
    });
  }
}
