#!/usr/bin/env node
/**
 * Placeholder for the Scene DSL codegen (MASTER_PLAN §6, Phase 1 step 2).
 *
 * The real script will read schema/scene.schema.json, run json-schema-to-typescript and write
 * src/generated/*.ts (committed). `--check` (`pnpm codegen:check` from the root) will exit non-zero
 * when the committed output is stale.
 * Until the schema exists this only documents the contract and exits 0 so `pnpm codegen` is wired.
 */
const isCheck = process.argv.includes('--check');

console.log('[scene-schema] codegen placeholder');
console.log('  input : schema/**/*.schema.json (not written yet)');
console.log('  output: src/generated/*.ts');
console.log(`  mode  : ${isCheck ? 'check (fail when stale)' : 'write'}`);
console.log('  status: nothing to do until the JSON Schema lands');
