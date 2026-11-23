# Tests and CI gates

Decided 2026-11-23 in spike #2.

## Levels

| Level | Runner | Touches | Lives in |
|---|---|---|---|
| Unit | Vitest | no I/O | `*.test.ts` next to the code |
| Integration | Vitest | real Postgres in Docker, migrated from scratch; the Nest app from `Test.createTestingModule`, called through `supertest` | `*.int.test.ts` next to the code |
| End to end | Playwright | the built app and real Postgres | `tests/e2e/` |

- Vitest compiles with esbuild, which doesn't emit decorator metadata, so Nest's dependency injection breaks. Vitest uses `unplugin-swc` instead, following the SWC recipe in Nest's docs.
- Unit tests build services with `Test.createTestingModule` and override providers only for things outside our control, such as Google. Never the database.

- Mocking the database is not allowed. Isolation is a Postgres property, so it is tested on Postgres.
- **Isolation proof (D2).** Integration tests run as `fairy_app` with two tenants. For every tenant-owned table they assert that tenant A cannot read, update or delete tenant B's rows, or reference them, with or without a `where tenant_id`. Each slice that adds a table extends this.
- **Widths (D10).** Playwright runs every e2e test in two projects: a phone (`devices['Pixel 7']`) and a desktop browser (`Desktop Chrome`).
- **Test data (D4).** Data is fake and generated. No real patient name or phone appears in a fixture, a seed or a snapshot.

## CI gates

Every pull request runs these, and all of them must pass before merge:

1. `pnpm install --frozen-lockfile`
2. Prettier check and ESLint
3. `tsc --noEmit`
4. Migrations untouched: no file under `db/migrations/` that exists on `main` is modified or deleted
5. Unit and integration tests, with Postgres as a CI service container
6. Schema in sync: `pnpm db:migrate` on the fresh database, then `pnpm db:pull`, then `git diff --exit-code src/server/db/generated`
7. Build of the client and the server
8. Playwright against the build, at both widths
