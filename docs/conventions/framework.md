# Framework and request format

Why: [ADR 0001](../adr/0001-react-spa-with-json-api.md), [ADR 0002](../adr/0002-nestjs-for-the-api.md).

## Shape

- One Node process runs NestJS (Express platform). It serves the JSON API and the Vite build from the same origin: `useStaticAssets` serves `/assets/`, and `SpaController`, registered last, answers any other `GET` with `index.html`.
- Client: React, React Router, and TanStack Query in memory only. No persisters, no `localStorage` and no IndexedDB for API data (D4).
- Contracts: Zod schemas in `src/shared/`. The server validates with a `ZodValidationPipe`, and the client uses the same schemas for forms. No `class-validator` DTOs.
- Follow the paths Nest's docs show. Step off them only for a reason recorded in an ADR.

## Nest structure

- One module per slice. A slice exports only what another slice needs.
- Controllers handle HTTP only: parse, call one service method, return. Services hold logic and queries.
- `DbModule` is global and provides Drizzle and `TenantDb` (data-access.md).
- A global `SessionGuard` puts the tenant id on the request. Routes without a session are marked `@Public()`. Controllers read the tenant with `@TenantId()`.
- Configuration goes through `@nestjs/config`, validated by Zod at startup, so a missing value stops the app.

## Requests and responses

- Paths are the ones in each slice's contract. Client routes never reuse an API path, and any other `GET` falls back to `index.html`.
- JSON is camelCase, the database is snake_case, and the pulled Drizzle schema maps between them.
- Errors are RFC 9457 problem details with a stable `type` code, from one global exception filter: `validation_error` (400), `bad_request` (any other unhandled 4xx), `not_found`, `service_unavailable`, `internal_error`. The server never sends UI text.
- Patient data never goes in a path or query string, only in bodies (D4).
- Mutations accept only `application/json` (a cross-site form can't send it). This is the guard that counts: the domain is shared with other sites, which browsers treat as the same site, so `SameSite=Lax` doesn't stop them (ADR 0013).
- The session cookie is named with the `__Host-` prefix and set `Secure; HttpOnly; SameSite=Lax; Path=/` with no `Domain` (the browser refuses it otherwise, so no sibling site can read it).

## Caching (D4)

| Response | `Cache-Control` |
|---|---|
| API, set by a global interceptor | `no-store` |
| Vite hashed assets | `public, max-age=31536000, immutable` |
| `index.html` | `no-cache` |
