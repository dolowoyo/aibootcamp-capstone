# Real IaC against a real provider — no cloud account exists for this capstone.
# See docs/adr/0003-local-iac.md for why `kreuzwerker/docker` against the local Docker
# daemon is the deploy story instead of AWS/Vercel/Fly.

terraform {
  required_version = ">= 1.5"

  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}

provider "docker" {}
