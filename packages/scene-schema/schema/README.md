# schema/

The Scene DSL JSON Schema (draft 2020-12) will live here — one file per top-level document
(`scene.schema.json`, `lesson.schema.json`, …) with shared `$defs`.

It is the single source of truth: `pnpm codegen` derives `src/generated/*.ts` from it, and the
Ajv validator loads it at runtime. See `docs/MASTER_PLAN.md` §6 Phase 1 and ADR-002.
