# infra/terraform

Real IaC against the `kreuzwerker/docker` provider, targeting the local Docker daemon.
See `docs/adr/0003-local-iac.md` for why this replaces a cloud target for this capstone.

## Prerequisites

- Docker running locally. **If you're on Docker Desktop, no extra step is needed** — its
  default socket (`unix:///var/run/docker.sock`) is what the provider looks for out of the
  box.
- **If you're on Colima** (as this module was verified against — see below), the provider
  does *not* read `docker context` the way the `docker` CLI does. Export `DOCKER_HOST`
  explicitly before running any `terraform` command:
  ```sh
  export DOCKER_HOST="unix://$HOME/.colima/default/docker.sock"
  ```
  (Confirm your own socket path with `docker context ls`.)

## Usage

```sh
cd infra/terraform
terraform init
terraform plan
terraform apply
# ...
terraform destroy
```

`var.image_tag` (default `latest`) selects which published `ghcr.io/dolowoyo/aibootcamp-capstone`
tag `docker_image.app` pulls — set it to a real tag once `publish.yml` has pushed one. Note:
`docker/metadata-action`'s semver pattern strips the tag's leading `v`, so a git tag `v0.1.0`
publishes as image tag `0.1.0`, not `v0.1.0`:
```sh
terraform apply -var="image_tag=0.1.0"
```

## Verified (2026-09-15, full apply)

Run against a real local Docker daemon (Colima), against a real published multi-arch image
(`ghcr.io/dolowoyo/aibootcamp-capstone:0.1.0`, from git tag `v0.1.0`):

- `terraform init` / `validate` / `plan` — succeeded, 7 resources to add (network, 3 images
  including the new `migrate` image built from the `Dockerfile`'s `builder` stage, postgres +
  migrate + app containers).
- `terraform apply -var="image_tag=0.1.0"` — **fully succeeded**: all 7 resources created.
  `docker_container.migrate` (per `docs/decision-log.md`'s 2026-09-15 entry) ran
  `prisma db push` and exited 0 before `docker_container.app` was created — confirmed via
  `docker logs first90-migrate` and by `docker_container.app`'s `depends_on` genuinely
  waiting on it (the `must_run=false`/`attach=true` pattern).
- Live `curl` of both `healthz_url` and `readyz_url` against the real running
  `first90-app` container — both `200`.
- `terraform destroy` — cleanly tore down all 7 resources, 0 orphaned.

**What it took to get here** (see `docs/decision-log.md` for full detail): the app image had
never actually been published before this — publishing it surfaced four real, previously
undiscovered bugs in a row, each only visible once something actually tried to exercise that
path for the first time: `publish.yml`'s Trivy action referenced a non-existent tag; that
action's own pinned `setup-trivy` dependency also referenced a deleted tag; the built image
carried real CRITICAL/HIGH CVEs (npm's bundled `tar`/`sigstore`, a stale nested `postcss` in
`next`, and an outdated Alpine OpenSSL) once Trivy could actually run; and the first
successful publish was amd64-only, failing to pull on this Apple Silicon host until
`publish.yml` was taught to cross-build both architectures. `infra/terraform/main.tf` itself
also had the same `SIDECAR_URL`/`INFERENCE_SIDECAR_URL` naming bug already fixed in
`docker-compose.yml`, and needed the identical Prisma-migration fix
(`docker_container.migrate`) `docker-compose.yml` already had.
