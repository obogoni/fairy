# Hello-world skeleton checks

Build: none - the repo has no code before this feature; the build, format, lint and type check it creates are proven by C34 at `HEAD`
Run unit: `pnpm vitest run --project unit --reporter=verbose`
Run int: `docker compose up -d --wait db && pnpm vitest run --project integration --reporter=verbose`
Run e2e: `docker compose up -d --wait db && pnpm build && pnpm exec playwright test --reporter=list`
Plan: `.specs/features/hello-world-skeleton/plan.md`

41 checks in 6 slices · 13 one-way doors · 0 open, of which 0 block

Proofs run with Node 26 on `PATH` (`mise exec node@26 -- python3 …/check_proofs.py hello-world-skeleton`) and Docker available.

## Checks

### S1 - The page shows a greeting read through RLS

**C1** - `GET /hello` with the demo tenant seeded answers `200`, body exactly `{"message":"Olá do banco de dados!"}`, header `Cache-Control: no-store` (AC 1)
Proof: run int | ✓ GET /hello returns the demo greeting with no-store

**C2** - With two tenants seeded, `GET /hello` returns only the `DEMO_TENANT_ID` tenant's greeting, never "Outro tenant" (AC 2)
Proof: run int | ✓ GET /hello returns only the demo tenant's greeting

**C3** - With the database unreachable, `GET /hello` answers `503`, `application/problem+json`, `"type":"service_unavailable"` (AC 3)
Proof: run int | ✓ GET /hello answers 503 service_unavailable when the database is down

**C4** - At `Pixel 7` and `Desktop Chrome` sizes, `/` shows "Fairy" and "Olá do banco de dados!" (AC 4)
Proof: run e2e | ✓ [phone] › e2e/hello.spec.ts:
Proof: run e2e | ✓ [desktop] › e2e/hello.spec.ts:

**C5** - While `GET /hello` has not answered, the page shows "Carregando…" (AC 5)
Proof: run e2e | ✓ [phone] › e2e/hello.spec.ts › shows Carregando while the greeting loads

**C6** - When `GET /hello` fails, the page shows "Não foi possível carregar." and "Tentar de novo"; pressing it after the API recovers shows the greeting (AC 6)
Proof: run e2e | ✓ [phone] › e2e/hello.spec.ts › retries after an error
Proof: run e2e | ✓ [desktop] › e2e/hello.spec.ts › retries after an error

**C7** - `GET /agenda/semana` answers `200` with the SPA `index.html` and `Cache-Control: no-cache` (AC 7)
Proof: run int | ✓ unknown GET paths fall back to index.html with no-cache

**C8** - A hashed file under `/assets/` answers `Cache-Control: public, max-age=31536000, immutable` (AC 8)
Proof: run int | ✓ hashed assets are immutable for a year

**C9** - `GET /health/live` answers `200 {"status":"ok"}` with the database unreachable (AC 9)
Proof: run int | ✓ GET /health/live is ok without the database

**C10** - `GET /health/ready` answers `200 {"status":"ok"}` with the database up and `503 {"status":"unavailable"}` with it down (AC 10)
Proof: run int | ✓ GET /health/ready is ok when select 1 succeeds
Proof: run int | ✓ GET /health/ready is 503 unavailable when the database is down

**C11** - A missing or malformed `DATABASE_URL` or `DEMO_TENANT_ID` makes startup fail, naming the variable and never printing its value (AC 11)
Proof: run unit | ✓ loadConfig names a missing DATABASE_URL
Proof: run unit | ✓ loadConfig names a malformed DEMO_TENANT_ID without its value
Proof: `scripts/test-image.sh bad-config`

### S2 - One tenant can never reach another's rows

**C12** - With tenant A's context, `select * from greetings` as `fairy_app` returns only A's rows; filtering on B's id returns 0 rows (AC 12)
Proof: run int | ✓ isolation: tenant A reads only its own greetings

**C13** - With tenant A's context, `update` and `delete` of B's greeting affect 0 rows, and B's row is unchanged (AC 13)
Proof: run int | ✓ isolation: tenant A cannot update or delete tenant B's greeting

**C14** - With tenant A's context, inserting a greeting with `tenant_id` = B fails with SQLSTATE `42501` (AC 14)
Proof: run int | ✓ isolation: tenant A cannot insert a greeting for tenant B

**C15** - With no tenant context, `greetings` and `tenants` return 0 rows as `fairy_app`, with no error (AC 15)
Proof: run int | ✓ isolation: no tenant context sees no rows

**C16** - With pool `max: 1`, after `withTenant(A)` finishes, a plain select on the same connection returns 0 rows, not `22P02` (AC 16)
Proof: run int | ✓ isolation: tenant context ends with the transaction on a pooled connection

**C17** - After migrating an empty database, every table with `tenant_id`, and `tenants`, has RLS enabled and forced (AC 17)
Proof: run int | ✓ schema: every tenant table has RLS enabled and forced

**C18** - After migrating, `fairy_app` owns no table and lacks `BYPASSRLS` (AC 18)
Proof: run int | ✓ schema: fairy_app owns nothing and cannot bypass RLS

**C19** - `pnpm db:migrate` on an empty database applies every migration and exits 0; a second run applies nothing and exits 0 (AC 19)
Proof: run int | ✓ db:migrate applies everything once and is a no-op the second time

**C20** - `pnpm db:seed` run twice leaves exactly one demo tenant and one greeting for it (AC 20)
Proof: run int | ✓ db:seed is idempotent

### S3 - Logs never carry patient data

**C21** - Every request writes exactly one JSON line with `reqId`, `method`, `route` pattern, `status`, `ms`, and sets `X-Request-Id` to that `reqId`; `GET /hello?nome=Maria` logs `route: "/hello"` and no `nome=Maria` (AC 21)
Proof: run int | ✓ logging: one request line of chosen fields per request

**C22** - The canaries `Paciente Canário Zé`, `+55 11 98888-7777`, `canario@example.com`, `sid=canario-secret`, sent in body, query, header and cookie through a success path, a `400`, a unique violation and a check violation, appear in no log line (AC 22)
Proof: run int | ✓ logging: no canary reaches the logs

**C23** - A logged database error has the error class, `code`, `constraint` and `table`, and no `message`, `detail`, `query` or `params`; a check violation logs `code: "23514"` (AC 23)
Proof: run int | ✓ logging: database errors keep only code, constraint and table

**C24** - An unexpected error answers `500` problem `internal_error` with no stack or error message in the body (AC 24)
Proof: run int | ✓ errors: unexpected errors answer 500 internal_error without details

**C25** - A body failing Zod validation answers `400` problem `validation_error` whose `errors` hold paths and codes, never the rejected values (AC 25)
Proof: run int | ✓ errors: validation errors list paths and codes without values

**C26** - Server code with a `console.*` call fails lint (AC 26)
Proof: `scripts/check-no-console.sh`

### S4 - A pull request runs the eight gates

**C27** - `.github/workflows/ci.yml` runs on `pull_request` and has the eight gates, with e2e after build and build after the checks it depends on (AC 27)
Proof: run unit | ✓ ci workflow runs the eight gates on pull requests

**C28** - The migrations-untouched gate fails when a file on `main` is edited or deleted and passes when one is added (AC 28)
Proof: run unit | ✓ migrations gate fails when an existing migration is edited
Proof: run unit | ✓ migrations gate fails when an existing migration is deleted
Proof: run unit | ✓ migrations gate passes when a migration is added

**C29** - The schema-in-sync gate fails when the committed generated schema differs from a fresh `db:pull` (AC 29)
Proof: run int | ✓ schema sync gate fails on a stale generated schema
Proof: run int | ✓ schema sync gate passes on the committed schema

**C30** - On pull request #19, every CI gate job passes (AC 30)
Proof: `gh pr checks 19`

### S5 - One image runs the whole app

**C31** - `docker build .` produces an image that serves `GET /health/live` → `200` and `GET /` → `index.html` (AC 31)
Proof: `scripts/test-image.sh serve`

**C32** - The image runs as a non-root user and contains neither `node_modules/vitest` nor `node_modules/@playwright/test` (AC 32)
Proof: `scripts/test-image.sh contents`

**C33** - From a fresh clone, `docker compose up -d db`, `pnpm db:migrate`, `pnpm db:seed` and `pnpm dev`, with `.env` from `.env.example`, serve a page showing "Olá do banco de dados!" (AC 33)
Proof: `scripts/test-fresh-clone.sh`

### Cross-cutting

**C34** - From a clean tree, `pnpm install --frozen-lockfile`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck` and `pnpm build` all exit 0 (plan Shape, CI gates 1-3 and 7)
Proof: `pnpm install --frozen-lockfile && pnpm format:check && pnpm lint && pnpm typecheck && pnpm build`

**C35** - No migration creates a role that can log in or sets a password; `fairy_app` and `fairy_admin` are created `nologin` (Landing door 2)
Proof: run unit | ✓ migrations create roles nologin and hold no password

**C36** - An unknown API route on a non-GET method, `POST /nao-existe`, answers `404` problem `not_found` (Landing door 4)
Proof: run int | ✓ errors: unknown routes answer 404 not_found

**C37** - `.nvmrc` is `26`, `engines.node` is `>=26 <27`, and `packageManager` pins `pnpm@12.23.0` (Landing door 6)
Proof: run unit | ✓ toolchain pins Node 26 and pnpm

**C38** - The greeting test itself passes at both sizes: `/` shows "Fairy" and "Olá do banco de dados!" on `Pixel 7` and `Desktop Chrome` (AC 4; appended after verification: C4's proof line matched any passing test in the file)
Proof: run e2e | ✓ [phone] › e2e/hello.spec.ts › shows the greeting
Proof: run e2e | ✓ [desktop] › e2e/hello.spec.ts › shows the greeting

### S6 - Fixes from the pull request review

**C39** - Every policy reads the tenant only through `app_tenant_id()`, which is null when the setting was never set or reads `''` (AC 34)
Proof: run int | ✓ schema: every policy reads the tenant through app_tenant_id
Proof: run int | ✓ schema: app_tenant_id is null when no tenant or an empty tenant is set

**C40** - A body over the limit answers `413 bad_request`; malformed JSON stays `400 validation_error` (AC 35)
Proof: run int | ✓ errors: other client errors answer bad_request, malformed JSON validation_error

**C41** - The migrations gate fails when the branch adds a migration not numbered above the highest on `main` (AC 36)
Proof: run unit | ✓ migrations gate fails when a new migration is not numbered above the base

## Coverage

| Set (size) | Member -> proof | Unproven |
| --- | --- | --- |
| `GET /hello` statuses (2) | 200 C1 · 503 C3 | - |
| `GET /health/live` statuses (1) | 200 C9 | - |
| `GET /health/ready` statuses (2) | 200 C10 · 503 C10 | - |
| `GET /*` SPA fallback statuses (1) | 200 C7 | - |
| Landing doors (6) | 1 tables C12, C17 · 2 roles C35, C18 · 3 null-safe policy C16, C15 · 4 error contract C3, C24, C25, C36 · 5 health paths C9, C10 · 6 toolchain C37 | - |
| problem `type` codes (5) | `validation_error` C25, C40 · `bad_request` C40 · `not_found` C36 · `service_unavailable` C3 · `internal_error` C24 | - |
| page states (4) | loading C5 · success C4, C38 · error C6 · retry C6 | - |
| widths (2) | `Pixel 7` C4, C38, C6 · `Desktop Chrome` C4, C38, C6 | - |
| `Cache-Control` by response (3) | API `no-store` C1 · assets `immutable` C8 · `index.html` `no-cache` C7 | - |
| isolation operations as `fairy_app` (5) | select C12 · update C13 · delete C13 · insert C14 · no context C15 | - |
| AC 16 example (1) | pooled connection after `withTenant` C16 | - |
| canary paths (4) | success C22 · `400` C22 · unique violation C22 · check violation C22 | - |
| canary carriers (5) | body C22 · query C22 · header `X-Paciente` C22 · header `CF-Connecting-IP` C22 · cookie C22 | - |
| canary values (4) | name C22 · phone C22 · e-mail C22 · cookie C22 | - |
| CI gates (8) | install C27, C34 · format+lint C27, C34 · typecheck C27, C34 · migrations untouched C27, C28 · unit+int C27, C30 · schema sync C27, C29 · build C27, C34 · e2e C27, C30 | - |
| migrations gate examples (5) | edit C28 · delete C28 · type change C28 · add C28 · number not above base C41 | - |
| startup config: assemblies (3) | `src/server/main.ts` C11, C31 · integration test harness C1 · Docker image C11, C31 | - |
| required env vars (2) | `DATABASE_URL` C11 · `DEMO_TENANT_ID` C11 | - |

## Swept

- validation: C11, C25
- failure modes: C3, C10, C24
- idempotency: C19, C20
- authorization: C12, C13, C14, C15, C16, C18; `GET /hello` is public by decision (plan Assumptions), no sign-in exists yet
- concurrency: n/a - no write path in this feature; one read per request, and the pooled-connection leak C16 covers is the concurrency risk here
- data lifecycle: C20; the greeting is only read, never edited, so no round trip to prove
- dependency failure: C3, C9, C10
- state transitions: n/a - nothing in this feature moves through states
- observability: C21, C22, C23, C26

## Handoff

- **Settled mid-build:** user granted the `workflow` scope to `gh` so the CI workflow could be pushed (2026-11-24)
- **Dispatched:** Verifier, round 1, at 67b6282 - returned FAIL with 5 findings, all closed in 6b8cf60
- **Boundary:** C1-C37 closed at 434ed21; CI run 45484480977 green on PR #19
- **Abandoned:** corepack for pnpm (not in Node 26); committing drizzle-kit pull's full output (random file names); nestjs-pino's own HTTP middleware (skipped static files); a hardcoded port in the fresh-clone proof (55432 is taken on the owner's machine)
- **Walked:** - (no capture binds; the page's states are proven by Playwright at both widths, C4-C6)
