# 0005. Expand/contract migrations

- **Status:** Accepted
- **Date:** 2026-11-23
- **Decided by:** obogoni (project owner), in spike #2
- **Builds on:** ADR 0003, ADR 0010

## Context

Deploys are blue-green (ADR 0010): for a moment, the old and new versions run against the same database. A rollback switches the code back but never undoes migrations, because undoing one can lose data written in between. So the previous release must keep working on the newest schema.

## Decision

Migrations follow expand/contract:

- **Expand:** a migration only adds things: tables, nullable columns or columns with defaults, indexes, policies.
- **Contract:** removing, renaming or tightening (`not null` on an existing column, a narrower type) happens in a later release, once no deployed version uses the old shape.
- A rename takes three releases: add the new column and write to both, then backfill and read the new one, then drop the old one.

## Alternatives considered

- **Down migrations and rolling back the schema.** Rejected: undoing a migration can lose data written after it, and dbmate's down sections would be untested code.
- **Taking downtime for breaking changes.** Possible at Fairy's size, but it breaks the rehearsed, timed rollback the owner's plan asks for.

## Consequences

- Removals and renames take more than one release.
- Down sections in migration files stay empty.
- Reviewers check each migration against the previous release's code.
