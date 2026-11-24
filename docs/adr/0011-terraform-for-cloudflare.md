# 0011. Terraform for Cloudflare

- **Status:** Accepted
- **Date:** 2026-11-23
- **Decided by:** obogoni (project owner), in spike #2
- **Builds on:** D4, D9, ADR 0007

## Context

Cloudflare carries the domain's DNS, the Tunnel and its routes, the cache rule that keeps patient data out of caches (D4), Access for SSH, and the zone's security settings. Getting any of these wrong silently weakens D4 or D9.

The owner wants Fairy run the way a real company would. Terraform had been dropped from the owner's development plan to keep the learning load down.

Fairy also needs a domain whose DNS is on Cloudflare.

## Decision

- Cloudflare is managed only with its official Terraform provider, in `ops/terraform/`. A PR shows the plan, and merging applies it.
- Terraform state lives in a private Cloudflare R2 bucket, through the S3 backend. Cloudflare is already a vendor, and R2's free tier covers it. A GitHub Actions concurrency group serializes runs.
- **Also decided:** the domain is a `.com.br` from registro.br, with its nameservers on Cloudflare.

## Alternatives considered

- **Dashboard plus a written checklist.** Fastest to start, but it drifts from the checklist and changes aren't reviewed.
- **HCP Terraform for state.** A new vendor, when Cloudflare R2 is already there.
- **A `.com` at Cloudflare Registrar.** At cost and managed in one place, but it reads less local for a PT-BR product.

## Consequences

- Terraform is back in the owner's learning plan.
- The state contains secrets, including the Tunnel token, so the bucket must stay private.
- Bootstrapping order: Terraform creates the Tunnel first, and the owner pastes its token into cloud-init when creating the VM.
- Whether R2 supports Terraform's state locking is confirmed in the hello-world. The concurrency group covers it either way.
- The domain costs about R$40 a year and needs the owner's CPF or a CNPJ.
