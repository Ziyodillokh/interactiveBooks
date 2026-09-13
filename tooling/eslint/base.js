import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Baseline for every workspace package: eslint + typescript-eslint recommended, plus the few
 * rules the working agreement makes non-negotiable (no `any`, explicit type imports).
 * Syntax-only (no type information) so lint stays fast and independent of `build`.
 */
export const base = defineConfig(
  globalIgnores([
    '**/dist/**',
    '**/coverage/**',
    '**/src/generated/**',
    '**/.turbo/**',
    '**/.next/**',
    '**/out/**',
    '**/build/**',
  ]),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      eqeqeq: ['error', 'always'],
      // Packages lint with `--max-warnings 0`, so a warning still fails CI; scripts/** opt out locally.
      'no-console': 'warn',
    },
  },
);
