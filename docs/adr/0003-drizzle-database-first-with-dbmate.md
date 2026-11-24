# 0003. Drizzle, database first, migrations with dbmate

- **Status:** Accepted
- **Date:** 2026-11-23
- **Decided by:** obogoni (project owner), in spike #2
- **Builds on:** D2, D3

## Context

Learning Postgres is one of the reasons Fairy exists. Tenant isolation through row-level security (D2) is the riskiest part of the design, and it needs the tenant set in every transaction.

The owner likes Drizzle, and wants migrations as plain SQL files numbered in sequence. Drizzle's own migration tool, `drizzle-kit generate`, writes one timestamped folder per migration with a snapshot, not a flat list of numbered `.sql` files.

For new TypeScript backends the common choices are an ORM (Prisma) or a typed query builder (Drizzle, Kysely). Plain SQL on `pg` is common but less so in new projects.

## Decision

Database first:

- Hand-written SQL migrations in `db/migrations/`, numbered `0001_name.sql`, applied by [dbmate](https://github.com/amacneil/dbmate). dbmate takes the leading digits as the version and refuses out-of-order files with `--strict`.
- After migrating, [`drizzle-kit pull`](https://orm.drizzle.team/docs/drizzle-kit-pull) reads the database and generates the Drizzle schema. That's Drizzle's documented database-first workflow.
- Drizzle, on the `pg` driver, is used for queries only.

## Alternatives considered

- **Drizzle code-first.** Drizzle's default: the TypeScript schema is the source and `drizzle-kit generate` writes the SQL. Rejected because the files aren't a flat numbered list.
- **Drizzle with a hand-mirrored schema and a custom migration runner.** Proposed first, then withdrawn: two sources of truth, plus a homemade runner and drift test that no other project uses.
- **Plain SQL on `pg`.** Teaches the most SQL, but row types are written by hand.
- **Kysely.** A typed builder with no schema of its own and hand-written migrations. Reasonable, but the owner preferred Drizzle.
- **Prisma.** The most installed, but it hides SQL and makes RLS clumsy.

## Consequences

- Every `create table`, policy and grant is written by hand, which serves the learning goal.
- Generated schema files are committed. CI regenerates them on a fresh database and fails on any difference.
- dbmate records only the version number, so it can't tell that an applied file changed. A CI gate rejects changes to existing migration files.
- `drizzle-kit generate`, `migrate` and `push` must never run.
