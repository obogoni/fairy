import {
  pgTable,
  pgPolicy,
  uuid,
  timestamp,
  foreignKey,
  unique,
  check,
  text,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const tenants = pgTable(
  'tenants',
  {
    id: uuid().primaryKey().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(id = app_tenant_id())`,
      withCheck: sql`(id = app_tenant_id())`,
    }),
  ],
);

export const greetings = pgTable(
  'greetings',
  {
    id: uuid().primaryKey().notNull(),
    tenantId: uuid('tenant_id').notNull(),
    message: text().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.tenantId],
      foreignColumns: [tenants.id],
      name: 'greetings_tenant_id_fkey',
    }),
    unique('greetings_tenant_id_id_key').on(table.id, table.tenantId),
    pgPolicy('tenant_isolation', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(tenant_id = app_tenant_id())`,
      withCheck: sql`(tenant_id = app_tenant_id())`,
    }),
    check(
      'greetings_message_check',
      sql`(char_length(message) >= 1) AND (char_length(message) <= 200)`,
    ),
  ],
);
