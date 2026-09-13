# ADR-0003 — Local IaC (Terraform + `kreuzwerker/docker` + GHCR) instead of a cloud target

**Status:** Accepted
**Date:** 2026-09-13

## Context

This capstone's platform-engineering requirement (Session 7 on the learning roadmap) calls
for real infrastructure-as-code, not just a Dockerfile — the assignment expects a
`terraform apply` moment, not a description of one. The planning session that produced
`docs/00-capstone-plan.md` established up front, as a hard constraint, that **no cloud
account exists for this project** — no AWS, no Vercel, no Fly.io (see
`docs/decision-log.md`'s first entry, 2026-09-13, "Planning session: scope, stack, and
inference method"). Any IaC approach that assumes a cloud provider account is simply not
available to reach for here.

What *is* available on the build machine: Docker (locally installed and running), and — once
correctly installed, which itself required working around a Homebrew tap-trust failure (see
`docs/decision-log.md`'s "Terraform was never actually installed" entry) — Terraform itself.

## Decision

Use Terraform against the `kreuzwerker/docker` provider, targeting the local Docker daemon,
as this project's real IaC:

```
infra/terraform/
  main.tf        docker_network, docker_image (pulled from ghcr.io/dolowoyo/aibootcamp-capstone),
                 docker_container × 2 (app + postgres), variables, outputs
```

The app's containerized artifact is published to GHCR (`publish.yml`, tag-triggered, with a
Trivy scan) so that `docker_image` pulls a real, versioned, externally-hosted image rather
than building from local source inside the Terraform run — Terraform's job here is
provisioning and configuring the running stack (network, containers, environment wiring), not
compiling the app.

This is real IaC against a real provider: `terraform plan`/`apply`/`destroy` all function as
they would against any other provider, state is tracked, resources are declared not scripted,
and the same tool and workflow this ADR describes would carry over largely unchanged if a
cloud account became available later — swapping `kreuzwerker/docker` resources for, say, AWS
ECS resources would not require rethinking the *approach*, only the provider block.

## Consequences

- The "deploy" demo moment (`cd infra/terraform && terraform init && terraform apply`) is
  runnable entirely offline except for the initial `docker pull` of the GHCR image, with no
  cloud credentials, billing account, or IAM setup required — appropriate for a project with a
  hard deadline and zero budget for cloud spend.
- `terraform destroy` cleanly tears the stack back down, demonstrating the full IaC lifecycle
  (not just "stand it up") without leaving orphaned cloud resources to worry about afterward.
- This IaC only provisions what a single local Docker daemon can run. It does not
  demonstrate cloud-specific IaC concerns (VPCs, IAM roles, autoscaling, managed database
  services) — an honest limitation of a no-cloud-account constraint, not a gap papered over.
  Anyone assessing this ADR should read "real IaC" as "Terraform used correctly against its
  actual target," not as "equivalent in scope to a cloud deployment."
- The GHCR-published image itself has to be self-contained enough to run without any
  credentials for its default path — this is directly why ADR-0001 makes `fixture` the
  in-container default for `LLM_PROVIDER`: an image that required host-only Claude Code
  credentials to even start up would be undeployable by this ADR's own IaC.

## Alternatives considered

- **A cloud target (AWS, Fly.io, Vercel).** Not available — no account exists for this
  project, established as a hard constraint before any architecture work began (see
  `docs/decision-log.md`'s first entry). Not a preference being traded off; a genuine
  unavailability.
- **Docker Compose only, no Terraform.** Considered, since Compose alone would satisfy "the
  app runs in containers locally." Rejected because it wouldn't satisfy the platform-
  engineering requirement's actual ask for infrastructure-as-*code* — Compose declares
  services, but Terraform's provider/plan/state/apply/destroy lifecycle is what the roadmap
  session is assessing. Both are used here, for different jobs: Compose for local dev
  ergonomics, Terraform for the IaC deliverable.
- **A local Kubernetes target (kind/minikube) instead of the `kreuzwerker/docker` provider.**
  Rejected as disproportionate to this project's actual scale (two containers and a network)
  and to the remaining time budget — it would add real operational surface (a cluster to
  manage) without adding a genuinely different IaC lesson over what `kreuzwerker/docker`
  already demonstrates: a provider, declared resources, and a real apply/destroy lifecycle.
