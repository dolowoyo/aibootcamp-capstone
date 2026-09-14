import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app imports domain modules from the repo-root `lib/` directory (see
  // docs/tasks/TASKS-00N-*.md's traceability paths, resolved relative to the repo root, not
  // to app/) and reads fixture JSON from the repo-root `fixtures/` directory. Anchoring the
  // file-tracing root one level up (the actual repo root) keeps both in scope for
  // `output: "standalone"` builds and silences Next's workspace-root inference warning,
  // which otherwise picks the wrong directory in this multi-lockfile worktree layout.
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;
