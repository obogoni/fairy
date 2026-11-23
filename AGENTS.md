# Project

Fairy is a dentist business management app.

## Tenets

- Fairy is from Brazil, so app UI text should be in PT-BR. Code, docs and tickets are in English.
- Fairy is a cloud native multitenant solution.
- Fairy follows a "deploy first" approach, every feature slice should be deployable from day one.
- Fairy is on a budget, cost should always be considered for deployment decisions and third party integrations.

## Workflow

- Use tickets to track work. Every PR closes its Issue.
- Before creating or triaging a ticket, read [docs/ai/tickets.md](docs/ai/tickets.md).
- After implementation, once the Verifier finishes and all gates have passed, push the branch and open the PR without asking.
- Use /pr for opening PRs.
## Conventions

Every spec and implementation follows these:

- [Repo layout and code style](docs/conventions/layout-and-style.md)
- [Framework and request format](docs/conventions/framework.md)
- [Data access and tenant context](docs/conventions/data-access.md)
- [Identifiers and migrations](docs/conventions/migrations-and-ids.md)
- [Tests and CI gates](docs/conventions/tests-and-ci.md)
- [Environments and secrets](docs/conventions/environments-and-secrets.md)
- [Logging](docs/conventions/logging.md)
- [Observability: metrics, dashboards and alerts](docs/conventions/observability.md)
