# 0012. Public repository, all rights reserved

- **Status:** Accepted
- **Date:** 2026-11-24
- **Decided by:** obogoni (project owner), in spike #2
- **Builds on:** ADR 0007

## Context

The owner's GitHub account is on the Free plan. For a **private** repository, Free does not offer environment secrets, branch protection or rulesets, and Actions has about 2,000 Linux minutes a month. Production secrets would be readable by any workflow on any branch, and GitHub couldn't enforce the CI gates before merge.

Fairy also serves as the owner's portfolio: design doc, ADRs, isolation tests and a green pipeline.

A read-only scan of every branch, the full history, and every issue and PR found no secrets and no real patient or dentist data. It found the owner's personal e-mail on every commit, career motives in some ADRs, and descriptions of the pilot dentist's work, all of which the owner accepted as public.

## Decision

- The repository is public.
- It has **no license file**, so the code is all rights reserved: anyone can read it, nobody may copy, run or reuse it. That keeps the option of turning Fairy into a product.
- Production secrets live in a GitHub `production` environment that only `main` can deploy to.
- `main` is protected, requiring the CI gates before merge.

## Alternatives considered

- **Private on Free, compensated in workflow design.** The deploy re-runs every gate, and only `main` workflows touch secrets. Free, but these are conventions, not locks.
- **GitHub Pro (US$4 a month).** Private, with environments, protection and more minutes. It roughly doubles the monthly bill.

## Consequences

- Environment secrets, branch protection and Actions minutes are free.
- Everything published stays published: clones, forks and archives keep copies even if the repo goes private later. Making it private again protects only what comes after, and on Free it would turn environments and protection off again.
- Anything committed, and every issue or PR, must be fit to be public. Patient data never enters the repo (D4), and secrets live only in GitHub secrets or `.env`.
- Public container images would also be free. Images stay private unless that changes.
