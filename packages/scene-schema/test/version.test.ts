import { describe, expect, it } from 'vitest';

import { SCENE_DSL_VERSION } from '../src/index.js';

describe('SCENE_DSL_VERSION', () => {
  it('is the v0.2 DSL version', () => {
    expect(SCENE_DSL_VERSION).toBe('0.2');
  });

  it('matches the package minor version', async () => {
    const pkg = (await import('../package.json', { with: { type: 'json' } })).default;
    const [major, minor] = pkg.version.split('.');
    expect(`${major}.${minor}`).toBe(SCENE_DSL_VERSION);
  });
});
