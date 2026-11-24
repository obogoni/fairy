# 0007. Secrets in GitHub

- **Status:** Accepted
- **Date:** 2026-11-23
- **Decided by:** obogoni (project owner), in spike #2
- **Builds on:** D2, D9, ADR 0006

## Context

Production needs database passwords for three roles, the Google client secret, the Tunnel token, and later Cloudflare, Access and Grafana tokens. CI needs some of these to migrate and deploy. The VM must be rebuildable from the repository (D9).

## Decision

- GitHub Actions secrets are the single source of truth: production ones in the `production` environment, restricted to `main`. Deploy and provisioning jobs write what the VM needs into root-owned `0600` files.
- Each place holds only what it needs:
  - **The VM:** the app's role, the Google secret, and the Tunnel and Grafana tokens.
  - **CI:** the owner role, for migrations.
  - **The owner's laptop:** the admin role.

A compromised VM can read and write tenant data under RLS, but cannot change the schema, bypass RLS or create invitations.

## Alternatives considered

- **SOPS-encrypted file in the repo.** The repo would hold everything needed to rebuild, but the age key has to be guarded and present in CI or on the VM.
- **A secrets manager (Doppler, Infisical).** A nicer interface and history, but one more vendor and account to secure.

## Consequences

- GitHub secrets can't be read back. Rebuilding the VM means running provisioning and the deploy again.
- Production secrets sit in a GitHub `production` environment that only `main` can deploy to. That's available because the repository is public (ADR 0012).
