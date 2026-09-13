# ADR-0001 — Inference runs on the host, behind a provider interface

**Status:** Accepted
**Date:** 2026-09-13

## Context

This capstone has no Anthropic API key and no cloud account. Inference must run through the
Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`) on existing Claude Code subscription
credentials.

The Agent SDK authenticates by spawning the `claude` CLI as a subprocess, which reads
credentials from the macOS keychain. **Neither the `claude` binary nor the keychain exists
inside a Docker container.** The app, however, is designed to run containerized (Docker
Compose locally, Terraform-provisioned for the "deploy" demo). These two facts are in direct
conflict if inference is expected to run inside the same container as the app.

## Decision

Split the process boundary. Inference runs in a small host-side sidecar process
(`services/inference-sidecar/`) that owns the Agent SDK and therefore has access to the
keychain and `claude` CLI. The containerized app talks to it over HTTP.

```text
app (Next.js, containerized)
  └── LLM_PROVIDER = fixture | sidecar | anthropic
        ├─ fixture   → fixtures/inference/*.json    DEFAULT in container, CI, and demo fallback
        ├─ sidecar   → http://host.docker.internal:8787
        │               └── services/inference-sidecar (host process)
        │                     └── Agent SDK query() → claude CLI → keychain → subscription auth
        └─ anthropic → @anthropic-ai/sdk, model claude-opus-5, activates on ANTHROPIC_API_KEY
```

All three adapters implement the same interface (`lib/inference/provider.ts`, contract
defined in `SPEC-000`): `diagnoseStars(intake) → StarsDiagnosis`,
`generatePlan(diagnosis) → Milestones[]`. The sidecar adapter is a thin HTTP client; the
`anthropic` adapter is written but unwired, demonstrating the interface's portability without
needing a key to prove it. Regardless of adapter, the response is Zod-validated at the
boundary — a schema-constrained LLM response is still untrusted input.

The sidecar's `query()` call uses `outputFormat: { type: "json_schema", schema }` so the
STARS diagnosis returns validated JSON directly rather than prose that needs to be
regex-parsed.

## Consequences

- **Tests and CI always use `fixture`.** This isn't a workaround — determinism at the
  inference boundary is a real architectural property (see `docs/constitution.md`,
  principle III), and it would be needed even if a real API key existed. An LLM app that
  cannot be tested deterministically cannot be tested.
- Running the `sidecar` adapter requires a host Node process running alongside the
  containerized app — one extra moving part, and one that only works on the machine
  actually logged into Claude Code. This is an acceptable tradeoff for a capstone demo but
  would need real credential management (an API key, a service account) to run anywhere
  else.
- The container itself never needs credentials of any kind for the `fixture` path, which is
  its default — so the containerized artifact published to GHCR is self-contained and
  runnable by anyone, with inference degrading gracefully to fixtures rather than failing.

## Alternatives considered

- **Bake an API key into the container.** Not available — no Anthropic API key exists for
  this project.
- **Run inference entirely client-side / skip real inference.** Considered and rejected
  during planning (see `docs/decision-log.md`, 2026-09-13) — it would have produced a
  weaker capstone than solving the actual constraint.
- **Install the `claude` CLI and mount the keychain into the container.** Possible in
  principle on macOS with significant Docker Desktop configuration, but fragile, insecure
  (mounting host keychain access into a container), and not portable to the GHCR-published
  image. Rejected as needlessly complex compared to a host-side sidecar.
