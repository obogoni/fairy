# Data access

Decided 2026-11-23 in spike #2.

## Tools

- Drizzle ORM on the `node-postgres` (`pg`) driver, with `casing: 'snake_case'`. Raw SQL through Drizzle's `sql` tag is fine wherever it reads better.
- `src/server/db/schema.ts` describes the tables for Drizzle's types. It mirrors the migrations and never generates them: **do not run `drizzle-kit generate` or `drizzle-kit push`**. Migrations are hand-written SQL (migrations-and-ids.md).

## Roles (D2)

| Role | Used by | Rights |
|---|---|---|
| owner | `scripts/migrate.ts` | owns the tables; used only to migrate |
| `fairy_app` | the app | not the owner, no `BYPASSRLS`; created in a migration, never in Neon's console |
| `fairy_admin` | the owner's admin command | manages invitations |

## Tenant context

Every query on tenant data runs inside `withTenant`:

```ts
export function withTenant<T>(tenantId: string, fn: (tx: Tx) => Promise<T>) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.tenant_id', ${tenantId}, true)`);
    return fn(tx);
  });
}
```

- `true` makes the setting local to the transaction, so it ends with the transaction and never leaks through the pool (D2).
- Policies read `current_setting('app.tenant_id', true)::uuid`. With no tenant set, the value is null and the query sees no rows.
- Work done before a tenant is known runs outside `withTenant`, through narrow `security definer` functions. Only the three operations D2 allows get one.

## Pool

The app owns one `pg.Pool`, with a small `max` and a short `idleTimeoutMillis` so idle connections close and Neon can sleep (D3). Spike #3 sets the values.
