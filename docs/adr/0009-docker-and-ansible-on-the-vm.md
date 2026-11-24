# 0009. Docker and Ansible on the VM

- **Status:** Accepted
- **Date:** 2026-11-23
- **Decided by:** obogoni (project owner), in spike #2
- **Builds on:** D9

## Context

D9 says the VM holds no data and can be rebuilt from the repository. Its setup has to live in the repo, not in commands typed once by hand. The owner wants the setup a real company would use.

Locaweb supports cloud-init user data and injects an SSH key when a VM is created ([Locaweb help](https://www.locaweb.com.br/ajuda/wiki/como-utilizar-o-user-data-no-cloud-init), read 2026-11-23).

## Decision

- **Provisioning:**
  - cloud-init does the minimum on first boot: a `deploy` user with the owner's key, Python, and `cloudflared` connected to the Tunnel, so port 22 never opens to the internet.
  - Ansible does everything else through the Tunnel, from a manual GitHub Actions workflow.
- **Packaging:** CI builds one Docker image, holding the Nest server and the built client, and pushes it to GitHub Container Registry. The VM runs it under systemd.

## Alternatives considered

- **cloud-init only.** Built in and simple, but it runs once, so later changes mean a rebuild or manual SSH.
- **A shell script.** The simplest, but it has to be made safe to re-run by hand, and it's less transferable.
- **Plain Node plus systemd, with a tarball.** Lighter, with no Docker daemon, but the Node version is managed on the VM and it's less transferable.

## Consequences

- The same image runs locally, in CI and in production. A rollback is the previous image tag.
- The Docker daemon costs about 50–100 MB of the 1 GB.
- Docker writes its own iptables rules and bypasses `ufw`. Ports must be published on `127.0.0.1` only.
- Private images count against GitHub's free package storage, so old images are pruned.
- Two tools to learn, Docker and Ansible, which serve the owner's plan.
