# Identifiers and migrations

Why: [ADR 0003](../adr/0003-drizzle-database-first-with-dbmate.md), [ADR 0005](../adr/0005-expand-contract-migrations.md).

## Identifiers

- Primary keys are UUIDv7, generated in the app with the `uuid` package. The client generates booking submission ids the same way (D6).
- Ids are opaque. Never derive one from data.

## Tables

- Names are plural snake_case. Columns are snake_case.
- Every tenant-owned table has `tenant_id uuid not null`, RLS `enable`d and `force`d, and a policy on `tenant_id`.
- References between tenant-owned tables are composite, `(tenant_id, x_id)` → `unique (tenant_id, id)`, because foreign-key checks bypass RLS (D2).
- Instants are `timestamptz`. An appointment's agreed time is a local `date` plus `time` (D5).
- Appointments are never deleted. Cancelling is a state change (D8).

## Migrations

- Hand-written SQL in `db/migrations/`, numbered `0001_name.sql`, applied by dbmate as the owner role.
- Each file has `-- migrate:up` and an empty `-- migrate:down`.
- dbmate always runs with `--strict` and `--no-dump-schema`.
- Roles, grants and RLS policies live in migrations like any other schema change.
- **Never edit or delete a migration that exists on `main`** (dbmate tracks only the number; a CI gate enforces this). Fix with a new file.
- **Expand/contract.** A migration only adds: tables, nullable or defaulted columns, indexes, policies. Remove, rename or tighten only in a later release, once no deployed version uses the old shape. A rename is add and write both → backfill and read new → drop old.

## Schema checks

An integration test migrates a fresh Postgres and asserts:

1. Every table with `tenant_id` has RLS enabled and forced.
2. `fairy_app` owns no table and lacks `BYPASSRLS`.
