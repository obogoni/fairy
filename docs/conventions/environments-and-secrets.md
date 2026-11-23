# Environments and secrets

Decided 2026-11-23 in spike #2.

## Environments

| `APP_ENV` | Where | Database | Data |
|---|---|---|---|
| `local` | the developer's machine | Postgres in Docker (`docker compose`) | fake, generated |
| `test` | Vitest and Playwright, locally and in CI | Postgres in Docker; a service container in CI | fake, generated per run |
| `production` | the VM (D9) | Neon in São Paulo (D3) | fake until go-live, real after |

- There is no staging. CI, including Playwright at both widths, is the gate before production, and blue-green deploys make rollback fast. Discovery #18 revisits staging and previews per PR after go-live.
- Before go-live, production runs on Neon Free with fake data. Go-live starts on a clean paid database (D3), so no fake row is ever mixed with real ones.
- Real data never leaves production. No dumps, no Neon branches from production, and no copying rows to debug. Every other environment uses generated data (D4).
- `local` and `test` never connect to Neon.

## Configuration

- Configuration comes only from environment variables. `@nestjs/config` reads them and a Zod schema validates them at startup, so the app fails fast on a missing or malformed value (framework.md).
- `.env.example` is committed and lists every variable, with fake values. `.env` is gitignored.
- Vite exposes only `VITE_`-prefixed variables to the client. No secret ever gets that prefix.

| Variable | Used by | Present in |
|---|---|---|
| `APP_ENV` | app | everywhere |
| `PUBLIC_URL` | app, for redirects and cookies | everywhere |
| `DATABASE_URL` | app, as `fairy_app` | everywhere |
| `DATABASE_OWNER_URL` | dbmate | local, test, the CI deploy job; **never the VM** |
| `DATABASE_ADMIN_URL` | admin command, as `fairy_admin` | the owner's laptop only |
| `GOOGLE_ISSUER`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | sign-in | everywhere; a mock issuer in `test` |
| `TUNNEL_TOKEN` | `cloudflared`, not the app | the VM only |

Connections to Neon use TLS with certificate verification.

## Secrets

- **Source of truth:** GitHub Actions secrets, on the `production` environment. Locally, secrets live in `.env`.
- The VM holds only what the running app and the Tunnel need. The deploy job writes them to a root-owned `0600` file that the service manager loads at start. How the deploy job reaches the VM is set in the server convention.
- The owner's database credentials stay in CI. The admin credentials stay on the owner's laptop. A compromised VM can read and write tenant data under RLS, but cannot change the schema, bypass RLS or create invitations.
- Each environment has its own Google OAuth client. Production's client allows only production's redirect URL.
- Sessions are random ids stored in the database (Tenant slice), so there is no signing key to manage.
- **Rotation:** rotate a secret when it may have leaked or when someone loses access, then deploy. GitHub secrets can't be read back, so to rebuild the VM, run the deploy again.

## Sign-in in tests

Tests sign in through a mock OIDC issuer in Docker, set by `GOOGLE_ISSUER`. The code has no bypass, test flag or fake-login route, so production can't ship one by mistake.

## Open

GitHub environment secrets on a **private** repository need GitHub Pro, Team or Enterprise ([GitHub docs](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)). On GitHub Free, use repository secrets instead, and let only the deploy workflow use them, triggered by a push to `main`. The owner confirms which plan applies.
