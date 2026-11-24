import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';
import { seedDemo } from './demo-seed.js';
import { createDb } from './drizzle.js';
import { TenantDb } from './tenant-db.js';

const db = inject('db');

/** Runs as fairy_app inside a transaction with tenant context, like TenantDb does. */
async function asTenant<T>(
  client: pg.PoolClient | pg.Client,
  tenantId: string,
  fn: () => Promise<T>,
): Promise<T> {
  await client.query('begin');
  try {
    await client.query("select set_config('app.tenant_id', $1, true)", [tenantId]);
    return await fn();
  } finally {
    await client.query('rollback');
  }
}

describe('tenant isolation as fairy_app', () => {
  const tenantA = randomUUID();
  const tenantB = randomUUID();
  let app: pg.Client;
  let owner: pg.Client;
  let greetingB: string;

  beforeAll(async () => {
    await seedDemo(db.ownerUrl, tenantA, 'Greeting A');
    await seedDemo(db.ownerUrl, tenantB, 'Greeting B');
    owner = new pg.Client({ connectionString: db.ownerUrl });
    await owner.connect();
    const row = await owner.query<{ id: string }>('select id from greetings where tenant_id = $1', [
      tenantB,
    ]);
    greetingB = row.rows[0]?.id ?? '';
    app = new pg.Client({ connectionString: db.appUrl });
    await app.connect();
  });

  afterAll(async () => {
    await app.end();
    await owner.end();
  });

  it('isolation: tenant A reads only its own greetings', async () => {
    await asTenant(app, tenantA, async () => {
      const all = await app.query<{ tenant_id: string; message: string }>(
        'select tenant_id, message from greetings',
      );
      expect(all.rows).toEqual([{ tenant_id: tenantA, message: 'Greeting A' }]);
      const filteredOnB = await app.query('select * from greetings where tenant_id = $1', [
        tenantB,
      ]);
      expect(filteredOnB.rowCount).toBe(0);
    });
  });

  it("isolation: tenant A cannot update or delete tenant B's greeting", async () => {
    await asTenant(app, tenantA, async () => {
      const updated = await app.query("update greetings set message = 'hacked' where id = $1", [
        greetingB,
      ]);
      expect(updated.rowCount).toBe(0);
      const deleted = await app.query('delete from greetings where id = $1', [greetingB]);
      expect(deleted.rowCount).toBe(0);
    });
    const after = await owner.query('select message from greetings where id = $1', [greetingB]);
    expect(after.rows).toEqual([{ message: 'Greeting B' }]);
  });

  it('isolation: tenant A cannot insert a greeting for tenant B', async () => {
    await asTenant(app, tenantA, async () => {
      await expect(
        app.query('insert into greetings (id, tenant_id, message) values ($1, $2, $3)', [
          randomUUID(),
          tenantB,
          'planted',
        ]),
      ).rejects.toMatchObject({ code: '42501' });
    });
  });

  it('isolation: no tenant context sees no rows', async () => {
    const greetings = await app.query('select * from greetings');
    const tenants = await app.query('select * from tenants');
    expect(greetings.rowCount).toBe(0);
    expect(tenants.rowCount).toBe(0);
  });

  it('isolation: tenant context ends with the transaction on a pooled connection', async () => {
    const pool = new pg.Pool({ connectionString: db.appUrl, max: 1 });
    try {
      const tenantDb = new TenantDb(createDb(pool));
      const inside = await tenantDb.withTenant(tenantA, async (tx) => {
        const result = await tx.execute<{ message: string }>(sql`select message from greetings`);
        return result.rows;
      });
      expect(inside).toEqual([{ message: 'Greeting A' }]);
      // Same single connection, no tenant set: no rows, and no '' -> uuid cast error (22P02).
      const after = await pool.query('select * from greetings');
      expect(after.rowCount).toBe(0);
    } finally {
      await pool.end();
    }
  });
});
