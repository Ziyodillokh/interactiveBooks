import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Only *.test.ts(x) is collected (DEVELOPMENT.md "Conventions"); *.spec.* is not a test here.
    include: ['{src,test}/**/*.test.{ts,tsx}'],
    exclude: [...configDefaults.exclude, 'src/generated/**'],
    coverage: {
      provider: 'v8',
      // lcovonly: no HTML report tree in coverage/ (it would be tar'd into every Turbo cache entry).
      reporter: ['text', 'lcovonly'],
      include: ['src/**/*.ts'],
      exclude: ['src/generated/**'],
      // TODO(Phase 1, step 2): thresholds { lines/functions/branches/statements: 80 } once the
      // parser/validator land — the 80 % policy in DEVELOPMENT.md has no enforcement point until then.
    },
  },
});
