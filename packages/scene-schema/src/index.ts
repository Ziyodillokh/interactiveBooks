/**
 * Scene DSL version this package implements. Every scene document carries it in `version`;
 * the validator rejects documents from other majors/minors (MASTER_PLAN §6, Phase 1).
 */
export const SCENE_DSL_VERSION = '0.2' as const;

export type SceneDslVersion = typeof SCENE_DSL_VERSION;
