import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // `noUncheckedIndexedAccess` already forces null-awareness on indexed
      // access, so non-null assertions on known-safe array/regex access are
      // idiomatic here rather than a smell.
      "@typescript-eslint/no-non-null-assertion": "off",
      // Numbers are safe and readable in template literals.
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true },
      ],
      // VisibilityLevel is an intentional ordinal ladder (Private < … < Public);
      // comparing levels by magnitude is a core part of the disclosure model.
      "@typescript-eslint/no-unsafe-enum-comparison": "off",
    },
  },
  {
    // Test files legitimately use non-null assertions on fixtures.
    files: ["**/__tests__/**", "**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/coverage/**",
      "eslint.config.js",
      "**/vitest.config.ts",
    ],
  }
);
