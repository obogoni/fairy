# Architecture decision records

An ADR records one decision: the context it was made in, the options weighed, what was chosen and what it costs. ADRs are never rewritten. When a decision changes, a new ADR supersedes the old one, and the old one's status says so.

Conventions in `docs/conventions/` say what to do. ADRs say why.

## When to write one

When a decision had real alternatives and someone might ask "why not X?" later. Defaults with no contest, such as Prettier's settings, don't need one.

Product and architecture decisions D1 to D10 live in [the first version's design](../../.design/first-version.md#key-decisions). ADRs here cite them and don't repeat them.

## Template

```markdown
# NNNN. Title

- **Status:** Accepted | Superseded by NNNN
- **Date:** YYYY-MM-DD
- **Decided by:** who, and where (ticket, PR)
- **Builds on:** D-numbers or ADRs

## Context
## Decision
## Alternatives considered
## Consequences
```

## Index

| ADR | Decision | Status |
|---|---|---|
| [0001](0001-react-spa-with-json-api.md) | React single-page app with a JSON API | Accepted |
| [0002](0002-nestjs-for-the-api.md) | NestJS for the API | Accepted |
| [0003](0003-drizzle-database-first-with-dbmate.md) | Drizzle, database first, migrations with dbmate | Accepted |
| [0004](0004-explicit-tenant-context-per-transaction.md) | Explicit tenant context per transaction | Accepted |
| [0005](0005-expand-contract-migrations.md) | Expand/contract migrations | Accepted |
| [0006](0006-no-staging-environment.md) | No staging environment | Accepted |
| [0007](0007-secrets-in-github.md) | Secrets in GitHub | Accepted |
| [0008](0008-grafana-cloud-for-observability.md) | Grafana Cloud for observability | Accepted |
| [0009](0009-docker-and-ansible-on-the-vm.md) | Docker and Ansible on the VM | Accepted |
| [0010](0010-blue-green-deploys-pushed-from-ci.md) | Blue-green deploys pushed from CI | Accepted |
| [0011](0011-terraform-for-cloudflare.md) | Terraform for Cloudflare | Accepted |
