import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          { group: ["**/publication-policy", "**/publication-policy.*", "**/publication-journal", "**/publication-journal.*", "**/publication-source", "**/publication-source.*", "**/testing/publication-*"], message: "Disclosure review contains private audit data and cannot be imported by pages, components or API routes." },
          { group: ["**/company-stats", "**/company-stats.*"], importNames: ["calculateCompanyPayStats"], message: "The raw calculator is not a publication policy. Use the protected public statistics function." },
        ],
      }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".vercel/**",
    "agent-tools/**",
  ]),
]);

export default eslintConfig;
