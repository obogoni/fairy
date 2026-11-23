# Tests and CI gates

Decided 2026-11-23 in spike #2.

## Levels

| Level | Runner | Touches | Lives in |
|---|---|---|---|
| Unit | Vitest | no I/O | `*.test.ts` next to the code |
| Integration | Vitest | real Postgres in Docker, migrated from scratch; the Fastify app through `app.inject()` | `*.int.test.ts` next to the code |
| End to end | Playwright | the built app and real Postgres | `tests/e2e/` |

- Mocking the database is not allowed. Isolation is a Postgres property, so it is tested on Postgres.
- **Isolation proof (D2).** Integration tests run as `fairy_app` with two tenants. For every tenant-owned table they assert that tenant A cannot read, update or delete tenant B's rows, or reference them, with or without a `where tenant_id`. Each slice that adds a table extends this.
- **Widths (D10).** Playwright runs every e2e test in two projects: a phone (`devices['Pixel 7']`) and a desktop browser (`Desktop Chrome`).
- **Test data (D4).** Data is fake and generated. No real patient name or phone appears in a fixture, a seed or a snapshot.

## CI gates

Every pull request runs these, and all of them must pass before merge:

1. `pnpm install --frozen-lockfile`
2. Prettier check and ESLint
3. `tsc --noEmit`
4. Unit and integration tests, with Postgres as a CI service container
5. Build of the client and the server
6. Playwright against the build, at both widths
