# 0008. Grafana Cloud for observability

- **Status:** Accepted
- **Date:** 2026-11-23
- **Decided by:** obogoni (project owner), in spike #2
- **Builds on:** D3, D4, D9, ADR 0007

## Context

The first plan kept logs only in journald on the VM: free, no new vendor, and six months of one dentist's logs is tens of MB. But logs on the VM are lost when it's rebuilt (D9), can be erased by an intruder, and nothing watches them.

The owner wants Fairy run the way a real company would, with metrics as well as logs. Alerts are needed before go-live anyway.

Free tiers, read 2026-11-23:

| | Free tier | Retention | Data in Brazil |
|---|---|---|---|
| [Grafana Cloud](https://grafana.com/products/cloud/free-tier/) | 50 GB logs/month, 10k active series, alerting | 14 days | Yes: AWS `sa-east-1`, self-serve ([regions](https://grafana.com/docs/grafana-cloud/security-and-account-management/regional-availability/)) |
| [New Relic](https://newrelic.com/pricing/free-tier) | 100 GB/month, one full user | about 8 days | No (US or EU) |
| [Better Stack](https://betterstack.com/pricing) | 3 GB logs, 30 GB metrics | 3 days | Unclear |
| [Axiom](https://axiom.co/docs/reference/limits) | free plan, caps unclear | 30 days | Unclear |

## Decision

Grafana Cloud, free tier, with the stack in the Brazil region:

- **Metrics:** the app emits them with OpenTelemetry and pushes them to Grafana Alloy on `localhost`.
- **Logs:** Alloy reads them from journald, where the app's pino output lands.
- **VM:** Alloy also collects CPU, memory and disk.

Alloy is the only process that talks to Grafana Cloud, using a write-only token. Traces stay off.

## Alternatives considered

- **journald only.** Free and no new vendor, with the weaknesses above.
- **New Relic.** A larger free volume, but no data in Brazil and a proprietary stack.
- **Better Stack, Axiom.** Shorter or unclear retention, unclear regions, and less transferable skills.

## Consequences

- Grafana Labs becomes a foreign subprocessor, even with data at rest in Brazil. It is on the go-live checklist (#11).
- The stack's region can't be changed later, so it is picked once, at sign-up.
- Prometheus, Loki, Grafana and OpenTelemetry are what most companies run, which is transferable learning.
- The app depends only on OpenTelemetry. Changing vendors means changing Alloy's config.
- Alloy's memory on the 1 GB VM is measured in the hello-world.
- Traces need an attribute allowlist before they're turned on: auto-instrumentation records URLs and SQL.
