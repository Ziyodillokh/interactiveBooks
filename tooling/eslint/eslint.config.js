// The shared config lints itself so a syntax slip here fails `pnpm lint` in this package first,
// not in every consumer at once.
import { defineConfig } from 'eslint/config';

import { base } from './base.js';

export default defineConfig(base);
