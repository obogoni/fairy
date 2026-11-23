# Observability

Decided 2026-11-23 in spike #2.

## Provider

[Grafana Cloud](https://grafana.com/products/cloud/free-tier/), free tier, with the stack in the **Brazil region (AWS `sa-east-1`)**, next to Neon.

- Free tier, read 2026-11-23: 50 GB of logs a month, 10k active metric series, alerting, 14-day retention. One dentist uses a tiny fraction of that.
- A stack's region can't be changed later. A move means a new stack, so the region is picked once, at sign-up.
- Grafana Labs is a foreign company and becomes a subprocessor, even with data at rest in Brazil. It goes on the go-live checklist (#11) with Cloudflare, Google and Neon.

## Shape

```
Nest app --OTLP, localhost--> Grafana Alloy --> Grafana Cloud (Prometheus metrics, Loki logs)
journald  ------------------> Alloy
VM CPU, memory, disk -------> Alloy
```

- **The app** emits metrics with the OpenTelemetry SDK and pushes them over OTLP to Alloy on `localhost`. It exposes no `/metrics` endpoint, so there's nothing for the Tunnel to leak.
- **Logs** stay as the logging convention says: pino to stdout to journald. Alloy reads journald for Fairy's units and ships the JSON lines.
- **Grafana Alloy** runs on the VM as a systemd service and is the only thing that talks to Grafana Cloud. The app knows only OpenTelemetry, so changing vendors means changing Alloy's config, not code.
- **To measure in the hello-world:** Alloy's memory use on the 1 GB VM (D9).

## Metrics

- HTTP server metrics follow OpenTelemetry semantic conventions: `http.server.request.duration` as a histogram by method, **route pattern** and status code.
- Fairy's own metrics are prefixed `fairy.`, for example `fairy.appointment.save.duration`.
- Attributes take only bounded, known values: route pattern, method, status, outcome, and the blue/green color. **Never an id** (tenant, appointment, request) and never a value typed by a person. That keeps the series count low and patient data out (D4).
- Per-tenant questions are answered from logs, which carry `tenantId`.

## Logs in Grafana

- Loki labels: `service`, `env`, `color`, `level`. Everything else stays in the JSON body. Ids are never labels.
- Grafana keeps 14 days. journald on the VM keeps a longer local copy with a size cap (logging.md).

## Traces

Off for now. HTTP and Postgres auto-instrumentation records URLs and SQL in span attributes. Turning traces on needs an allowlist of span attributes, and the canary test in logging.md must cover spans too.

## Dashboards and alerts

- Built in Grafana, then exported as JSON into `ops/grafana/` so they can be rebuilt.
- The observability work before go-live (PDI month 6) adds the SLOs (week read and save under 1 s at p95, save error rate) and alerts that reach the phone, each with a runbook.

## Credentials

Alloy uses a Grafana Cloud access policy token with **write scopes only** (metrics, logs). A leaked token can send data but can't read any. It lives with the VM's other secrets (environments-and-secrets.md).
