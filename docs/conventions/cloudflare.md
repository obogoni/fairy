# Cloudflare

Why: [ADR 0011](../adr/0011-terraform-for-cloudflare.md), [ADR 0013](../adr/0013-personal-domain-for-now.md), D4, D9.

## Hostnames

The domain is the owner's `obogoni.dev`, registered at Cloudflare Registrar (free plan), and shared with the owner's other sites.

| Hostname | Goes to | Reachable by |
|---|---|---|
| `fairy.obogoni.dev` | Tunnel → Caddy `127.0.0.1:8080` | everyone, through the proxy |
| `fairy-ssh.obogoni.dev` | Tunnel → `ssh://127.0.0.1:22` | Cloudflare Access only |

- Hostnames are first-level only (the free certificate doesn't cover `x.fairy.obogoni.dev`).
- **Scope everything to Fairy's hostnames.** The zone also serves other sites: every rule matches `fairy.obogoni.dev` or `fairy-ssh.obogoni.dev`, and Terraform manages only Fairy's records and rules.

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
- The one free rate-limiting rule covers `fairy.obogoni.dev/auth/*`.
- Web Analytics is off, and so is anything that rewrites HTML or JS.
