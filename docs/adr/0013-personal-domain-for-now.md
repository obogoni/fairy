# 0013. A personal domain until Fairy has a commercial name

- **Status:** Accepted
- **Date:** 2026-11-26
- **Decided by:** obogoni (project owner), for spike #20
- **Builds on:** D4, D9, ADR 0011 (supersedes its domain choice)

## Context

ADR 0011 chose a `.com.br` from registro.br. Fairy has no commercial name yet, and registering one now would pick a name before there is a product to name. The owner also wants a home for a blog and other personal projects.

Only the pilot dentist sees Fairy's address; patients never do. Moving to another domain later means a new hostname, a new Google OAuth redirect URL and `PUBLIC_URL`, and one more sign-in for the dentist.

Cloudflare's free Universal SSL certificate covers the apex domain and first-level subdomains only. A deeper name, such as `ssh.fairy.obogoni.dev`, gets no valid certificate without a paid option ([limitations](https://developers.cloudflare.com/ssl/edge-certificates/universal-ssl/limitations/), read 2026-11-26).

## Decision

- Fairy runs under the owner's personal domain `obogoni.dev`, registered at Cloudflare Registrar, so its DNS is on Cloudflare from the start.
- Fairy's hostnames are first-level only: the app at `fairy.obogoni.dev`, SSH at `fairy-ssh.obogoni.dev`.
- The zone is shared with the owner's other sites, so everything Fairy configures is scoped to its own hostnames:
  - **Cache bypass (D4):** a cache rule on `fairy.obogoni.dev` only.
  - **Rate limiting:** its rule matches only `fairy.obogoni.dev`.
  - **Session cookie:** host-only, with no `Domain` attribute, so no sibling site can read it.
  - **Terraform:** it manages only Fairy's records and rules, never the zone's other sites.

## Alternatives considered

- **A `.com.br` now (ADR 0011).** It reads local, but it commits to a name before the product has one, costs a second domain, and needs a nameserver change at registro.br.
- **A deeper name such as `app.fairy.obogoni.dev`.** It groups Fairy's names, but Universal SSL doesn't cover it.
- **A separate domain bought only for Fairy.** It isolates the zone, but it's still a name chosen too early.

## Consequences

- Zone-wide settings (TLS minimum, Always Use HTTPS, the WAF managed ruleset) apply to the blog too. That's fine for a blog, but they're decided with both in mind.
- The free plan's single rate-limiting rule is spent on Fairy's sign-in.
- `.dev` is on the HSTS preload list, so every site on the domain must serve HTTPS, which Cloudflare does.
- The public repo and the domain both carry the owner's name; the owner accepted that in ADR 0012.
- When Fairy gets a commercial name, a new ADR moves it, and this one becomes superseded.
