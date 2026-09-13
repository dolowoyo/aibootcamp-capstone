output "app_url" {
  description = "Local URL the app is reachable at once provisioned."
  value       = "http://localhost:${var.app_port}"
}

output "healthz_url" {
  value = "http://localhost:${var.app_port}/api/healthz"
}

output "readyz_url" {
  value = "http://localhost:${var.app_port}/api/readyz"
}

output "network_name" {
  value = docker_network.first90.name
}

output "postgres_container_name" {
  value = docker_container.postgres.name
}

output "app_container_name" {
  value = docker_container.app.name
}
