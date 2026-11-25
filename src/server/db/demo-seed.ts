import pg from 'pg';
import { v7 as uuidv7 } from 'uuid';

export const DEMO_GREETING = 'Olá do banco de dados!';

/**
 * Seeds a tenant and one greeting for it. Idempotent. Fake data only (D4).
 * A script, never a migration: migrations also run on the clean go-live database (D3).
 * Connects as the owner; RLS is forced on the owner too, so it sets the tenant like the app does.
 */
export async function seedDemo(
  ownerUrl: string,
  tenantId: string,
  message = DEMO_GREETING,
): Promise<void> {
  const client = new pg.Client({ connectionString: ownerUrl });
  await client.connect();
  try {
    await client.query('begin');
    await client.query("select set_config('app.tenant_id', $1, true)", [tenantId]);
    await client.query('insert into tenants (id) values ($1) on conflict (id) do nothing', [
      tenantId,
    ]);
    await client.query(
      `insert into greetings (id, tenant_id, message)
       select $1, $2, $3
       where not exists (select 1 from greetings where tenant_id = $2)`,
      [uuidv7(), tenantId, message],
    );
    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    await client.end();
  }
}
