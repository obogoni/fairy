# Repo layout and code style

Decided 2026-11-23 in spike #2.

## Stack

- TypeScript everywhere, compiled: `tsc` builds the server, Vite builds the client.
- Node, current Active LTS, pinned in `.nvmrc` and `package.json` `engines`.
- pnpm, one package (no workspaces). Lockfile committed, CI installs with `--frozen-lockfile`.

## Layout

```
src/
  server/
    app.ts              builds the Fastify app; tests import this
    main.ts             starts it
    db/                 pool, Drizzle instance, withTenant, schema.ts
    features/<slice>/   routes and queries of one slice
  client/
    main.tsx
    features/<slice>/   screens and hooks of one slice
  shared/               Zod schemas and types used by both sides
db/migrations/          NNNN_name.sql, see migrations-and-ids.md
scripts/                migrate.ts, admin commands
tests/e2e/              Playwright
```

- Code is grouped by slice (`tenant`, `workplace`, `appointment`, `agenda`), not by layer.
- `client/` never imports from `server/`, and `server/` never imports from `client/`. Both may import `shared/`.
- Unit and integration tests sit next to the code they test.

## Style

- TypeScript `strict`, plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
- ESLint with `typescript-eslint` `strict-type-checked`. Prettier with its defaults. No style debates beyond what these tools enforce.
- File names are kebab-case.
- Identifiers, comments and commit messages are in English. Text the user sees is in PT-BR and lives only in the client.
- Commits follow Conventional Commits (`feat:`, `fix:`, `docs:`...). Branches are named `<type>/<issue>-<slug>`.
