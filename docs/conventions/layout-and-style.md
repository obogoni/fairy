# Repo layout and code style

Why: [ADR 0001](../adr/0001-react-spa-with-json-api.md), [ADR 0002](../adr/0002-nestjs-for-the-api.md).

## Stack

- TypeScript everywhere, compiled: the Nest CLI builds the server, Vite builds the client.
- Node Active LTS, pinned in `.nvmrc` and `package.json` `engines`.
- pnpm, one package, no workspaces. The lockfile is committed.

## Layout

```
src/
  server/
    main.ts             bootstraps Nest
    app.module.ts       imports every slice module
    common/             global guard, filter, interceptor, decorators
    db/                 DbModule: pool, Drizzle, TenantDb; generated/ from drizzle-kit pull
    features/<slice>/   <slice>.module.ts, .controller.ts, .service.ts
  client/
    main.tsx
    features/<slice>/   screens and hooks of one slice
  shared/               Zod schemas and types used by both sides
db/migrations/          NNNN_name.sql (migrations-and-ids.md)
ops/                    cloud-init, Ansible, Terraform, Grafana exports
scripts/                admin commands
tests/e2e/              Playwright
```

- Group code by slice (`tenant`, `workplace`, `appointment`, `agenda`), not by layer.
- `client/` and `server/` never import each other. Both may import `shared/`.
- Unit and integration tests sit next to the code they test.

## Style

- TypeScript `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- ESLint `typescript-eslint` `strict-type-checked` and Prettier defaults. No style debates beyond what they enforce.
- File names are kebab-case. Server files use Nest's suffixes (`tenant.service.ts`).
- Only the server's `tsconfig` enables `experimentalDecorators` and `emitDecoratorMetadata`.
- Code, comments and commits are in English. User-facing text is in PT-BR and lives only in the client.
- Commits use Conventional Commits. Branches are named `<type>/<issue>-<slug>`.
