# Logging

Decided 2026-11-23 in spike #2.

## Rule (D4)

Logs never contain patient names or phones, the dentist's e-mail, cookies, session ids, sign-in codes or tokens. The safe way to keep that true is to **log only fields we chose**, never whole objects that might carry data: request bodies, query results, raw URLs or full errors.

## Tools

- `nestjs-pino` replaces Nest's logger (`app.useLogger`), so Nest's own messages go through the same rules. It writes one JSON line per event to stdout.
- No `console.*` in server code (ESLint `no-console`).
- On the VM, systemd sends stdout to journald (server convention). There's no nginx or PM2 in front of the app to log URLs on their own: `cloudflared` talks to the Node process directly.
- `cloudflared` runs at log level `info` or quieter. Debug levels log request details.

## What a request logs

One line when the request ends:

| Field | Source | Note |
|---|---|---|
| `reqId` | generated per request, echoed in an `X-Request-Id` response header | ties a user report to a log line |
| `method`, `route` | the matched route **pattern**, e.g. `/appointments/:id` | never the raw URL or query string |
| `status`, `ms` | response | |
| `tenantId` | from `SessionGuard` | an opaque UUID, absent before sign-in |
| `ip` | `CF-Connecting-IP` (D9) | retention is open, see below |

That's done with custom `req`/`res` serializers. Headers are not logged at all, which covers `Cookie`, `Set-Cookie` and `Authorization` without relying on a redact list. pino's `redact` lists them anyway, as a second guard.

## Logging in code

- Log events with a stable message and chosen fields: `logger.info({ appointmentId }, 'appointment.created')`. Ids are fine. Values typed by people are not.
- Log levels: `error` for something that needs a person, `warn` for something odd but handled, `info` for request lines and important events. `debug` is off in production.

## Errors

Error objects carry data, so they are never logged whole:

- Drizzle wraps driver errors in `DrizzleQueryError`, which carries the failed SQL and **its parameters** (`query`, `params`), which can be patient names and phones. Its message may repeat them. The Postgres error is in `cause`.
- Postgres errors carry a `detail` that repeats row values (`Key (x)=(...)`, `Failing row contains (...)`).

The error serializer unwraps `cause` and keeps only: the error class, Postgres `code` (SQLSTATE), `constraint`, `table`, and the stack trace **of our code**. It drops `message` and `detail` for database errors, and drops every `params` field. The global exception filter (framework.md) logs through that serializer.

## Proof

An integration test runs requests carrying canary values (a fake patient name, phone, e-mail and cookie) through success, validation-error and database-error paths, including a unique violation and a check violation. It captures all log output and fails if any canary appears. Each slice that adds an endpoint with patient data adds its paths to this test.

## Client

No analytics and no third-party error reporting in the browser (D4). Month 6 (observability) decides how client errors are reported, if at all.

## Open

- **Retention.** journald keeps logs on the VM with a size cap. Where logs go off the VM, and for how long, is decided with observability before go-live.
- **IP addresses and the Marco Civil.** It may require application providers to keep access records (IP, date and time) for six months. Whether that applies to Fairy, and how it sits with LGPD minimisation, goes to the go-live checklist (#11).
