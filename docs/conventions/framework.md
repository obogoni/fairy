# Framework and request format

Decided 2026-11-23 in spike #2.

## Shape

One Node process (D9) runs NestJS. It serves the JSON API and the built React app from the same origin, so there is no CORS and the session cookie is first-party.

- **Server:** NestJS on its default HTTP platform (Express). The Nest CLI builds it. We stay on the paths the Nest docs show, and step off them only for a reason written here.
- **Static client:** `@nestjs/serve-static` serves the Vite build.
- **Client:** a React single-page app built with Vite. React Router handles routing. TanStack Query handles server state, kept in memory only: no persisters, no `localStorage` and no IndexedDB for API data (D4, D10).
- **Shared contracts:** Zod schemas in `src/shared/`. The server validates request bodies with a `ZodValidationPipe`, the pattern in Nest's pipes docs, and the client uses the same schemas for forms. We don't use `class-validator` DTOs, because the client can't share them.

## Nest structure

- One Nest module per slice: `TenantModule`, `WorkplaceModule`, `AppointmentModule`, `AgendaModule`. A slice exports only what another slice needs.
- Controllers handle HTTP only: parse, call one service method, return. Services hold the logic and the queries.
- `DbModule` is global and provides the Drizzle instance and `TenantDb` (data-access.md).
- A global `SessionGuard` resolves the session cookie and puts the tenant id on the request. Routes that work without a session, such as sign-in and `GET /session`, are marked `@Public()`. The `@TenantId()` parameter decorator reads the tenant id in a controller.
- Configuration goes through `@nestjs/config`, validated by a Zod schema at startup. The app fails fast on a missing value.

## Requests and responses

- The API speaks JSON. Paths are the ones fixed in each slice's contract (for example `GET /session`). Client routes must not reuse an API path. Any other `GET` falls back to `index.html`.
- JSON fields are camelCase. Database columns are snake_case, and the pulled Drizzle schema maps between them.
- Errors are RFC 9457 problem details (`application/problem+json`) with a stable `type` code, produced by one global exception filter. The server never sends UI text: the client turns codes into PT-BR messages.
- Ids are UUIDs (see migrations-and-ids.md). Patient data never goes in a path or query string, only in bodies (D4).
- Mutations accept only `application/json`. Together with a `SameSite=Lax` session cookie, this guards against cross-site form posts.

## Caching (D4)

- API responses: `Cache-Control: no-store`, set by a global interceptor.
- Hashed assets from Vite: `public, max-age=31536000, immutable`.
- `index.html`: `no-cache`.
