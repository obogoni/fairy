# hello-world-skeleton proofs

**HEAD**: 76c0436
**Tree**: clean
**Shell**: /bin/sh
**Result**: 51 pass, 0 fail

| Check | Proof | Result |
| --- | --- | --- |
| C1 | `run int / ✓ GET /hello returns the demo greeting with no-store` | pass |
| C2 | `run int / ✓ GET /hello returns only the demo tenant's greeting` | pass |
| C3 | `run int / ✓ GET /hello answers 503 service_unavailable when the database is down` | pass |
| C4 | `run e2e / ✓ [phone] › e2e/hello.spec.ts:` | pass |
| C4 | `run e2e / ✓ [desktop] › e2e/hello.spec.ts:` | pass |
| C5 | `run e2e / ✓ [phone] › e2e/hello.spec.ts › shows Carregando while the greeting loads` | pass |
| C6 | `run e2e / ✓ [phone] › e2e/hello.spec.ts › retries after an error` | pass |
| C6 | `run e2e / ✓ [desktop] › e2e/hello.spec.ts › retries after an error` | pass |
| C7 | `run int / ✓ unknown GET paths fall back to index.html with no-cache` | pass |
| C8 | `run int / ✓ hashed assets are immutable for a year` | pass |
| C9 | `run int / ✓ GET /health/live is ok without the database` | pass |
| C10 | `run int / ✓ GET /health/ready is ok when select 1 succeeds` | pass |
| C10 | `run int / ✓ GET /health/ready is 503 unavailable when the database is down` | pass |
| C11 | `run unit / ✓ loadConfig names a missing DATABASE_URL` | pass |
| C11 | `run unit / ✓ loadConfig names a malformed DEMO_TENANT_ID without its value` | pass |
| C11 | `scripts/test-image.sh bad-config` | pass |
| C12 | `run int / ✓ isolation: tenant A reads only its own greetings` | pass |
| C13 | `run int / ✓ isolation: tenant A cannot update or delete tenant B's greeting` | pass |
| C14 | `run int / ✓ isolation: tenant A cannot insert a greeting for tenant B` | pass |
| C15 | `run int / ✓ isolation: no tenant context sees no rows` | pass |
| C16 | `run int / ✓ isolation: tenant context ends with the transaction on a pooled connection` | pass |
| C17 | `run int / ✓ schema: every tenant table has RLS enabled and forced` | pass |
| C18 | `run int / ✓ schema: fairy_app owns nothing and cannot bypass RLS` | pass |
| C19 | `run int / ✓ db:migrate applies everything once and is a no-op the second time` | pass |
| C20 | `run int / ✓ db:seed is idempotent` | pass |
| C21 | `run int / ✓ logging: one request line of chosen fields per request` | pass |
| C22 | `run int / ✓ logging: no canary reaches the logs` | pass |
| C23 | `run int / ✓ logging: database errors keep only code, constraint and table` | pass |
| C24 | `run int / ✓ errors: unexpected errors answer 500 internal_error without details` | pass |
| C25 | `run int / ✓ errors: validation errors list paths and codes without values` | pass |
| C26 | `scripts/check-no-console.sh` | pass |
| C27 | `run unit / ✓ ci workflow runs the eight gates on pull requests` | pass |
| C28 | `run unit / ✓ migrations gate fails when an existing migration is edited` | pass |
| C28 | `run unit / ✓ migrations gate fails when an existing migration is deleted` | pass |
| C28 | `run unit / ✓ migrations gate passes when a migration is added` | pass |
| C29 | `run int / ✓ schema sync gate fails on a stale generated schema` | pass |
| C29 | `run int / ✓ schema sync gate passes on the committed schema` | pass |
| C30 | `gh pr checks 19` | pass |
| C31 | `scripts/test-image.sh serve` | pass |
| C32 | `scripts/test-image.sh contents` | pass |
| C33 | `scripts/test-fresh-clone.sh` | pass |
| C34 | `pnpm install --frozen-lockfile && pnpm format:check && pnpm lint && pnpm typecheck && pnpm build` | pass |
| C35 | `run unit / ✓ migrations create roles nologin and hold no password` | pass |
| C36 | `run int / ✓ errors: unknown routes answer 404 not_found` | pass |
| C37 | `run unit / ✓ toolchain pins Node 26 and pnpm` | pass |
| C38 | `run e2e / ✓ [phone] › e2e/hello.spec.ts › shows the greeting` | pass |
| C38 | `run e2e / ✓ [desktop] › e2e/hello.spec.ts › shows the greeting` | pass |
| C39 | `run int / ✓ schema: every policy reads the tenant through app_tenant_id` | pass |
| C39 | `run int / ✓ schema: app_tenant_id is null when no tenant or an empty tenant is set` | pass |
| C40 | `run int / ✓ errors: other client errors answer bad_request, malformed JSON validation_error` | pass |
| C41 | `run unit / ✓ migrations gate fails when a new migration is not numbered above the base` | pass |

## Output

`Run int` - exit 0

```
 ✓ |integration| src/server/logging/logging.int.test.ts > logging > logging: one request line of chosen fields per request 86ms
 ✓ |integration| src/server/logging/logging.int.test.ts > logging > logging: no canary reaches the logs 58ms
 ✓ |integration| src/server/logging/logging.int.test.ts > logging > logging: database errors keep only code, constraint and table 14ms
 ✓ |integration| src/server/db/schema.int.test.ts > schema > db:seed is idempotent 1795ms
 ✓ |integration| src/server/db/schema.int.test.ts > schema > schema sync gate > schema sync gate passes on the committed schema 1488ms
 ✓ |integration| src/server/db/schema.int.test.ts > schema > schema sync gate > schema sync gate fails on a stale generated schema 1137ms

 Test Files  7 passed (7)
      Tests  28 passed (28)
   Start at  08:20:38
   Duration  6.08s (import 65%, tests 32%, transform 2%)

 Container fairy-db-1 Running 
 Container fairy-db-1 Waiting 
 Container fairy-db-1 Healthy
```

`Run e2e` - exit 0

```

  ✓  1 [desktop] › tests/e2e/hello.spec.ts:3:1 › shows the greeting (375ms)
  ✓  2 [phone] › tests/e2e/hello.spec.ts:3:1 › shows the greeting (345ms)
  ✓  3 [desktop] › tests/e2e/hello.spec.ts:9:1 › shows Carregando while the greeting loads (260ms)
  ✓  4 [phone] › tests/e2e/hello.spec.ts:9:1 › shows Carregando while the greeting loads (257ms)
  ✓  5 [desktop] › tests/e2e/hello.spec.ts:25:1 › retries after an error (274ms)
  ✓  6 [phone] › tests/e2e/hello.spec.ts:25:1 › retries after an error (312ms)

  6 passed (3.5s)
 Container fairy-db-1 Running 
 Container fairy-db-1 Waiting 
 Container fairy-db-1 Healthy 
$ nest build && vite build --config vite.config.mts
[WebServer] $ dbmate --env DATABASE_OWNER_URL --migrations-dir db/migrations --no-dump-schema --wait up --strict
[WebServer] $ tsx scripts/seed-demo.mts
```

`Run unit` - exit 0

```
 ✓ |unit| tests/repo/ci-workflow.test.ts > ci workflow runs the eight gates on pull requests 6ms
 ✓ |unit| tests/repo/migrations-gate.test.ts > migrations-untouched gate > migrations gate fails when an existing migration is edited 81ms
 ✓ |unit| src/server/config/config.test.ts > config > loadConfig accepts a valid environment 16ms
 ✓ |unit| src/server/config/config.test.ts > config > loadConfig names a missing DATABASE_URL 3ms
 ✓ |unit| src/server/config/config.test.ts > config > loadConfig names a malformed DEMO_TENANT_ID without its value 1ms
 ✓ |unit| src/server/config/config.test.ts > config > loadConfig never prints a malformed DATABASE_URL 1ms
 ✓ |unit| tests/repo/migrations-gate.test.ts > migrations-untouched gate > migrations gate fails when an existing migration is deleted 82ms
 ✓ |unit| tests/repo/migrations-gate.test.ts > migrations-untouched gate > migrations gate fails when an existing migration becomes a symlink 65ms
 ✓ |unit| tests/repo/migrations-gate.test.ts > migrations-untouched gate > migrations gate fails when a new migration is not numbered above the base 85ms
 ✓ |unit| tests/repo/migrations-gate.test.ts > migrations-untouched gate > migrations gate passes when a migration is added 52ms

 Test Files  5 passed (5)
      Tests  12 passed (12)
   Start at  08:20:52
   Duration  594ms (tests 50%, import 38%, worker 7%, transform 5%)
```

`scripts/test-image.sh bad-config` - exit 0

```
App exits 1 naming DEMO_TENANT_ID without its value.
```

`scripts/check-no-console.sh` - exit 0

```
no-console rejects console calls in server code.
```

`gh pr checks 19` - exit 0

```
Build	pass	34s	https://github.com/obogoni/fairy/actions/runs/45603159249/job/139167406467	
End to end, phone and desktop	pass	54s	https://github.com/obogoni/fairy/actions/runs/45603159249/job/139167820185	
Install, format, lint, types, migrations	pass	38s	https://github.com/obogoni/fairy/actions/runs/45603159249/job/139167035733	
Unit and integration tests, schema in sync	pass	44s	https://github.com/obogoni/fairy/actions/runs/45603159249/job/139167406511
```

`scripts/test-image.sh serve` - exit 0

```
Image serves /health/live and index.html.
```

`scripts/test-image.sh contents` - exit 0

```
Image runs as uid 1000 and has no dev dependencies.
```

`scripts/test-fresh-clone.sh` - exit 0

```
Applying: 0001_tenants_and_greetings.sql
Applied: 0001_tenants_and_greetings.sql in 6.901651ms
Demo tenant seeded.
Fresh clone shows the greeting.
 Network fairy-fresh-1846435_default Creating 
 Network fairy-fresh-1846435_default Created 
 Container fairy-fresh-1846435-db-1 Creating 
 Container fairy-fresh-1846435-db-1 Created 
 Container fairy-fresh-1846435-db-1 Starting 
 Container fairy-fresh-1846435-db-1 Started 
 Container fairy-fresh-1846435-db-1 Waiting 
 Container fairy-fresh-1846435-db-1 Healthy 
$ dbmate --env DATABASE_OWNER_URL --migrations-dir db/migrations --no-dump-schema --wait up --strict
$ tsx scripts/seed-demo.mts
```

`pnpm install --frozen-lockfile && pnpm format:check && pnpm lint && pnpm typecheck && pnpm build` - exit 0

```
All matched files use Prettier code style!
vite v8.3.8 building client environment for production...
transforming...
✓ 158 modules transformed.
rendering chunks...
computing gzip size...
dist/client/index.html                   0.39 kB │ gzip:   0.26 kB
dist/client/assets/index-cuj_S1Br.css    0.17 kB │ gzip:   0.14 kB
dist/client/assets/index-dIpneuGp.js   332.87 kB │ gzip: 101.51 kB

✓ built in 278ms
$ prettier --check .
$ eslint .
$ tsc -p tsconfig.server.json --noEmit && tsc -p tsconfig.client.json --noEmit && tsc -p tsconfig.tools.json --noEmit
$ nest build && vite build --config vite.config.mts
```
