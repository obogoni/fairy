# Tests and CI gates

Why: D2, D4, D10, [ADR 0002](../adr/0002-nestjs-for-the-api.md).

## Levels

| Level | Runner | Touches | Lives in |
|---|---|---|---|
| Unit | Vitest | no I/O | `*.test.ts` next to the code |
| Integration | Vitest | real Postgres in Docker, migrated from scratch; the Nest app via `Test.createTestingModule` and `supertest` | `*.int.test.ts` next to the code |
| End to end | Playwright | the built app and real Postgres | `tests/e2e/` |

- Vitest compiles with `unplugin-swc` (esbuild drops the decorator metadata Nest needs), following Nest's SWC recipe.
- Never mock the database. Override only providers outside our control, such as Google.
- **Isolation (D2).** Tests run as `fairy_app` with two tenants. For every tenant-owned table, tenant A cannot read, update, delete or reference tenant B's rows, with or without a `where tenant_id`. Each new table extends this.
- **Widths (D10).** Every e2e test runs in two Playwright projects: `devices['Pixel 7']` and `Desktop Chrome`.
- **Test data (D4).** Fake and generated. No real patient name or phone in fixtures, seeds or snapshots.

## CI gates

Every pull request must pass all of these:

1. `pnpm install --frozen-lockfile`
2. Prettier check and ESLint
3. `tsc --noEmit`
4. No file under `db/migrations/` that exists on `main` is modified or deleted
5. Unit and integration tests, with Postgres as a service container
6. `pnpm db:migrate`, `pnpm db:pull`, then `git diff --exit-code src/server/db/generated`
7. Client and server build
8. Playwright against the build, at both widths
