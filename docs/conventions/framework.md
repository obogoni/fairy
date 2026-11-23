# Framework and request format

Decided 2026-11-23 in spike #2.

## Shape

One Node process (D9) runs Fastify. Fastify serves the JSON API and the built React app from the same origin, so there is no CORS and the session cookie is first-party.

- **Server:** Fastify.
- **Client:** a React single-page app built with Vite. React Router handles routing. TanStack Query handles server state, kept in memory only: no persisters, no `localStorage` and no IndexedDB for API data (D4, D10).
- **Shared contracts:** Zod schemas in `src/shared/`. Fastify validates requests and responses with them (`fastify-type-provider-zod`), and the client uses the same schemas for forms.

## Requests and responses

- The API speaks JSON. Paths are the ones fixed in each slice's contract (for example `GET /session`). Client routes must not reuse an API path. Any other `GET` falls back to `index.html`.
- JSON fields are camelCase. Database columns are snake_case, and Drizzle maps between them.
- Errors are RFC 9457 problem details (`application/problem+json`) with a stable `type` code. The server never sends UI text: the client turns codes into PT-BR messages.
- Ids are UUIDs (see migrations-and-ids.md). Patient data never goes in a path or query string, only in bodies (D4).
- Mutations accept only `application/json`. Together with a `SameSite=Lax` session cookie, this guards against cross-site form posts.

## Caching (D4)

- API responses: `Cache-Control: no-store`.
- Hashed assets from Vite: `public, max-age=31536000, immutable`.
- `index.html`: `no-cache`.
