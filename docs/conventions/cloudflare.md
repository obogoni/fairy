# Cloudflare

Why: [ADR 0011](../adr/0011-terraform-for-cloudflare.md), [ADR 0013](../adr/0013-personal-domain-for-now.md), D4, D9.

## Hostnames

The domain is the owner's `obogoni.dev`, registered at Cloudflare Registrar (free plan), and shared with the owner's other sites.

| Hostname | Goes to | Reachable by |
|---|---|---|
| `fairy.obogoni.dev` | Tunnel → Caddy `127.0.0.1:8080` | everyone, through the proxy |
| `fairy-ssh.obogoni.dev` | Tunnel → `ssh://127.0.0.1:22` | Cloudflare Access only |

- Hostnames are first-level only (the free certificate doesn't cover `x.fairy.obogoni.dev`).
- **Scope Fairy's configuration to its hostnames.** The zone also serves other sites: rules match `fairy.obogoni.dev` or `fairy-ssh.obogoni.dev` where Cloudflare allows it, and Terraform manages only Fairy's records and rules. The exception is rate limiting (below).

## Terraform

- Everything on Cloudflare is Terraform in `ops/terraform/`. Never change it in the dashboard. A debugging change goes back into Terraform the same day.
- A PR touching `ops/terraform/` shows `terraform plan`. Merging runs `terraform apply`. One run at a time (concurrency group).
- State is in a private R2 bucket (it contains the Tunnel token).
- The Tunnel token goes from Terraform's output into cloud-init by hand, never into the repo.

## Tunnel

- One remotely managed Tunnel. Its routes come from Terraform, and `cloudflared` runs with the token only.

## Cache (D4)

- One cache rule, on `fairy.obogoni.dev` only: every path not under `/assets/` **bypasses the cache**.
- Browser cache TTL respects origin headers. The app's own `no-store` (framework.md) is an independent second guard.

## Client IP

- Read `CF-Connecting-IP`. Never `X-Forwarded-For` (clients can forge it).
- This holds only while the app is reachable only through the Tunnel.

## Access

- `fairy-ssh.obogoni.dev` has two policies: the owner's identity, and CI's service token.

## Zone settings

- Always Use HTTPS, minimum TLS 1.2, for the whole zone (`.dev` is HTTPS-only anyway). HSTS only after HTTPS is proven (it's hard to undo).
- The free WAF managed ruleset is on.
- The one free rate-limiting rule matches the path `/auth/*` on the whole zone (Free rules can't match a hostname). Other sites on the zone never use `/auth/`.
- Web Analytics is off, and so is anything that rewrites HTML or JS.
