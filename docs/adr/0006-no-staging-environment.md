# 0006. No staging environment

- **Status:** Accepted
- **Date:** 2026-11-23
- **Decided by:** obogoni (project owner), in spike #2
- **Builds on:** D3, D4, D9

## Context

Fairy is on a budget and runs on one 1 GB VM (D9). Until go-live, production holds only fake data (D3), so a bad deploy can't hurt a patient. Real data may never leave production (D4), so a staging copy of production data isn't allowed either.

The owner's development plan listed "a preview environment per PR" for month 3.

## Decision

Three environments: `local`, `test` and `production`. There is no staging and no preview per PR. CI, including Playwright at phone and desktop widths, is the gate before production. Blue-green deploys (ADR 0010) make rollback fast.

Discovery [#18](https://github.com/obogoni/fairy/issues/18) revisits this after go-live, with real incidents as evidence.

## Alternatives considered

- **Staging on the same VM.** A second process, Tunnel hostname and free Neon database. No extra cost, but it competes for 1 GB of memory.
- **Staging on its own VM.** Fully separate, about R$20 a month more.
- **Preview per PR.** The most expensive in memory or money, for checks CI already makes.

## Consequences

- Anything CI can't test, such as real Google sign-in or Cloudflare config, is first exercised in production. Before go-live that only touches fake data.
- The plan's month-3 preview task is replaced by blue-green plus a timed rollback.
