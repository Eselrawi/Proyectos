import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  {
    // Marcas de "montado" y reinicios al cambiar de plato: setState en efectos es intencionado aquí.
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
  globalIgnores([
    "legacy/**",
    "scripts/**",
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
