variable "image_tag" {
  description = <<-EOT
    Tag of the published app image to pull from GHCR (publish.yml pushes on every tag
    push — see docs/adr/0003-local-iac.md). Terraform's job is provisioning the running
    stack, not compiling the app, so this always resolves to a real, versioned,
    externally-hosted image rather than a local build.
  EOT
  type        = string
  default     = "latest"
}

variable "image_name" {
  description = "Fully qualified GHCR image name, without tag."
  type        = string
  default     = "ghcr.io/dolowoyo/aibootcamp-capstone"
}

variable "app_port" {
  description = "Host port the app container's port 3000 is published on."
  type        = number
  default     = 3000
}

variable "postgres_port" {
  description = "Host port the postgres container's port 5432 is published on."
  type        = number
  default     = 5432
}

variable "postgres_user" {
  type    = string
  default = "first90"
}

variable "postgres_password" {
  description = "Local-demo-only credential — never a real secret (no cloud account, no production target). See docs/adr/0003-local-iac.md."
  type        = string
  default     = "first90"
  sensitive   = true
}

variable "postgres_db" {
  type    = string
  default = "first90"
}

variable "llm_provider" {
  description = "LLM_PROVIDER passed to the app container. Defaults to fixture so the stack is runnable with zero credentials (docs/adr/0001-inference-boundary.md)."
  type        = string
  default     = "fixture"
}

variable "sidecar_port" {
  description = "Host port the inference sidecar (services/inference-sidecar, run separately on the host) listens on. Reached from the app container via host.docker.internal — see PLAN-000."
  type        = number
  default     = 8787
}
