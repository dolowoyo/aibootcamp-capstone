import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(new URL("./app/", import.meta.url))),
});

// Lives at the repo root (not app/) so its base path covers both `app/` and the repo-root
// `lib/` tree the traceability-checked tests live in (see app/vitest.config.ts's comment
// for why lib/ is a sibling of app/, not nested inside it). The `lint` script only ever
// passes `app` and `lib` as explicit CLI targets — see app/package.json — so this config
// never scans unrelated repo-root directories (other worktrees, mcp/, services/, infra/).
const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "**/next-env.d.ts",
      "**/node_modules/**",
    ],
  },
];

export default eslintConfig;
