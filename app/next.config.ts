import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for the Dockerfile's runner stage (docs/adr/0001-inference-boundary.md /
  // docs/00-capstone-plan.md's platform section) -- without this, `next build` never
  // produces `.next/standalone/`, and the Dockerfile's COPY of that directory fails.
  // Found missing during Block 2 integration despite the comment below already describing
  // it as required -- see docs/decision-log.md.
  output: "standalone",
  // This app imports domain modules from the repo-root `lib/` directory (see
  // docs/tasks/TASKS-00N-*.md's traceability paths, resolved relative to the repo root, not
  // to app/) and reads fixture JSON from the repo-root `fixtures/` directory. Anchoring the
  // file-tracing root one level up (the actual repo root) keeps both in scope for
  // `output: "standalone"` builds and silences Next's workspace-root inference warning,
  // which otherwise picks the wrong directory in this multi-lockfile worktree layout.
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;
