# Repo layout and code style

Decided 2026-11-23 in spike #2.

## Stack

- TypeScript everywhere, compiled: the Nest CLI builds the server, Vite builds the client.
- Node, current Active LTS, pinned in `.nvmrc` and `package.json` `engines`.
- pnpm, one package (no workspaces). Lockfile committed, CI installs with `--frozen-lockfile`.

## Layout

```
src/
  server/
    main.ts             bootstraps Nest
    app.module.ts       imports every slice module
    common/             global guard, filter, interceptor, decorators
    db/                 DbModule: pool, Drizzle, TenantDb; generated/ from drizzle-kit pull
    features/<slice>/   <slice>.module.ts, <slice>.controller.ts, <slice>.service.ts
  client/
    main.tsx
    features/<slice>/   screens and hooks of one slice
  shared/               Zod schemas and types used by both sides
db/migrations/          NNNN_name.sql applied by dbmate, see migrations-and-ids.md
scripts/                admin commands
tests/e2e/              Playwright
```

- Code is grouped by slice (`tenant`, `workplace`, `appointment`, `agenda`), not by layer.
- `client/` never imports from `server/`, and `server/` never imports from `client/`. Both may import `shared/`.
- Unit and integration tests sit next to the code they test.

## Style

- TypeScript `strict`, plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
- ESLint with `typescript-eslint` `strict-type-checked`. Prettier with its defaults. No style debates beyond what these tools enforce.
- File names are kebab-case. Server files follow Nest's suffixes (`tenant.service.ts`), as the Nest CLI generates them.
- The server's `tsconfig` turns on `experimentalDecorators` and `emitDecoratorMetadata`, which Nest needs. The client's doesn't.
- Identifiers, comments and commit messages are in English. Text the user sees is in PT-BR and lives only in the client.
- Commits follow Conventional Commits (`feat:`, `fix:`, `docs:`...). Branches are named `<type>/<issue>-<slug>`.
