import { defineConfig } from 'drizzle-kit';

// Database first (ADR 0003): this config is only for `drizzle-kit pull`.
// Never run `drizzle-kit generate`, `migrate` or `push`.
const url = process.env.DATABASE_OWNER_URL;
if (!url) {
  throw new Error('DATABASE_OWNER_URL is required for drizzle-kit pull');
}

export default defineConfig({
  dialect: 'postgresql',
  out: process.env.DRIZZLE_OUT ?? 'src/server/db/generated',
  dbCredentials: { url },
  schemaFilter: ['public'],
  tablesFilter: ['!schema_migrations'],
  introspect: { casing: 'camel' },
});
