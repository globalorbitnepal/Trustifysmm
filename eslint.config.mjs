import { defineConfig, globalIgnores } from "eslint/config";
import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";

/*
 * eslint-config-next 15 is published as a legacy (eslintrc) preset — it exports an
 * `extends` object rather than a flat-config array. FlatCompat is the supported bridge,
 * so this file adapts it instead of assuming an array export.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = defineConfig([
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  globalIgnores([
    ".next/**",
    ".next-stale-*/**",
    "out/**",
    "build/**",
    ".releases/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
