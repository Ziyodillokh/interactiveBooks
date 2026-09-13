import { defineConfig } from 'eslint/config';

import { base } from '@ibp/eslint-config';

export default defineConfig(base, {
  // CLI scripts talk to the terminal on purpose.
  files: ['scripts/**'],
  rules: { 'no-console': 'off' },
});
