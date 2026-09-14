# First 90 — local IaC stack: network + postgres + app, against the local Docker daemon.
# See docs/adr/0003-local-iac.md for why this is the real IaC deliverable in a
# no-cloud-account capstone, and docs/00-capstone-plan.md's platform-engineering section
# for the original scope this fulfills.

resource "docker_network" "first90" {
  name = "first90-network"
}

resource "docker_image" "app" {
  name = "${var.image_name}:${var.image_tag}"
  # Terraform's job here is provisioning/configuring the running stack, not compiling the
  # app — the image is always pulled from GHCR (publish.yml), never built locally by this
  # module. See docs/adr/0003-local-iac.md.
  keep_locally = true
}

resource "docker_image" "postgres" {
  name         = "postgres:16-alpine"
  keep_locally = true
}

resource "docker_container" "postgres" {
  name  = "first90-postgres"
  image = docker_image.postgres.image_id

  networks_advanced {
    name = docker_network.first90.name
  }

  env = [
    "POSTGRES_USER=${var.postgres_user}",
    "POSTGRES_PASSWORD=${var.postgres_password}",
    "POSTGRES_DB=${var.postgres_db}",
  ]

  ports {
    internal = 5432
    external = var.postgres_port
  }

  healthcheck {
    test     = ["CMD-SHELL", "pg_isready -U ${var.postgres_user} -d ${var.postgres_db}"]
    interval = "10s"
    timeout  = "5s"
    retries  = 5
  }

  restart = "unless-stopped"
}

resource "docker_container" "app" {
  name  = "first90-app"
  image = docker_image.app.image_id

  networks_advanced {
    name = docker_network.first90.name
  }

  # Reaches the host-side inference sidecar (services/inference-sidecar, run manually on
  # the host — see docs/adr/0001-inference-boundary.md) the same way docker-compose.yml
  # does locally.
  host {
    host = "host.docker.internal"
    ip   = "host-gateway"
  }

  env = [
    "LLM_PROVIDER=${var.llm_provider}",
    "SIDECAR_URL=http://host.docker.internal:${var.sidecar_port}",
    "DATABASE_URL=postgresql://${var.postgres_user}:${var.postgres_password}@${docker_container.postgres.name}:5432/${var.postgres_db}?schema=public",
  ]

  ports {
    internal = 3000
    external = var.app_port
  }

  depends_on = [docker_container.postgres]

  restart = "unless-stopped"
}
