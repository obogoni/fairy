# Server and deploys

Decided 2026-11-23 in spike #2. Applies D9 (one fixed-price server in São Paulo, behind Cloudflare).

## The VM

A Locaweb Micro VM (1 vCPU, 1 GB) running the current Ubuntu LTS image Locaweb offers. It holds no data and can be rebuilt from the repository at any time.

What runs on it, each as a systemd service that starts on boot and restarts on failure:

| Service | What | Listens on |
|---|---|---|
| `cloudflared` | the Cloudflare Tunnel (cloudflare.md) | nothing; it connects out |
| `caddy` | local switch between blue and green | `127.0.0.1:8080` |
| `fairy@blue`, `fairy@green` | the app, one Docker container each | `127.0.0.1:3001`, `127.0.0.1:3002` |
| `alloy` | ships logs and metrics (observability.md) | `127.0.0.1` OTLP |
| Docker | runs the containers | nothing |

A 1 GB swap file guards against short memory spikes. The hello-world measures real memory use and records it here.

## Provisioning: cloud-init, then Ansible

1. **cloud-init**, pasted as user data when the VM is created at Locaweb (`ops/cloud-init.yaml`): creates the `deploy` user with the owner's SSH key, installs Python for Ansible, installs `cloudflared` and connects the Tunnel. **Port 22 is never open to the internet**, not even on first boot.
2. **Ansible** (`ops/ansible/`) does everything else, always over SSH through the Tunnel. Roles: `base` (users, SSH, firewall, updates, journald limits, swap), `docker`, `cloudflared`, `caddy`, `alloy`, `fairy` (systemd units, env files).
3. Playbooks are idempotent and run from a manual GitHub Actions workflow (`provision`), so secrets stay in GitHub. Running them from the owner's laptop is allowed for debugging.

Rebuilding the VM means: create a VM with the cloud-init file, run `provision`, run `deploy`. That procedure is rehearsed before go-live.

## Packaging: Docker

- One image holds the Nest server and the built React app. It uses a multi-stage build on the Node LTS slim image and runs as a non-root user, with production dependencies only.
- CI tags images with the git SHA and pushes them to GitHub Container Registry (GHCR). Old images are pruned, keeping the last 10, to stay inside the free package storage.
- Containers log with Docker's `journald` driver, so logs follow logging.md.
- Each container has a memory limit, and its environment comes from `/etc/fairy/app.env` (root, `0600`).
- **Ports are published on `127.0.0.1` only.** Docker writes its own iptables rules and bypasses `ufw`, so a port published on `0.0.0.0` would be open to the internet even with the firewall up.

## Deploy: CI pushes through the Tunnel

On every merge to `main`, once every CI gate passes, the `deploy` workflow does this:

1. Build the image and push it to GHCR as `:<sha>`.
2. Run `dbmate` against production as the owner role, from CI. Migrations are expand/contract (migrations-and-ids.md), so the running version keeps working.
3. SSH to the VM through the Tunnel, authenticating to Cloudflare Access with a service token, then:
   1. `docker login` to GHCR with the job's short-lived `GITHUB_TOKEN`, pull `:<sha>`, log out. No long-lived registry token lives on the VM.
   2. Start the idle color with the new image.
   3. Wait for `GET /health/ready` on its local port to pass.
   4. Point Caddy at the new color and reload it gracefully. In-flight requests finish, so there's no downtime.
   5. Stop the old color. Its image stays on disk.
4. Smoke check through the public URL.

If any step fails, the live color is untouched and the workflow fails.

**Rollback** is a manual `rollback` workflow: start the previous color from its image, check it, switch Caddy back. It never undoes migrations. PDI month 3 times this.

## Health

- `GET /health/live`: the process is up. It doesn't touch the database.
- `GET /health/ready`: also runs `select 1`. Only the deploy calls it.
- No uptime monitor or health check hits the database on a schedule, because that would keep Neon awake (D3, spike #3). An external uptime check, if added, uses `/health/live`.
- Neither endpoint returns anything but a status.

## OS updates

- `unattended-upgrades` installs security updates daily.
- When one needs a reboot, the VM reboots at 03:00 America/Sao_Paulo, outside office hours. Every service is enabled in systemd and comes back by itself. The live color is recorded on disk so the right one starts.
- Bigger changes, such as a new Ubuntu LTS or Node major version, happen by rebuilding the VM or the image, not by upgrading in place.

## Access

- SSH accepts keys only: no passwords, no root login. It's reachable only through the Tunnel, behind Cloudflare Access, for the owner's identity and CI's service token.
- `ufw` denies all inbound traffic, and Locaweb's firewall does the same if the panel offers one. Outbound traffic is open.
- Secrets reach the VM only through Ansible and the deploy workflow (environments-and-secrets.md).

## To confirm in the hello-world

- Which Ubuntu LTS image Locaweb offers, and that cloud-init runs on it
- Memory use with everything running, and the container memory limits that fit
- The exact way to pass the Access service token to `cloudflared` for SSH from CI
