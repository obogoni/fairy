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

- Plain SQL files in `db/migrations/`, numbered in sequence: `0001_create_tenants.sql`, `0002_...`.
- They only move forward. A shipped file is never edited: fix it with a new one.
- `scripts/migrate.ts` connects as the owner, takes an advisory lock, and applies each pending file in its own transaction. It records the file name and its SHA-256 in `schema_migrations`, and refuses to run if an applied file has changed.
- Roles, grants and RLS policies live in migrations like any other schema change.

## Drift guard

An integration test applies every migration to a fresh Postgres and checks:

1. Each Drizzle table in `schema.ts` matches `information_schema`: columns, types and nullability.
2. Every table with a `tenant_id` has RLS enabled and forced (`pg_class.relrowsecurity` and `relforcerowsecurity`).
3. `fairy_app` owns no table and lacks `BYPASSRLS`.
