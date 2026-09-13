# Architecture Decision Records

Format: context → decision → consequences. Newest at the bottom. Superseded ADRs are kept and marked.

## ADR-001 — Scene DSL is the contract; AI never generates HTML/JS

**Context.** The product turns prompts and textbook material into interactive lessons for children. Letting an LLM emit HTML/JavaScript per lesson would make every lesson a unique, untestable program: no shared behaviour, no editor, no analytics, no safety guarantees, and quality tied to the model of the day.

**Decision.** Define our own **Scene DSL** (JSON). It is the single contract between AI, backend, editor, engine, player and analytics. AI output is DSL JSON constrained by the schema; the engine implements a closed vocabulary of scene/object/interaction/animation types. There is exactly one representation of a lesson; the editor mutates it, the engine renders it, AI generates it.

**Consequences.** New capabilities require adding a type to the DSL *and* implementing it in the engine and editor (deliberate friction). Content is portable, versionable and testable. Model changes do not change behaviour.

## ADR-002 — JSON Schema (2020-12) is the source of truth; types are generated; validation is two-layered

**Context.** The DSL must be enforced at generation time (Ollama structured outputs accept a JSON Schema), at API boundaries, in the editor and in tests. Hand-written TypeScript types would drift from the runtime schema.

**Decision.** JSON Schema files in `packages/scene-schema/schema` are canonical. TypeScript types are generated (json-schema-to-typescript) and committed; a `codegen:check` task guards freshness. Runtime validation uses Ajv (strict, allErrors, formatted errors). **Semantic validation** (rules that a schema cannot express: reference integrity, arithmetic, satisfiable completion) lives in `packages/validation` as explicit, individually testable rules producing a `ValidationReport`.

**Consequences.** One artefact feeds the LLM, the validator and the types. Zod was considered (used in the owner's other projects) but rejected as the source of truth because the LLM needs JSON Schema and duplicating definitions would violate ADR-001's single-source principle.

## ADR-003 — Local-first AI behind a provider abstraction

**Context.** A verified local runtime exists (Ollama 0.34, `qwen3.5:9b`, structured outputs, Uzbek, vision). Cloud APIs cost money, add latency and privacy questions, but will be needed for hard cases (whole PDFs, quality fallback).

**Decision.** `packages/ai-core` exposes `AIProvider.generateStructured<T>()`. `OllamaProvider` is the default; `GeminiProvider` is added in Phase 10 behind configurable routing (`AI_PROVIDER`, `AI_FALLBACK_PROVIDER`). Business logic (prompting, validation, repair) never imports a concrete provider. Pipeline rule: schema validation → semantic validation → repair (≤ 2) → typed failure; invalid output is never accepted. No additional LLMs without a documented technical reason.

**Consequences.** The same pipeline runs in the browser playground, the API and evals. Provider quirks (Ollama `think`, `format`, `num_ctx`) stay inside the adapter.

## ADR-004 — PixiJS 8 for the interactive engine; React only wraps it

**Context.** Scenes need sprites, drag-and-drop, tweens and hit-testing at 60 fps on tablets and laptops, plus deterministic state for completion rules and analytics. DOM/CSS animation does not scale to many objects; a full game engine (Phaser, Unity-like) is heavier than needed; Framer Motion is a UI library.

**Decision.** `packages/scene-engine` is framework-agnostic TypeScript on PixiJS 8 with separated concerns: `Renderer`, `InteractionController`, `AnimationController`, `SceneState`, `CompletionEvaluator`, `EventBus`. A thin React wrapper mounts it. Framer Motion (`motion`) is used only for application UI.

**Consequences.** State logic is testable without a canvas. The engine can later be embedded in a mobile-first player.

## ADR-005 — Monorepo layout (pnpm workspaces + Turborepo) and package boundaries

**Context.** The brief proposes `apps/{web,api,player}` and `packages/{scene-schema,scene-engine,ai-core,validation,asset-types,shared,ui}`.

**Decision.** Adopt the layout with two adjustments: `asset-types` becomes **`assets`** (definitions, registry *and* the SVG pack — one concern, one package); **`shared`** is created only when a second consumer needs it. `tooling/` holds shared `tsconfig` and `eslint` configs. Import direction is fixed: `scene-schema` imports nothing from the workspace; `validation → scene-schema`; `ai-core → scene-schema, validation, shared`; `scene-engine → scene-schema, assets`; apps import packages, packages never import apps.

**Consequences.** Package graph is acyclic and reviewable; Turborepo caches build/lint/test per package.

## ADR-006 — Toolchain versions: Node 24 LTS, pnpm 11, TypeScript 5.9, NestJS 11, Vitest 4

**Context (2026-09-13).** The machine's nvm default was Node 20 (EOL, pnpm 11 shim broken). npm's latest majors are very fresh: TypeScript 7.0 (native compiler, Jul 2026), NestJS 12.0 (27 Aug 2026), Vitest 5.0 (3 Sep 2026), pnpm 12.4 (10 Sep 2026).

**Decision.** Node **24.21 LTS** via nvm (`.nvmrc`; the machine-wide default alias is left at 20 — the owner may switch with `nvm alias default 24`). pnpm **11.27** via corepack (`packageManager`). TypeScript **5.9.3** — NestJS relies on `emitDecoratorMetadata` and the ecosystem (eslint, Next, Nest) has not proven TS 7 compatibility for our stack; revisit as a chore. NestJS **11.2** (12 is two weeks old). Vitest **4.1** (5 is ten days old).

**Consequences.** Predictable builds now; scheduled upgrade chores later, each with its own commit.

## ADR-007 — ORM: Prisma over TypeORM

**Context.** Requirements: simplicity, migrations, maintainability, TypeScript DX, NestJS integration. The owner's existing backend (`farzandim-backend`) already uses Prisma 6; a Prisma engine cache exists on the machine.

**Decision.** **Prisma 7** with `@prisma/adapter-pg` on PostgreSQL 16. Declarative schema, generated type-safe client, `prisma migrate` history, straightforward `PrismaService` in NestJS. TypeORM's decorator entities duplicate domain types, its migration story is weaker, and its typing is looser.

**Consequences.** DSL JSON is stored in `Json` columns with an explicit `dslVersion`; relational structure stays minimal (Book → Chapter → Lesson → Scene, BookVersion snapshots, Asset, Generation audit).

## ADR-008 — One test runner: Vitest across the monorepo; Playwright for E2E later

**Context.** The brief allows Jest for NestJS "if better integrated". The owner's projects use Vitest. Two runners mean two configs, two mocking styles and slower CI.

**Decision.** Vitest everywhere. NestJS tests use `unplugin-swc` so decorator metadata is emitted. Playwright is introduced when the Creator exists (Phase 7+).

**Consequences.** Shared test utilities and one coverage story. If Nest + Vitest integration proves brittle in Phase 5, this ADR is revisited rather than worked around.

## ADR-009 — `apps/player` is a Vite + React SPA (playground now, Book Player later)

**Context.** Phase 3 needs a lightweight page that mounts the PixiJS engine, loads JSON and shows state/events. The future Book Player is a mobile-first, embeddable runtime that does not need SSR.

**Decision.** `apps/player` on Vite 8. The Creator (`apps/web`) stays on Next.js. Both consume `packages/ui` tokens and `packages/scene-engine`.

**Consequences.** Two frontend build tools in the repo, but each is the simplest fit for its surface; the engine's React wrapper is shared, so preview inside the Creator and the standalone player render identically.

## ADR-010 — Logical canvas coordinates; object positions are optional (engine auto-layout)

**Context.** v0.1 described objects as groups with counts (`{type: apple, count: 7}`), which an LLM produces reliably but which cannot express per-object editing. v0.2 (per the brief) models individual `SceneObject`s with position/size. Asking a 9B model to invent 10 coordinate pairs is unreliable and expensive.

**Decision.** Scenes declare a logical canvas in `layout` (fixed units, e.g. 1280 × 720; the engine scales to the viewport). `SceneObject.position` is **optional**: objects without a position are placed deterministically by the engine's auto-layout (by `group`, in reading order). Explicit positions (set by the editor) always win. The DSL therefore has one representation that is both AI-friendly and editor-precise.

**Consequences.** The engine owns a deterministic layout algorithm (tested). The semantic validator checks counts by `group`, not by coordinates. Editors can "pin" objects by writing positions.

## ADR-011 — Workspace packages are ESM-only; `apps/api` is an ESM NestJS app

**Context.** Every `@ibp/*` package is compiled with `module: NodeNext` from `"type": "module"` sources and exposes `exports: { ".": { types, default } }` pointing at ESM `dist/`. A dual CJS/ESM build (tsup, two `dist` trees, `require`/`import` conditions) would double the build surface for one consumer. NestJS 11 scaffolds CommonJS (`module: commonjs`, `moduleResolution: node10`) by default; such a consumer cannot resolve an ESM-only `exports` map (TS2307), while Node 24 `require(esm)` and TypeScript 5.9 under `NodeNext` both handle it.

**Decision.** All workspace packages are **ESM-only**: one `dist/`, `types` + `default` conditions, no CJS artefact. `apps/api` (Phase 5) is therefore built as an **ESM NestJS application**: `"type": "module"`, `module`/`moduleResolution: NodeNext` via `@ibp/tsconfig/node.json`, Vitest with `unplugin-swc` for decorator metadata (ADR-008). Bundler-resolved apps (Next.js, Vite) need nothing special. A dual build is adopted only if a required dependency proves incompatible with an ESM Nest app; that would be its own ADR.

**Consequences.** One module format across the repo, no `require`/`import` drift. A stock `nest new` scaffold is not used as-is; the Phase 5 bootstrap must set the ESM options explicitly and is reviewed against this ADR.
