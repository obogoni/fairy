# 0002. NestJS for the API

- **Status:** Accepted
- **Date:** 2026-11-23
- **Decided by:** obogoni (project owner), in spike #2
- **Builds on:** D9, ADR 0001

## Context

D9 fixes the runtime as one plain Node process on a VM. Fastify was the first pick: lean, fast and schema-validated. The owner asked whether NestJS is still the standard.

It depends what "standard" means. Express has the most installs, mostly from older code. NestJS is the standard opinionated framework for TypeScript backends, and is widely asked for in job postings, including in Brazil. Fastify is the usual modern lean choice. Hono's strengths, multiple runtimes and the edge, don't apply to a VM.

## Decision

NestJS on its default HTTP platform, Express, built with the Nest CLI. We follow the paths Nest's docs show, with one deliberate exception: request validation uses a `ZodValidationPipe`, a pattern from Nest's own pipes docs, instead of `class-validator` DTOs, so the React client can share the same schemas.

## Alternatives considered

- **Fastify.** A better fit for the product's size and budget, with less ceremony, plain imports and first-class Zod. Rejected because fluency in Nest has more career value for the owner, and Nest's memory overhead is acceptable.
- **Nest on the Fastify adapter.** Possible, but most Nest docs and libraries assume Express. Switching later is possible but not free.
- **Express alone or Hono.** No structure, and Hono's strengths don't apply.

## Consequences

- More ceremony: modules, providers and decorators for a small app.
- Decorators need `experimentalDecorators` and `emitDecoratorMetadata`. Vitest's default compiler doesn't emit that metadata, so tests compile with SWC.
- Drizzle has no official Nest module. `DbModule` wires it up by hand.
- Memory use on the 1 GB VM is measured in the hello-world.
