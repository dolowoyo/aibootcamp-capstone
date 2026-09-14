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
tag `docker_image.app` pulls — set it to a real tag once `publish.yml` has pushed one:
```sh
terraform apply -var="image_tag=v0.1.0"
```

## Verified (this session, 2026-09-13)

Run against a real local Docker daemon (Colima), against this exact configuration:

- `terraform init` — real provider download (`kreuzwerker/docker` v3.9.0), succeeded.
- `terraform validate` — succeeded.
- `terraform plan` — succeeded, 5 resources to add (network, 2 images, 2 containers).
- `terraform apply` — **partially succeeded for real**: `docker_network.first90`,
  `docker_image.postgres`, and `docker_container.postgres` were created and the postgres
  container came up healthy. `docker_image.app` failed with a registry `denied` error —
  **expected and documented**: no tag has been pushed to
  `ghcr.io/dolowoyo/aibootcamp-capstone` yet (that only happens once `publish.yml` runs on
  a tag push, which hasn't happened in this repo yet). This is not a config defect; it's
  the correct failure mode for "the image doesn't exist yet."
- `terraform destroy` — cleanly tore down all 3 created resources, 0 orphaned.

**Deferred to Block 3 (once an app image is actually published):** a full `terraform apply`
including `docker_image.app`/`docker_container.app`, and a live `curl` of `healthz_url`/
`readyz_url` against the running app container.
