import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules/", "dist/", "test-results/", "playwright-report/", "docs/agents/"] },
  js.configs.recommended,
  {
    files: ["src/**/*.js"],
    languageOptions: { sourceType: "script", globals: globals.browser },
  },
  {
    files: ["scripts/**", "tests/**", "*.mjs"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
];
