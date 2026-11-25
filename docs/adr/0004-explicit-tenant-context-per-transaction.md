# 0004. Explicit tenant context per transaction

- **Status:** Accepted
- **Date:** 2026-11-23
- **Decided by:** obogoni (project owner), in spike #2
- **Builds on:** D2, ADR 0002, ADR 0003

## Context

D2 makes Postgres row-level security the tenant boundary. Connections are pooled, so the tenant setting must end with the transaction or it leaks to the next request on that connection.

In NestJS, the tenant can reach the query in three ways: passed explicitly as an argument, through a request-scoped provider, or through continuation-local storage (`nestjs-cls` and its transactional plugin).

## Decision

- Every query on tenant data runs inside `TenantDb.withTenant(tenantId, fn)`. It opens a transaction and runs `set_config('app.tenant_id', $1, true)`. The `true` makes the setting local to the transaction.
- Controllers read the tenant id with `@TenantId()` and pass it to services as an argument.
- Policies call `app_tenant_id()`, defined once in the first migration as `nullif(current_setting('app.tenant_id', true), '')::uuid`. When no tenant is set, it returns null and queries see no rows. The `nullif` matters: after a transaction that set the tenant, a pooled connection reads the setting as `''`, and casting that to `uuid` throws error 22P02 instead of returning no rows.

## Alternatives considered

- **CLS with a transactional plugin.** The more automatic, more "Nest-like" option. Rejected because it hides which code touches tenant data, and isolation is the thing most expensive to get wrong.
- **Request-scoped providers.** Nest re-creates the whole dependency chain on every request, which costs performance, and it hides the tenant the same way.

## Consequences

- The tenant id appears in the signature of every service method that touches tenant data, which is verbose but easy to review.
- Forgetting `withTenant` fails closed: RLS returns no rows instead of another tenant's.
- The three operations allowed before a tenant is known (D2) use narrow `security definer` functions, not `withTenant`.
