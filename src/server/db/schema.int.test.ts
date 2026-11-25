import { spawnSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { appendFileSync, cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';
import { describe, expect, inject, it } from 'vitest';
import { migrate, query } from '../test-support/global-setup.js';
import { withDatabase } from '../test-support/urls.js';

const db = inject('db');

async function rows<T extends pg.QueryResultRow>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const client = new pg.Client({ connectionString: db.ownerUrl });
  await client.connect();
  try {
    return (await client.query<T>(sql, params)).rows;
  } finally {
    await client.end();
  }
}

describe('schema', () => {
  it('schema: every tenant table has RLS enabled and forced', async () => {
    const tables = await rows<{ relname: string; rls: boolean; forced: boolean }>(`
      select c.relname, c.relrowsecurity as rls, c.relforcerowsecurity as forced
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
        and (c.relname = 'tenants' or exists (
          select 1 from pg_attribute a
          where a.attrelid = c.oid and a.attname = 'tenant_id' and not a.attisdropped))
      order by c.relname`);
    expect(tables.map((table) => table.relname)).toEqual(['greetings', 'tenants']);
    for (const table of tables) {
      expect(table, table.relname).toMatchObject({ rls: true, forced: true });
    }
  });

  it('schema: every policy reads the tenant through app_tenant_id', async () => {
    const policies = await rows<{ table: string; qual: string | null; check: string | null }>(`
      select tablename as table, qual, with_check as check
      from pg_policies where schemaname = 'public' order by tablename`);
    expect(policies.map((policy) => policy.table)).toEqual(['greetings', 'tenants']);
    for (const policy of policies) {
      for (const expression of [policy.qual, policy.check]) {
        expect(expression, policy.table).toContain('app_tenant_id()');
        expect(expression, policy.table).not.toContain('current_setting');
      }
    }
  });

  it('schema: app_tenant_id is null when no tenant or an empty tenant is set', async () => {
    const result = await rows<{ never_set: string | null; emptied: string | null }>(`
      select app_tenant_id() as never_set,
             (select set_config('app.tenant_id', '', false) is not null) and app_tenant_id() is null
               as emptied`);
    expect(result).toEqual([{ never_set: null, emptied: true }]);
  });

  it('schema: fairy_app owns nothing and cannot bypass RLS', async () => {
    const owned = await rows("select tablename from pg_tables where tableowner = 'fairy_app'");
    expect(owned).toEqual([]);
    const role = await rows<{ rolbypassrls: boolean; rolsuper: boolean }>(
      "select rolbypassrls, rolsuper from pg_roles where rolname = 'fairy_app'",
    );
    expect(role).toEqual([{ rolbypassrls: false, rolsuper: false }]);
  });

  it('db:migrate applies everything once and is a no-op the second time', async () => {
    const name = `fairy_test_migrate_${randomBytes(4).toString('hex')}`;
    await query(db.adminUrl, `create database ${name}`);
    try {
      const url = withDatabase(db.adminUrl, name);
      const first = migrate(url);
      expect(first.status).toBe(0);
      expect(first.output).toContain('Applied: 0001_tenants_and_greetings.sql');
      const second = migrate(url);
      expect(second.status).toBe(0);
      expect(second.output).not.toContain('Applying');
    } finally {
      await query(db.adminUrl, `drop database if exists ${name} with (force)`);
    }
  });

  it('db:seed is idempotent', async () => {
    const tenant = randomUUID();
    const env = { ...process.env, DATABASE_OWNER_URL: db.ownerUrl, DEMO_TENANT_ID: tenant };
    for (let run = 0; run < 2; run++) {
      const result = spawnSync('pnpm', ['-s', 'db:seed'], { env, encoding: 'utf8' });
      expect(result.status, result.stderr).toBe(0);
    }
    const counts = await rows<{ tenants: string; greetings: string }>(
      `select (select count(*) from tenants where id = $1) as tenants,
              (select count(*) from greetings where tenant_id = $1) as greetings`,
      [tenant],
    );
    expect(counts).toEqual([{ tenants: '1', greetings: '1' }]);
  });

  describe('schema sync gate', () => {
    function gate(committedDir?: string) {
      return spawnSync('scripts/check-schema-sync.sh', committedDir ? [committedDir] : [], {
        env: { ...process.env, DATABASE_OWNER_URL: db.ownerUrl },
        encoding: 'utf8',
      });
    }

    it('schema sync gate passes on the committed schema', () => {
      const result = gate();
      expect(result.status, result.stderr).toBe(0);
    });

    it('schema sync gate fails on a stale generated schema', () => {
      const stale = mkdtempSync(join(tmpdir(), 'fairy-schema-'));
      try {
        cpSync('src/server/db/generated', stale, { recursive: true });
        appendFileSync(join(stale, 'schema.ts'), '\nexport const removedTable = 1;\n');
        expect(gate(stale).status).toBe(1);
      } finally {
        rmSync(stale, { recursive: true, force: true });
      }
    });
  });
});
