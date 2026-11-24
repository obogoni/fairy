# Server and deploys

Why: [ADR 0009](../adr/0009-docker-and-ansible-on-the-vm.md), [ADR 0010](../adr/0010-blue-green-deploys-pushed-from-ci.md), [ADR 0005](../adr/0005-expand-contract-migrations.md).

## The VM

A Locaweb Micro VM on Ubuntu LTS. It holds no data. Every service is a systemd unit that starts on boot and restarts on failure:

| Service | Listens on |
|---|---|
| `cloudflared` | nothing; connects out |
| `caddy`, switching between colors | `127.0.0.1:8080` |
| `fairy@blue`, `fairy@green`, Docker containers | `127.0.0.1:3001`, `127.0.0.1:3002` |
| `alloy` | `127.0.0.1` OTLP |

The VM has a 1 GB swap file.

## Provisioning

- `ops/cloud-init.yaml` creates the `deploy` user, installs Python and connects `cloudflared`. Nothing else.
- Everything else is Ansible in `ops/ansible/`, run over the Tunnel from the `provision` workflow. Roles: `base`, `docker`, `cloudflared`, `caddy`, `alloy`, `fairy`.
- Playbooks are idempotent. The laptop may run them for debugging only.
- Rebuild = new VM with cloud-init → `provision` → `deploy`. Rehearse it before go-live.

## Images

- One image holds server and client: multi-stage, Node LTS slim, non-root, production dependencies only.
- Tag with the git SHA, push to GHCR, keep the last 10.
- Containers use the `journald` log driver, a memory limit, and `--env-file /etc/fairy/app.env` (root, `0600`).
- **Publish ports on `127.0.0.1` only** (Docker bypasses `ufw`).

## Deploy

On merge to `main`, after every CI gate:

1. Build and push `:<sha>`.
2. `dbmate up` from CI as the owner role.
3. SSH through the Tunnel with the Access service token:
   1. Pull with the job's `GITHUB_TOKEN`, then log out.
   2. Start the idle color.
   3. Wait for `/health/ready`.
   4. Switch Caddy with a graceful reload.
   5. Stop the old color, keeping its image.
4. Smoke check the public URL.

A failed step leaves the live color untouched.

**Rollback:** the manual `rollback` workflow starts the previous image and switches back. It never undoes migrations.

## Health

- `/health/live` never touches the database. `/health/ready` runs `select 1`, and only the deploy calls it.
- **Nothing hits the database on a schedule** (it would keep Neon awake, D3). Uptime checks use `/health/live`.
- Both return a status only.

## OS updates and access

- `unattended-upgrades` installs security updates daily, with reboots at 03:00 America/Sao_Paulo. The live color is recorded on disk so it comes back.
- New Ubuntu LTS or Node major versions arrive by rebuilding, never by upgrading in place.
- SSH is key only, with no root login, and reachable only through the Tunnel behind Cloudflare Access.
- `ufw` denies all inbound, plus Locaweb's firewall if the panel has one.
