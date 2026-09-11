import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      react: nextVitals[0].plugins.react,
      "react-hooks": nextVitals[0].plugins["react-hooks"],
      "@typescript-eslint": nextTs[0].plugins["@typescript-eslint"],
    },
    rules: {
      // Keep the existing baseline visible without blocking feature work while
      // these broad, non-behavioral cleanups are migrated incrementally.
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "warn",
      "react-hooks/error-boundaries": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".open-next/**",
    ".wrangler/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
