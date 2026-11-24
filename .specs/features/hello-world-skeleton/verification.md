# Hello-world skeleton verification

**Verdict**: FAIL
**Proofs**: `proofs.md` at 67b6282
**Verifier**: independent sub-agent (author != verifier)

## Checks

| Check | Test | Holds |
| --- | --- | --- |
| C1 | `src/server/features/hello/hello.int.test.ts` `GET /hello returns the demo greeting with no-store` | yes - exact body text and `no-store` |
| C2 | `src/server/features/hello/hello.int.test.ts` `GET /hello returns only the demo tenant's greeting` | yes - the other tenant is seeded first, and each app must return its own greeting, so a query that ignored the tenant fails one of the two |
| C3 | `src/server/features/hello/hello.int.test.ts` `GET /hello answers 503 service_unavailable when the database is down` | yes |
| C4 | `tests/e2e/hello.spec.ts` `shows the greeting` ([phone], [desktop]) | yes for the test. The proof does not select it, see findings |
| C5 | `tests/e2e/hello.spec.ts` `shows Carregando while the greeting loads` ([phone]) | yes - the response is held until the text is seen |
| C6 | `tests/e2e/hello.spec.ts` `retries after an error` ([phone], [desktop]) | yes |
| C7 | `src/server/features/spa/spa.int.test.ts` `unknown GET paths fall back to index.html with no-cache` | yes - `/agenda/semana` and `/` |
| C8 | `src/server/features/spa/spa.int.test.ts` `hashed assets are immutable for a year` | yes - exact header |
| C9 | `src/server/features/health/health.int.test.ts` `GET /health/live is ok without the database` | yes - the database URL is unreachable |
| C10 | `src/server/features/health/health.int.test.ts` `GET /health/ready is ok when select 1 succeeds`, `GET /health/ready is 503 unavailable when the database is down` | yes |
| C11 | `src/server/config/config.test.ts` `loadConfig names a missing DATABASE_URL`, `loadConfig names a malformed DEMO_TENANT_ID without its value`; `scripts/test-image.sh bad-config` | yes - the unit tests check the message, and the image script checks the exit code and output |
| C12 | `src/server/db/isolation.int.test.ts` `isolation: tenant A reads only its own greetings` | yes - exact rows without a filter, 0 rows when filtering on B |
| C13 | `src/server/db/isolation.int.test.ts` `isolation: tenant A cannot update or delete tenant B's greeting` | yes - rowCount 0 for both, and B's row is re-read as the owner |
| C14 | `src/server/db/isolation.int.test.ts` `isolation: tenant A cannot insert a greeting for tenant B` | yes - `code: '42501'` |
| C15 | `src/server/db/isolation.int.test.ts` `isolation: no tenant context sees no rows` | yes - covers `greetings` and `tenants`. It runs on a connection that earlier tests used, so it exercises the `''` setting. The never-set (null) case is only exercised when the test runs alone |
| C16 | `src/server/db/isolation.int.test.ts` `isolation: tenant context ends with the transaction on a pooled connection` | yes - pool `max: 1` with the real `TenantDb` |
| C17 | `src/server/db/schema.int.test.ts` `schema: every tenant table has RLS enabled and forced` | yes - it finds tables by their `tenant_id` column, not by a fixed list |
| C18 | `src/server/db/schema.int.test.ts` `schema: fairy_app owns nothing and cannot bypass RLS` | yes |
| C19 | `src/server/db/schema.int.test.ts` `db:migrate applies everything once and is a no-op the second time` | yes - names the only migration. A later migration would need the assertion extended |
| C20 | `src/server/db/schema.int.test.ts` `db:seed is idempotent` | yes - exact counts after two runs of the real script |
| C21 | `src/server/logging/logging.int.test.ts` `logging: one request line of chosen fields per request` | yes for `GET /hello?nome=Maria`. Narrow for "any request", see findings |
| C22 | `src/server/logging/logging.int.test.ts` `logging: no canary reaches the logs` | yes for the carriers it uses (body, query, `X-Paciente`, cookie). See findings for a header that leaks |
| C23 | `src/server/logging/logging.int.test.ts` `logging: database errors keep only code, constraint and table` | yes - exact key set, `23514`, constraint and table |
| C24 | `src/server/common/errors.int.test.ts` `errors: unexpected errors answer 500 internal_error without details` | yes |
| C25 | `src/server/common/errors.int.test.ts` `errors: validation errors list paths and codes without values` | yes - exact `errors` array, and the rejected value is absent |
| C26 | `scripts/check-no-console.sh` | yes - lints a probe file and requires the `no-console` rule in the output |
| C27 | `tests/repo/ci-workflow.test.ts` `ci workflow runs the eight gates on pull requests` | yes - it checks the commands and the `needs` order. It does not check for the Postgres service container on the test job |
| C28 | `tests/repo/migrations-gate.test.ts` `migrations gate fails when an existing migration is edited`, `migrations gate fails when an existing migration is deleted`, `migrations gate passes when a migration is added` | yes for the three named examples. See findings for a type change |
| C29 | `src/server/db/schema.int.test.ts` `schema sync gate fails on a stale generated schema`, `schema sync gate passes on the committed schema` | yes |
| C30 | `gh pr checks 19` | yes - PR #19's head is `67b6282` = HEAD, and all four jobs pass |
| C31 | `scripts/test-image.sh serve` | yes |
| C32 | `scripts/test-image.sh contents` | yes - `id -u` uses the image's own user |
| C33 | `scripts/test-fresh-clone.sh` | yes |
| C34 | `pnpm install --frozen-lockfile && pnpm format:check && pnpm lint && pnpm typecheck && pnpm build` | yes |
| C35 | `tests/repo/migrations-roles.test.ts` `migrations create roles nologin and hold no password` | no - misses `create user` and `alter user ... login` (fixed in 6b8cf60) |
| C36 | `src/server/common/errors.int.test.ts` `errors: unknown routes answer 404 not_found` | yes |
| C37 | `tests/repo/toolchain.test.ts` `toolchain pins Node 26 and pnpm` | yes |
| C38 | `tests/e2e/hello.spec.ts` `shows the greeting` ([phone], [desktop]) | yes - appended after verification; the proof names the test |

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| C35's test passes a migration that creates a login role. `CREATE USER` logs in by default and `ALTER USER` is an alias of `ALTER ROLE`, but the test only matches `create role` and `alter role` | A throwaway `db/migrations/9999_probe.sql` with `create user fairy_probe; alter user fairy_app with login;` left `migrations create roles nologin and hold no password` green | also match `create\s+user` (reject it outright, or require `nologin`) and `alter\s+(role\|user)\s+\w+[^;]*\blogin\b` | 6b8cf60 - C35's test matches `create (role\|user\|group)` and `alter (role\|user\|group) … login` |
| The C4 proof line does not select `shows the greeting`. `✓ [phone] › e2e/hello.spec.ts:` matches every passing phone test in the file, so it stays green when the greeting test fails | `check_proofs.py` `sees()` matches the words in order on any line. The `Run e2e` output has three `✓ … [phone] › tests/e2e/hello.spec.ts:` lines (3:1, 9:1, 25:1) | name the test in both proofs: `✓ [phone] › e2e/hello.spec.ts › shows the greeting` and `✓ [desktop] › e2e/hello.spec.ts › shows the greeting` | 6b8cf60 - appended C38, whose proofs name `shows the greeting` at both widths (checks can't be rewritten) |
| A header value reaches the logs unchecked. `request-line.ts` copies `CF-Connecting-IP` into `ip` as it is, so a canary sent in that header is logged. AC 22 covers "a header", and the test only uses `X-Paciente` | Throwaway int test: `GET /hello` with `CF-Connecting-IP: canario@example.com` logged `"ip":"canario@example.com"` on the request line. Behind the Tunnel, Cloudflare overwrites the header, but locally and on any path around the Tunnel a client controls it | log `ip` only when `net.isIP(value) !== 0`, and add `CF-Connecting-IP` as a canary carrier in `logging: no canary reaches the logs` | 6b8cf60 - `isIP` guard in `request-line.ts`; C22 sends the e-mail canary in `CF-Connecting-IP` |
| AC 21 ("any request") is proven on `GET /hello` only. Door 10 (asset requests wrote no line, fixed mid-build by mounting pino-http first) has no test, so moving the logger after static files again would pass every check | `logging: one request line of chosen fields per request` sends only `/hello?nome=Maria`. My throwaway probes show one line with a matching `X-Request-Id` today for `/assets/*` (200 and 404), the SPA fallback `/{*path}`, `POST` 404, malformed-JSON 400 and a 500. Nothing keeps that true | add requests for a hashed asset and the SPA fallback to C21's test, asserting one `request.completed` line each with `route` `/assets/*` and `/{*path}` and the `reqId` equal to `X-Request-Id` | 6b8cf60 - C21 now sends `/hello`, a hashed asset and the SPA fallback |
| The migrations-untouched gate misses a type change. `--diff-filter=MDR` leaves out `T`, so replacing an existing migration with a symlink passes. Low likelihood, but it changes the content dbmate would read | Throwaway repo: replacing `0001_first.sql` with a symlink and committing exited `0`. Rename, rename+edit, chmod and moving the file out of the folder all exited `1` | use `--diff-filter=a` (everything except added) in `scripts/check-migrations-untouched.sh` | 6b8cf60 - C28 `migrations gate fails when an existing migration becomes a symlink` |
