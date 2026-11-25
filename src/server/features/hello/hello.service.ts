import { Injectable } from '@nestjs/common';
import { greetings } from '../../db/generated/schema.js';
import { TenantDb } from '../../db/tenant-db.js';

@Injectable()
export class HelloService {
  constructor(private readonly tenantDb: TenantDb) {}

  /** No `where tenant_id`: row-level security returns only this tenant's rows (D2). */
  async greeting(tenantId: string): Promise<string | undefined> {
    return this.tenantDb.withTenant(tenantId, async (tx) => {
      const rows = await tx.select({ message: greetings.message }).from(greetings).limit(1);
      return rows[0]?.message;
    });
  }
}
