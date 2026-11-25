# 0001. React single-page app with a JSON API

- **Status:** Accepted
- **Date:** 2026-11-23
- **Decided by:** obogoni (project owner), in spike #2
- **Builds on:** D4, D9, D10

## Context

Fairy is a web app, designed for the phone first and also used on a desktop (D10). It runs on one 1 GB VM (D9) for one dentist who uses it a few minutes a day, often on 4G. Patient data must not stay in browser caches (D4).

The project owner's frontend experience is server-rendered pages with jQuery. Learning modern React is a goal of the owner's development plan, and React is what the job market asks for.

## Decision

A React single-page app built with Vite talks to a JSON API. Both are served from the same origin by the one Node process, so there is no CORS and the session cookie is first-party. TanStack Query holds server state in memory only: no persisters and no browser storage for API data.

## Alternatives considered

- **Server-rendered HTML with htmx.** This was the first recommendation: no client build, a small download on 4G, and few places for patient data to linger in the browser. Rejected because it doesn't build the React skills the owner is after, and rich interactions such as dragging an appointment are harder.
- **Server-rendered HTML without htmx.** The simplest option, but every action reloads the page.

## Consequences

- A client build step exists, so the server is compiled too, with one toolchain for both (layout-and-style.md).
- State lives in two places, the server and the client cache. TanStack Query's cache must never be persisted (D4).
- The first load is larger. Spike #3 and the Agenda slice measure load on 4G.
- Contracts are shared as Zod schemas between client and server.
