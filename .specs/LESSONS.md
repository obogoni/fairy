# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Plan/Checks)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation - do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 - Check role creation for every SQL spelling: CREATE ROLE, CREATE USER (login by default), CREATE GROUP, and ALTER ROLE/USER ... LOGIN.
- signal: `weak_test` · recurrence: 1 feature(s) · scope: `migrations` · harmful: 0
- features: hello-world-skeleton
- evidence: C35 tests/repo/migrations-roles.test.ts (migrations)
- last seen: 2026-11-24T21:08:48Z

### L-002 - Name the test in every run proof line; a file path alone matches any passing test in that file.
- signal: `weak_test` · recurrence: 1 feature(s) · scope: `e2e` · harmful: 0
- features: hello-world-skeleton
- evidence: C4 proof line in checks.md (e2e)
- last seen: 2026-11-24T21:08:48Z

### L-003 - Log a header value only after validating its format, and use every header the logger reads as a canary carrier.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `logging` · harmful: 0
- features: hello-world-skeleton
- evidence: src/server/logging/request-line.ts ip field (logging)
- last seen: 2026-11-24T21:08:48Z

### L-004 - Prove a per-request logging rule on every serving path: API routes, static files served before the framework, and the SPA fallback.
- signal: `weak_test` · recurrence: 1 feature(s) · scope: `logging` · harmful: 0
- features: hello-world-skeleton
- evidence: C21 src/server/logging/logging.int.test.ts (logging)
- last seen: 2026-11-24T21:08:48Z

### L-005 - Guard files that must never change with git diff --diff-filter=a (everything but additions), not a list of change types.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `ci` · harmful: 0
- features: hello-world-skeleton
- evidence: scripts/check-migrations-untouched.sh diff-filter (ci)
- last seen: 2026-11-24T21:08:48Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
