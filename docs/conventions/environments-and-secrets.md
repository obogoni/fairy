# Environments and secrets

Why: [ADR 0006](../adr/0006-no-staging-environment.md), [ADR 0007](../adr/0007-secrets-in-github.md).

## Environments

| `APP_ENV` | Where | Database | Data |
|---|---|---|---|
| `local` | developer machine | Postgres in Docker | fake, generated |
| `test` | Vitest and Playwright, locally and in CI | Postgres in Docker or a CI service container | fake, generated per run |
| `production` | the VM | Neon in São Paulo | fake until go-live, real after |

- No staging and no preview environments.
- `local` and `test` never connect to Neon.
- Real data never leaves production: no dumps, no Neon branches from production, no copying rows to debug (D4).
- Go-live starts on a clean paid database, never the pre-go-live one (D3).

## Configuration

- Configuration comes only from environment variables, validated by Zod at startup.
- `.env.example` is committed with fake values. `.env` is gitignored.
- No secret ever gets a `VITE_` prefix (Vite ships those to the browser).
- Connections to Neon use TLS with certificate verification.

| Variable | Used by | Present in |
|---|---|---|
| `APP_ENV`, `PUBLIC_URL` | app | everywhere |
| `DATABASE_URL` | app, as `fairy_app` | everywhere |
| `DATABASE_OWNER_URL` | dbmate | local, test, CI; **never the VM** |
| `DATABASE_ADMIN_URL` | admin command | the owner's laptop only |
| `GOOGLE_ISSUER`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | sign-in | everywhere; a mock issuer in `test` |
| `TUNNEL_TOKEN` | `cloudflared` | the VM only |
| `GRAFANA_CLOUD_TOKEN` and endpoints | Alloy; write-only scopes | the VM only |
| `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET` | deploy, provision and rollback workflows | CI only |
| `CLOUDFLARE_API_TOKEN` | Terraform | CI only |
| `TF_STATE_R2_ACCESS_KEY_ID`, `TF_STATE_R2_SECRET_ACCESS_KEY` | Terraform state | CI; the owner's laptop for debugging |

## Secrets

- GitHub Actions secrets are the source of truth. Locally, use `.env`.
- Workflows write the VM's secrets to root-owned `0600` files. Nothing else puts secrets on the VM.
- Each environment has its own Google OAuth client, and production's allows only production's redirect URL.
- Rotate a secret when it may have leaked or someone loses access, then redeploy.

## Sign-in in tests

Tests sign in through a mock OIDC issuer in Docker, set by `GOOGLE_ISSUER`. **No bypass, test flag or fake-login route in the code.**
