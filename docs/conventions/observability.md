# Observability

Why: [ADR 0008](../adr/0008-grafana-cloud-for-observability.md).

## Shape

```
Nest app --OTLP, localhost--> Grafana Alloy --> Grafana Cloud, Brazil region
journald  ------------------> Alloy
VM CPU, memory, disk -------> Alloy
```

- The app uses only the OpenTelemetry SDK and pushes to Alloy on `localhost`. No `/metrics` endpoint.
- Alloy, a systemd service, is the only process that talks to Grafana Cloud. Its token has write scopes only.

## Metrics

- HTTP metrics follow OpenTelemetry semantic conventions: `http.server.request.duration` by method, **route pattern** and status.
- Fairy's own metrics start with `fairy.`, for example `fairy.appointment.save.duration`.
- Attributes take bounded, known values only: route pattern, method, status, outcome, color. **Never an id and never a value someone typed** (series count and D4). Per-tenant questions are answered from logs.

## Logs

- Loki labels: `service`, `env`, `color`, `level`. Everything else stays in the JSON body.

## Traces

Off. Turning them on needs an attribute allowlist and the canary test (logging.md) extended to spans, because auto-instrumentation records URLs and SQL.

## Dashboards and alerts

- Built in Grafana, then exported as JSON into `ops/grafana/`.
- Health checks and alerts never query the database on a schedule (server.md).
