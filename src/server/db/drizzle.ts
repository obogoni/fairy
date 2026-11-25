import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';
import * as relations from './generated/relations.js';
import * as schema from './generated/schema.js';

const fullSchema = { ...schema, ...relations };

export type Db = NodePgDatabase<typeof fullSchema>;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

export function createDb(pool: Pool): Db {
  return drizzle({ client: pool, schema: fullSchema });
}
