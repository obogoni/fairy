# Data access

Why: [ADR 0003](../adr/0003-drizzle-database-first-with-dbmate.md), [ADR 0004](../adr/0004-explicit-tenant-context-per-transaction.md).

## Tools

- Drizzle on the `pg` driver, for queries. Raw SQL through Drizzle's `sql` tag is fine where it reads better.
- The schema comes from the database. `pnpm db:migrate` runs dbmate, then `pnpm db:pull` runs `drizzle-kit pull` into `src/server/db/generated/` with `introspect.casing: 'camel'`, and formats it.
- Commit the migration and the regenerated schema together. Never edit generated files.
- **Never run `drizzle-kit generate`, `migrate` or `push`.** Only dbmate changes the schema.

## Roles (D2)

| Role | Used by | Rights |
|---|---|---|
| owner | dbmate, from CI | owns the tables; migrations only |
| `fairy_app` | the app | not the owner, no `BYPASSRLS`; created in a migration, never in Neon's console (console roles bypass RLS) |
| `fairy_admin` | the owner's admin command | manages invitations |

## Tenant context

Every query on tenant data runs inside `TenantDb.withTenant`:

```ts
@Injectable()
export class TenantDb {
  constructor(@Inject(DRIZZLE) private readonly db: Db) {}

  withTenant<T>(tenantId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`select set_config('app.tenant_id', ${tenantId}, true)`);
      return fn(tx);
    });
  }
}
```

- Pass the tenant id as an argument from `@TenantId()` to the service. Never use request-scoped providers or CLS for it.
- **Policies call `app_tenant_id()`**, for example `using (tenant_id = app_tenant_id()) with check (tenant_id = app_tenant_id())`. Never read the setting in a policy directly (after a transaction, a pooled connection reads it as `''`, and `''::uuid` throws). With no tenant set, queries see no rows. A schema test fails on any policy that doesn't use it.
- Work done before a tenant is known uses narrow `security definer` functions, only for the three operations D2 allows.

## Pool

One `pg.Pool` with a small `max` and a short `idleTimeoutMillis`, so Neon can sleep (D3). Spike #3 sets the values.
