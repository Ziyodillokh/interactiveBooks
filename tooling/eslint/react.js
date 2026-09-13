import { defineConfig } from 'eslint/config';

import { base } from './base.js';

/**
 * Placeholder for browser/React packages. Filled in Phase 7 (react-hooks, jsx-a11y, browser
 * globals) when the first React consumer exists — see MASTER_PLAN §6.
 */
export const react = defineConfig(base);
