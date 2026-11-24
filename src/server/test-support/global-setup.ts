import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import pg from 'pg';
import type { TestProject } from 'vitest/node';
import { withDatabase, withUser } from './urls.js';

export interface TestDatabase {
  adminUrl: string;
  ownerUrl: string;
  appUrl: string;
}

declare module 'vitest' {
  export interface ProvidedContext {
    db: TestDatabase;
  }
}

const ADMIN_URL =
  process.env.TEST_ADMIN_URL ?? 'postgres://postgres:postgres@localhost:5432/postgres';

/** Postgres runs locally in compose and in CI as a service; tests never mock it (tests-and-ci.md). */
export async function query(url: string, sql: string): Promise<void> {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    await client.query(sql);
  } finally {
    await client.end();
  }
}

export function migrate(ownerUrl: string): { status: number | null; output: string } {
  const result = spawnSync('pnpm', ['-s', 'db:migrate'], {
    env: { ...process.env, DATABASE_OWNER_URL: ownerUrl },
    encoding: 'utf8',
  });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

/** One fresh, migrated database per run, dropped at the end. */
export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  const name = `fairy_test_${randomBytes(4).toString('hex')}`;
  await query(ADMIN_URL, `create database ${name}`);
  const ownerUrl = withDatabase(ADMIN_URL, name);

  const migration = migrate(ownerUrl);
  if (migration.status !== 0) {
    throw new Error(`Migrations failed:\n${migration.output}`);
  }

  // Migrations create fairy_app without login (door 2); tests enable it here. Locally the
  // password matches docker/db-init so dev keeps working; CI passes its own.
  const password = process.env.TEST_FAIRY_APP_PASSWORD ?? 'fairy_app_local';
  const client = new pg.Client({ connectionString: ADMIN_URL });
  await client.connect();
  await client.query(`alter role fairy_app login password ${client.escapeLiteral(password)}`);
  await client.end();

  project.provide('db', {
    adminUrl: ADMIN_URL,
    ownerUrl,
    appUrl: withUser(ownerUrl, 'fairy_app', password),
  });

  return async () => {
    await query(ADMIN_URL, `drop database if exists ${name} with (force)`);
  };
}
