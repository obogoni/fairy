# Framework and request format

Why: [ADR 0001](../adr/0001-react-spa-with-json-api.md), [ADR 0002](../adr/0002-nestjs-for-the-api.md).

## Shape

- One Node process runs NestJS (Express platform). It serves the JSON API and, with `@nestjs/serve-static`, the Vite build, from the same origin.
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
- Errors are RFC 9457 problem details with a stable `type` code, from one global exception filter. The server never sends UI text.
- Patient data never goes in a path or query string, only in bodies (D4).
- Mutations accept only `application/json`, and the session cookie is `SameSite=Lax` (together they block cross-site form posts).

## Caching (D4)

| Response | `Cache-Control` |
|---|---|
| API, set by a global interceptor | `no-store` |
| Vite hashed assets | `public, max-age=31536000, immutable` |
| `index.html` | `no-cache` |
