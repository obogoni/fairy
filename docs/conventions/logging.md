# Logging

Why: D4, [ADR 0008](../adr/0008-grafana-cloud-for-observability.md).

## Rule

Logs never contain patient names or phones, the dentist's e-mail, cookies, session ids, sign-in codes or tokens (D4). **Log only fields you chose**: never whole request bodies, query results, raw URLs or error objects.

## Tools

- `nestjs-pino` replaces Nest's logger and writes JSON lines to stdout. On the VM they go to journald.
- No `console.*` in server code (ESLint `no-console`).
- Nothing else in front of the app logs requests: no nginx or PM2, and Caddy's access log stays off.
- `cloudflared` runs at log level `info` or quieter (debug levels log request details).

## Request line

One line per request, built by custom serializers. Headers are never logged.

| Field | Source |
|---|---|
| `reqId` | generated, echoed in `X-Request-Id` |
| `method`, `route` | the route **pattern** (`/appointments/:id`), never the raw URL |
| `status`, `ms` | response |
| `tenantId` | `SessionGuard`, absent before sign-in |
| `ip` | `CF-Connecting-IP` |

pino's `redact` also lists `cookie`, `set-cookie` and `authorization`, as a second guard.

## In code

- Write `logger.info({ appointmentId }, 'appointment.created')`: a stable message plus chosen fields. Ids are fine. Values typed by people are not.
- Levels: `error` needs a person, `warn` is odd but handled, `info` is request lines and key events. `debug` is off in production.

## Errors

- Log errors only through the error serializer, used by the global exception filter.
- It unwraps `cause` and keeps the error class, the Postgres `code`, `constraint`, `table`, and our stack trace.
- It drops `message`, `detail` and `params` (`DrizzleQueryError` carries the query's parameters, and Postgres `detail` repeats row values).

## Proof

A canary test sends a fake patient name, phone, e-mail and cookie through success, validation-error and database-error paths, including a unique violation and a check violation. It fails if any of them appears in the captured logs. Each endpoint that takes patient data adds its paths.

## Client

No analytics and no third-party error reporting in the browser (D4).

## Retention

Grafana Cloud keeps 14 days (observability.md). journald on the VM keeps a size-capped local copy.
