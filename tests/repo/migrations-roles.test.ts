import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

const dir = 'db/migrations';

const migrations = readdirSync(dir)
  .filter((file) => file.endsWith('.sql'))
  .map((file) => ({ file, sql: withoutComments(readFileSync(join(dir, file), 'utf8')) }));

/** The SQL that runs: `--` comments may explain the rule, so they are not checked. */
function withoutComments(sql: string): string {
  return sql.replace(/--.*$/gm, '').toLowerCase();
}

it('migrations create roles nologin and hold no password', () => {
  expect(migrations.length).toBeGreaterThan(0);
  for (const { sql } of migrations) {
    expect(sql).not.toMatch(/\bpassword\b/);
    // CREATE USER is CREATE ROLE ... LOGIN by default; ALTER USER is an alias of ALTER ROLE.
    for (const statement of sql.match(/create\s+(role|user|group)\s+[^;]+;/g) ?? []) {
      expect(statement).toMatch(/\bnologin\b/);
    }
    expect(sql).not.toMatch(/alter\s+(role|user|group)\s+\w+[^;]*\blogin\b/);
  }
  const all = migrations.map(({ sql }) => sql).join('\n');
  expect(all).toMatch(/create\s+role\s+fairy_app\s+nologin/);
  expect(all).toMatch(/create\s+role\s+fairy_admin\s+nologin/);
});
