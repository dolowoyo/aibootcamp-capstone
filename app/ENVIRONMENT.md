# Environment variables

Copy these into a local `.env.local` (gitignored) for local development. Every value below is
a placeholder — never commit a real secret.

| Variable | Values | Notes |
|---|---|---|
| `LLM_PROVIDER` | `fixture` \| `sidecar` \| `anthropic` | Unset or unrecognized resolves to `fixture` (SPEC-000 AC-0.7/AC-0.8). Tests and CI always force `LLM_PROVIDER=fixture` regardless (ADR-0002). |
| `INFERENCE_SIDECAR_URL` | e.g. `http://host.docker.internal:8787` | Only read when `LLM_PROVIDER=sidecar`. |
| `ANTHROPIC_API_KEY` | (secret) | Only read when `LLM_PROVIDER=anthropic`; required at construction time (AC-0.9). |
| `DATABASE_URL` | e.g. `postgresql://postgres:postgres@localhost:5432/first90` | Postgres 16, per `prisma/schema.prisma`. Not required to run `npm test` (domain-layer tests use an in-memory repository — see `lib/plan/repository.ts`) or `npm run build`. |
