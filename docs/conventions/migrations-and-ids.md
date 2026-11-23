# Identifiers and migrations

Decided 2026-11-23 in spike #2.

## Identifiers

- Primary keys are UUIDv7, generated in the app with the `uuid` package. The client generates the submission id of a booking form the same way (D6). UUIDv7 ids sort by creation time and don't reveal how many rows exist.
- Ids are opaque. Never derive one from data.

## Tables

- Names are plural snake_case (`appointments`). Columns are snake_case.
- Every tenant-owned table has `tenant_id uuid not null`. RLS is `enable`d and `force`d, with a policy on `tenant_id` (data-access.md).
- Foreign-key checks bypass RLS (D2). So a reference between tenant-owned tables is composite: `(tenant_id, x_id)` references a `unique (tenant_id, id)` on the target, and a row can never point into another tenant.
- Instants such as `created_at` and `expires_at` are `timestamptz`. An appointment's agreed time is a local `date` plus `time` (D5).
- No `delete` on appointments (D8). Cancelling is a state change.

## Migrations

The database is the source of truth. Migrations are hand-written SQL, and the Drizzle schema is generated from the migrated database (data-access.md).

- [dbmate](https://github.com/amacneil/dbmate), installed from npm, applies the files in `db/migrations/`. Files are numbered in sequence: `0001_create_tenants.sql`, `0002_...`. dbmate records the number in `schema_migrations`.
- Each file has a `-- migrate:up` section and an empty `-- migrate:down` section. Migrations only move forward: to fix one, add a new file.
- dbmate runs each file in a transaction and always runs with `--strict`, so an out-of-order file fails. It runs with `--no-dump-schema`, because the pulled Drizzle schema already shows the current shape.
- It connects as the owner role. Roles, grants and RLS policies live in migrations like any other schema change.
- dbmate records only the number, so it can't tell that an applied file changed. A CI gate rejects any pull request that modifies or deletes an existing migration (tests-and-ci.md).

## Schema checks

An integration test applies every migration to a fresh Postgres and checks:

1. Every table with a `tenant_id` has RLS enabled and forced (`pg_class.relrowsecurity` and `relforcerowsecurity`).
2. `fairy_app` owns no table and lacks `BYPASSRLS`.
