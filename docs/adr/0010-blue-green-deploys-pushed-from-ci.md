# 0010. Blue-green deploys pushed from CI

- **Status:** Accepted
- **Date:** 2026-11-23
- **Decided by:** obogoni (project owner), in spike #2
- **Builds on:** D9, ADR 0009

## Context

The owner's plan requires a rehearsed, timed rollback by the end of phase 1. The VM takes no inbound traffic (D9), so CI can't reach it directly.

GitHub Actions can SSH through a Cloudflare Tunnel by authenticating to Cloudflare Access with a service token ([example action](https://github.com/nathanjnorris/cloudflared-ssh-action), [Cloudflare docs](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/use-cases/ssh/ssh-cloudflared-authentication/), read 2026-11-23).

## Decision

- **Blue-green on one VM.** Two app containers on two local ports. Caddy on `localhost` points at the live one. A deploy starts the idle color, waits for its health check, then switches Caddy with a graceful reload.
- **Pushed from CI.** After merge and every CI gate passing, GitHub Actions builds the image, runs migrations from CI, SSHes to the VM through the Tunnel, and performs the switch.
- **Rollback** is a manual workflow that starts the previous image and switches back.

## Alternatives considered

- **Switching by changing the Tunnel's routes.** No extra component, but restarting `cloudflared` drops connections for a few seconds.
- **The VM pulls new releases.** CI never touches the VM, but the VM needs a GitHub read token, and deploy status lives in the VM's logs, not in Actions.
- **Stop, then start, in place.** Simpler, but there's downtime on every deploy and rollback is slower.

## Consequences

- Caddy is added, at about 30–40 MB of memory. It writes no access log by default, which keeps D4.
- During a switch, two app containers run at once. Memory is measured in the hello-world.
- CI holds an Access service token, and migrations run from CI, so the owner role never reaches the VM.
- Migrations must be expand/contract (ADR 0005).
- The previous image stays on disk, so a rollback takes seconds.
