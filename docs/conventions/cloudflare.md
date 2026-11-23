# Cloudflare

Decided 2026-11-23 in spike #2. Applies D4 (patient data stays in the database) and D9 (one fixed-price server in São Paulo, behind Cloudflare).

## Domain

A `.com.br` domain registered at registro.br, with its nameservers pointed to Cloudflare (free plan).

| Hostname | Goes to | Who can reach it |
|---|---|---|
| `app.<domain>` | Tunnel → Caddy on `127.0.0.1:8080` (server.md) | everyone, through the proxy |
| `ssh.<domain>` | Tunnel → `ssh://127.0.0.1:22` | only through Cloudflare Access |

The apex domain stays free for a future landing page.

## Configuration as code: Terraform

Everything on Cloudflare is managed with Cloudflare's official Terraform provider, in `ops/terraform/`: DNS records, the Tunnel and its routes, the cache rule, Access, and zone settings. Nothing is changed by hand in the dashboard. If something is changed there while debugging, it goes back into Terraform the same day.

- **State** lives in a private Cloudflare R2 bucket, using Terraform's S3 backend. R2's free tier covers it, and Cloudflare is already a vendor. The state contains secrets, including the Tunnel token, so the bucket is never public.
- **Runs:** a pull request that touches `ops/terraform/` runs `terraform plan` and shows the plan in the workflow summary. Merging to `main` runs `terraform apply`. A GitHub Actions concurrency group lets only one run touch the state at a time.
- **Credentials:** a Cloudflare API token scoped to this zone and to the account's Tunnel and Access settings, plus R2 keys for the state bucket. CI only (environments-and-secrets.md).
- **Bootstrapping:** Terraform creates the Tunnel before the VM exists. The owner copies the Tunnel token from Terraform's output into the cloud-init user data when creating the VM (server.md). The token is never committed.

## Tunnel

- One Tunnel, remotely managed: its routes live in Cloudflare, set by Terraform, and `cloudflared` on the VM runs with only the Tunnel token.
- The free plan includes 1,000 tunnels per account and up to 25 replicas per tunnel ([account limits](https://developers.cloudflare.com/cloudflare-one/account-limits/)). Fairy uses one tunnel and one replica.
- The VM's public address takes no web traffic: `ufw` denies all inbound (server.md). Cloudflare can't be bypassed, because there is nothing listening to bypass it to.

## Cache (D4)

Cloudflare caches common static file types by default and doesn't cache HTML or JSON. It also skips anything marked `no-store` or that sets a cookie ([default cache behavior](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/)). Fairy doesn't rely on defaults:

- **One cache rule:** any path not under `/assets/` (Vite's hashed files) **bypasses the cache**. The free plan allows 10 cache rules.
- The app also sends `Cache-Control: no-store` on every API response (framework.md), so the two guards are independent.
- Browser cache TTL is set to respect the origin's headers.

## Client IP

- The app reads the client address from `CF-Connecting-IP` (D9). It never uses `X-Forwarded-For`, which a client can forge.
- That header can be trusted only because the app is reachable only through the Tunnel. If that ever changes, this rule changes with it.

## Access (SSH)

- One Access application on `ssh.<domain>`, with two policies: the owner's identity (one-time PIN to the owner's e-mail, or Google) and CI's service token.
- Cloudflare One's free plan covers this. Seat limits and signup requirements, such as whether a payment method is needed, are confirmed at sign-up.

## Zone settings

- SSL/TLS: Always Use HTTPS, minimum TLS 1.2. HSTS is turned on once the hello-world works over HTTPS, since it's hard to undo.
- WAF: the free managed ruleset on.
- Rate limiting: one rule on the free plan, used on `/auth/*` against sign-in abuse. The exact free-plan limits are confirmed when the rule is created.
- Off: Cloudflare Web Analytics and anything that rewrites the app's HTML or JS (D4, and no surprises in the SPA).

## To confirm in the hello-world

- Terraform's S3 backend against R2: the settings it needs, and whether state locking works there. The concurrency group covers locking either way.
- The Cloudflare One free plan: seats, and whether signup asks for a payment method
- The free-plan rate limiting rule's limits
