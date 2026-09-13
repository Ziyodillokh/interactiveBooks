# Development

How to set up, build and extend the `interactive-book-platform` monorepo.
Architecture and phase plan: [`MASTER_PLAN.md`](./MASTER_PLAN.md); decisions: [`DECISIONS.md`](./DECISIONS.md).

## Prerequisites

| Tool    | Version | How                                                          |
| ------- | ------- | ------------------------------------------------------------ |
| Node.js | 24 LTS  | `nvm use` (reads `.nvmrc`); the nvm default may stay at 20   |
| pnpm    | 11.27   | `corepack enable` — version comes from `packageManager`      |
| Ollama  | 0.34+   | `open -a Ollama`, model `qwen3.5:9b` pulled (Phase 2 onward) |

```bash
nvm use                 # Node 24 for this shell
corepack enable         # installs the pnpm shim pinned in package.json
pnpm install            # workspace install, creates/updates pnpm-lock.yaml
```

Without `corepack enable`, prefix commands with `corepack pnpm …` (set
`COREPACK_ENABLE_DOWNLOAD_PROMPT=0` for non-interactive shells).

## Scripts

All root scripts fan out through Turborepo (`turbo.json`) to every workspace package that
defines the same script, in dependency order, with caching.

| Command              | What it does                                                           |
| -------------------- | ---------------------------------------------------------------------- |
| `pnpm build`         | `tsc` per package → `dist/` (codegen and dependencies first)           |
| `pnpm typecheck`     | `tsc --noEmit` per package, including tests and config files           |
| `pnpm lint`          | ESLint flat config from `@ibp/eslint-config`, `--max-warnings 0`       |
| `pnpm test`          | Vitest with v8 coverage, one run per package (`coverage/` is cached)   |
| `pnpm codegen`       | schema → generated TS types (`src/generated/`, committed)              |
| `pnpm codegen:check` | fails when the committed `src/generated/` is stale — CI gate           |
| `pnpm clean`         | removes `dist/`, `coverage/`, `.turbo/` per package                    |
| `pnpm format`        | Prettier over the whole repo (root-level; not a Turbo task on purpose) |
| `pnpm format:check`  | same, read-only — CI gate                                              |

Filter to one package: `pnpm turbo run test --filter=@ibp/scene-schema`, or run the package
script directly: `pnpm --filter @ibp/scene-schema test:watch`.

Task order in `turbo.json`: `build`, `typecheck`, `lint` and `test` all depend on the package's
own `codegen` (so they never run against stale generated types); `build`, `typecheck` and `test`
also depend on `^build` (dependencies' `dist/`). Packages without a `codegen` script are skipped.
`codegen --check` is a separate task (`codegen:check`) because Turbo does not pass CLI flags
through to package scripts.

Turbo caches every task by input hash; a second unchanged run reports `FULL TURBO`.
Force a rerun with `--force`.

**Watch mode.** Consumers resolve workspace packages through `dist/`, so `test:watch` in a
consumer does not see source edits in its dependencies. Run their `dev` script (`tsc --watch`)
alongside: `pnpm turbo run dev --filter=@ibp/<consumer>^` in one terminal,
`pnpm --filter @ibp/<consumer> test:watch` in another.

## How packages are structured

Every package under `packages/*` follows the compiled-package convention (ADR-005) and is
**ESM-only** (ADR-011):

```
packages/<name>/
├── package.json        "type": "module", "exports": { ".": { "types", "default" } }, "files": ["dist"]
├── tsconfig.json       extends @ibp/tsconfig/base.json, noEmit — typecheck + editor (src, test, configs)
├── tsconfig.build.json extends @ibp/tsconfig/library.json (or react-library.json) — emits src/ → dist/
├── eslint.config.js    uses @ibp/eslint-config
├── vitest.config.ts    environment node, collects {src,test}/**/*.test.{ts,tsx} only
├── src/                sources; src/generated/ is codegen output (committed, never edited)
├── test/               *.test.ts
├── schema/             JSON Schema sources (only for packages that own a schema)
└── scripts/            codegen and other package-local tooling (.mjs)
```

- **Compiled, not source-linked.** Consumers import `dist/` through `exports`; that is why
  `typecheck` and `test` depend on `^build` in `turbo.json` — the root scripts build dependencies
  automatically, so no manual `pnpm build` is needed after a clone. React-facing packages use
  `@ibp/tsconfig/react-library.json`, which emits the same way (DOM lib + `jsx: react-jsx` added).
- **ESM-only.** `exports` has `types` + `default` pointing at ESM `dist/`; there is no CJS build.
  Node 24 `require()` of these packages works (`require(esm)`), and TypeScript 5.9 accepts it under
  `module: NodeNext`, but `moduleResolution: node10` / `module: commonjs` consumers cannot resolve
  them. Consequently `apps/api` (NestJS 11) must be an ESM app (`"type": "module"`, `NodeNext`,
  Vitest via `unplugin-swc`) — a default `nest new` scaffold does not qualify (ADR-011).
- **`exports` is the public API.** Only `.` is exposed; deep imports are impossible by design.
- **Codegen output is committed.** `pnpm codegen` writes `src/generated/`; `pnpm codegen:check`
  fails when the committed output is stale (wired in Phase 1 step 2). Generated files are excluded
  from lint (`**/src/generated/**`), Prettier (`**/src/generated/`) and coverage.
- **Toolchain is hoisted.** `typescript`, `eslint`, `vitest`, `prettier`, `turbo`, `@types/node`
  are root devDependencies. Packages declare the ones they invoke as plain semver devDependencies
  (never `workspace:*` for external tools) so pnpm resolves a single copy from the store.
- **Node globals are opt-in.** `base.json` sets `types: []`; only `@ibp/tsconfig/node.json`
  includes `@types/node`. A library that touches `process`/`fs`/`Buffer` in `src/` fails `tsc`
  (typecheck is the authority for TS files — ESLint's `globals.node` only serves `scripts/*.mjs`).
  Tests that need Node APIs add `"types": ["node"]` to the package `tsconfig.json`.
- **Coverage thresholds** (80 % policy) are switched on in `vitest.config.ts` once the
  parser/validator land (Phase 1 step 2) — until then the policy has no enforcement point.

## Adding a package

1. `mkdir packages/<name>` and copy the five files above (`package.json`, `tsconfig.json`,
   `tsconfig.build.json`, `eslint.config.js`, `vitest.config.ts`) from `packages/scene-schema`.
2. Set `name` to `@ibp/<name>`, `version` to `0.1.0`, `private: true`. Only `scene-schema`'s
   version tracks the DSL version (its minor equals `SCENE_DSL_VERSION`, enforced by a test).
3. Add workspace dependencies with `"@ibp/other": "workspace:*"` — respect the import direction
   in MASTER_PLAN §3 (packages never import apps; `scene-schema` imports nothing from the workspace).
4. A package or app that extends `@ibp/tsconfig/node.json` (or uses Node globals in tests) adds
   `"@types/node": "^24"` to its devDependencies.
5. `pnpm install` (updates the lockfile), then `pnpm build && pnpm typecheck && pnpm lint && pnpm test`.
6. Document the package in `docs/` (a section or its own file) — part of the definition of done.

Apps go under `apps/*` with `@ibp/tsconfig/node.json`, `react-library.json` or `nextjs.json`.
Shared tooling goes under `tooling/*` (`tooling/eslint` lints itself; `tooling/tsconfig` is JSON only).

## Conventions

- **Strict TypeScript** (`@ibp/tsconfig/base.json`): `strict`, `noUncheckedIndexedAccess`,
  `verbatimModuleSyntax`, `NodeNext` resolution — relative imports carry the `.js` extension.
  Target/lib are `ES2024` (Node 24 implements it in full).
- **No `any`.** `@typescript-eslint/no-explicit-any` is an error; use `unknown` and narrow.
  If `any` is unavoidable, disable the rule on that line with a comment saying why.
- **No `console` outside `scripts/`.** `no-console` is a warning and packages lint with
  `--max-warnings 0`, so it fails CI; `scripts/**` opt out in the package `eslint.config.js`.
- **Type-only imports are explicit** (`import { type X }`), unused names start with `_`.
- **Tests live with the package** (`test/` or `*.test.ts` next to the source), Vitest everywhere
  (ADR-008), Arrange–Act–Assert, descriptive names. Only `*.test.ts` / `*.test.tsx` are collected;
  `*.spec.*` is silently ignored.
- **Formatting is Prettier's job**: 100 columns, single quotes, trailing commas, semicolons.
- **Conventional Commits** scoped by package: `feat(scene-schema): …`, `chore(tooling): …`,
  `docs: …`. One logical change per commit.
- **Typed constants, no magic strings** — vocabularies come from the schema (via codegen).

## Troubleshooting

**`pnpm` prints "requires at least Node.js v22.13" and dies with `node:sqlite` under Node 20.**
The machine default is Node 20; the pnpm 11 shim itself aborts (warn lines, then
`ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite`) before any repo config is read. Run `nvm use`
(or `nvm use 24`) in the shell first. `engine-strict=true` in `.npmrc` only guards
`pnpm install` once pnpm can start; note that `./node_modules/.bin/turbo` still runs under
Node 20 and happily replays cached results, so a wrong runtime is not caught for cached tasks.

**`corepack: command not found` / download prompt.** Corepack ships with Node 24; ensure the
nvm Node is active. In non-interactive shells set `COREPACK_ENABLE_DOWNLOAD_PROMPT=0`.

**`typecheck` cannot find `@ibp/...` types.** The consumer reads `dist/index.d.ts`; run
`pnpm build` (Turbo does this automatically via `^build` when you use the root scripts; only
package-local invocations such as `pnpm --filter … typecheck` or `vitest` skip it).

**Turbo replays a stale result.** Shared configs in `tooling/*` are declared as task inputs
(`$TURBO_ROOT$/tooling/...` in `turbo.json`), so editing them invalidates consumers. If a new
kind of shared input appears, add it there; as a last resort `pnpm turbo run <task> --force`.

**Ollama not running (Phase 2+).** AI tests and generation expect `http://localhost:11434`.
`open -a Ollama` and confirm with `ollama list` that `qwen3.5:9b` is present. Packages without
AI dependencies (`scene-schema`, `validation`) never need it.
