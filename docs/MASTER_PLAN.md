# Master Plan — AI-Powered Interactive Book Platform

| | |
|---|---|
| Status | Phase 0 complete (audit + plan). Awaiting go-ahead for Phase 1. |
| Source brief | [`PRODUCT_SPEC.md`](./PRODUCT_SPEC.md) (verbatim, does not change) |
| Decisions log | [`DECISIONS.md`](./DECISIONS.md) (ADRs) |
| Last updated | 2026-09-13 |

This plan interprets the brief into an executable sequence. Every phase has a goal, scope, deliverables, acceptance criteria and dependencies. Phases are executed one at a time; each ends with green lint/typecheck/tests, updated docs and a commit.

---

## 1. Product vision (condensed)

An authoring platform where teachers, authors and publishers create **interactive educational books without coding**. A static task such as `7 − 3 = ?` becomes an experience: seven apples appear, the child removes three, four remain, and only then the abstraction `7 − 3 = 4` is shown.

Pedagogical spine: **SEE → INTERACT → UNDERSTAND → ABSTRACT → PRACTICE → FEEDBACK**.

Three product areas (long term): **CREATE** (books, chapters, lessons, scenes, AI generation, visual editor), **PUBLISH** (versions, library, distribution), **LEARN** (player, progress, analytics). We build the technology foundation first.

Division of responsibility that the architecture must preserve:

| Layer | Responsibility |
|---|---|
| AI | decides **what** educational experience should exist |
| Scene DSL | defines **what** that experience contains |
| Interactive Engine | defines **how** it behaves |
| Creator | lets humans **edit** it |
| Player | lets children **experience** it |

## 2. Non-negotiable principles

1. **The Scene DSL is the contract** between AI, backend, editor, engine, player and analytics. One source of truth; no parallel representations. ([ADR-001](./DECISIONS.md#adr-001))
2. **AI never emits HTML/JS.** It emits DSL JSON constrained by a JSON Schema. ([ADR-001](./DECISIONS.md#adr-001))
3. **Validation is deterministic and owned by code**: schema validation (Ajv) then semantic validation (rules). AI output is never silently accepted. ([ADR-002](./DECISIONS.md#adr-002))
4. **Local-first AI** (Ollama, `qwen3.5:9b`) behind a provider abstraction; cloud (Gemini) is a fallback adapter, not a dependency. ([ADR-003](./DECISIONS.md#adr-003))
5. **Engine is framework-agnostic TypeScript on PixiJS**; React only wraps it. UI motion (Framer Motion) never touches the engine. ([ADR-004](./DECISIONS.md#adr-004))
6. **Foundation before UI**, but when the Creator phase starts, visual quality is a first-class requirement of that phase (DESIGN → IMPLEMENT → REVIEW → REFINE).
7. **Small and coherent.** DSL v0.2 stays minimal; every type added to the DSL must be implemented by the engine and the editor in the same or next phase.

## 3. Architecture overview

```
                       ┌──────────────────────── apps ────────────────────────┐
                       │  web (Next.js, Creator)   player (Vite, Player)   api (NestJS) │
                       └───────┬────────────────────────┬───────────────────┬───────┘
                               │                        │                   │
   ┌──────────┐   ┌────────────▼──┐   ┌─────────────────▼───┐   ┌───────────▼─────────┐
   │   ui     │   │ scene-engine  │   │  assets             │   │  ai-core            │
   │ tokens,  │   │ Pixi runtime  │   │  definitions + SVG  │   │  providers, prompts │
   │ glass,   │   │ + React wrap  │   │  registry           │   │  pipeline, repair   │
   │ primitives│  └───────┬───────┘   └──────────┬──────────┘   └───────────┬─────────┘
   └──────────┘           │                      │                          │
                          └──────────┬───────────┴──────────────────────────┘
                                     ▼
                     ┌──────────────────────────────┐   ┌──────────────────────────┐
                     │  validation (semantic rules) │──▶│ scene-schema             │
                     └──────────────────────────────┘   │ JSON Schema (truth),     │
                                                        │ generated types, parser, │
                                                        │ Ajv validator, constants │
                                                        └──────────────────────────┘
   infra: Ollama (localhost:11434) · PostgreSQL 16 · Redis · local FS / S3-compatible storage
```

End-to-end data flow:

```
prompt ──▶ ai-core.PromptBuilder ──▶ AIProvider(Ollama) ──▶ JSON (schema-constrained)
      ──▶ scene-schema.validate ──▶ validation.semantic ──▶ [invalid → repair prompt, ≤ 2] ──▶ Lesson DSL
      ──▶ api persists (Phase 6) ──▶ web editor edits the same DSL ──▶ scene-engine renders it
      ──▶ engine events (scene:loaded … scene:completed) ──▶ player/analytics (later)
```

Import rules (enforced by package boundaries and reviewed in every phase):

| Package | May import |
|---|---|
| `scene-schema` | nothing from the workspace (Ajv only) |
| `validation` | `scene-schema` |
| `assets` | `scene-schema` (object type ids) |
| `ai-core` | `scene-schema`, `validation`, `shared` |
| `scene-engine` | `scene-schema`, `assets` (PixiJS) |
| `ui` | `shared` (React, Tailwind, motion, lucide) |
| `apps/*` | any package; **packages never import apps** |

## 4. Monorepo structure

```
interactive-book-platform/
├── apps/
│   ├── web/            Next.js 16 — Creator (Phase 7)
│   ├── api/            NestJS 11 — HTTP API (Phase 5), Prisma + PostgreSQL (Phase 6)
│   └── player/         Vite + React — engine playground (Phase 3) → Book Player later
├── packages/
│   ├── scene-schema/   JSON Schema source of truth, generated TS types, parser, Ajv validator, typed constants   (Phase 1)
│   ├── validation/     semantic rule engine + ValidationReport                                               (Phase 1)
│   ├── ai-core/        AIProvider, OllamaProvider, PromptBuilder, generation pipeline, repair loop, eval harness (Phase 2)
│   ├── scene-engine/   PixiJS runtime: Renderer, InteractionController, AnimationController, SceneState,
│   │                   CompletionEvaluator, EventBus; React wrapper                                            (Phase 3)
│   ├── assets/         AssetDefinition, registry, starter SVG pack                          (Phase 3 minimal → Phase 4)
│   ├── shared/         Result type, ids, error base classes, i18n message keys — created when first needed
│   └── ui/             design system: tokens, glass materials, typography, motion, primitives                (Phase 7)
├── tooling/
│   ├── tsconfig/       base / library / react / node tsconfigs
│   └── eslint/         shared flat config
├── docs/               MASTER_PLAN, PRODUCT_SPEC, DECISIONS, ARCHITECTURE, SCENE_DSL, AI_PIPELINE,
│                       AI_EVAL_RESULTS, ENGINE, DEVELOPMENT
├── examples/           scene/lesson fixtures (v0.1 reference + v0.2), eval prompts
├── package.json · pnpm-workspace.yaml · turbo.json · .nvmrc · .gitignore · .editorconfig
```

Deviations from the brief and why ([ADR-005](./DECISIONS.md#adr-005)):
- `packages/asset-types` → **`packages/assets`**: the package holds the SVG pack and registry, not only types; two packages for one concern would be an unnecessary package.
- `packages/shared` is created **only when a second consumer needs it** (expected in Phase 2), to avoid a dumping ground.
- No `infra/` folder for the MVP: PostgreSQL 16 and Redis are already installed via Homebrew on this machine; a `docker-compose.yml` is added in Phase 6 only as an optional alternative.

## 5. Technology decisions (pinned)

| Concern | Choice | Version | Note / ADR |
|---|---|---|---|
| Runtime | Node.js | 24.21 LTS (nvm, `.nvmrc`) | Node 20 (EOL) stays the machine default; the repo pins 24 — [ADR-006](./DECISIONS.md#adr-006) |
| Package manager | pnpm via corepack | 11.27 | `packageManager` field; pnpm 12 (2 days old) not adopted yet |
| Monorepo | Turborepo | 2.10 | pipelines: build, lint, typecheck, test, codegen |
| Language | TypeScript | **5.9.3** | TS 7 (native compiler, Jul 2026) postponed until Nest/Next/eslint support is proven — [ADR-006](./DECISIONS.md#adr-006) |
| Schema | JSON Schema 2020-12 + Ajv + json-schema-to-typescript | Ajv 8.20, jsts 16 | [ADR-002](./DECISIONS.md#adr-002) |
| Engine | PixiJS | 8.20 | [ADR-004](./DECISIONS.md#adr-004) |
| Creator | Next.js + React + Tailwind | 16.3 / 19.3 / 4.3 | shadcn/ui only for primitives that earn their place; icons: lucide-react |
| UI motion | `motion` (Framer Motion) | 13 | application UI only |
| Player / playground | Vite + React | 8.3 / 19.3 | [ADR-009](./DECISIONS.md#adr-009) |
| API | NestJS | **11.2** | NestJS 12.0 is 2 weeks old; re-evaluate at Phase 5 — [ADR-006](./DECISIONS.md#adr-006) |
| Database / ORM | PostgreSQL 16 + **Prisma** | 7.10 | [ADR-007](./DECISIONS.md#adr-007) |
| Cache / queue | Redis; BullMQ only if async generation is needed | — | postponed until a real need (Phase 9+) |
| Storage | `StorageAdapter` interface: local FS first, S3/MinIO adapter later | — | Phase 6 |
| Tests | **Vitest** everywhere (NestJS via `unplugin-swc`); Playwright later | 4.1 | [ADR-008](./DECISIONS.md#adr-008) |
| Lint / format | ESLint 10 (flat) + typescript-eslint 8 + Prettier 3 | — | shared config in `tooling/eslint` |
| AI | Ollama `qwen3.5:9b`; Gemini adapter in Phase 10 | Ollama 0.34 | [ADR-003](./DECISIONS.md#adr-003) |

## 6. Phases

Sizes: S ≈ one focused session, M ≈ 2–3, L ≈ 4+. Each phase ends with: lint ✓ typecheck ✓ tests ✓ docs updated ✓ commit ✓ summary.

### Phase 0 — Audit & plan ✅

Findings (2026-09-13):
- `~/Developer/interactive-book-ai/` holds the verified local AI environment: Ollama 0.34.0, `qwen3.5:9b` (6.6 GB, 34–39 tok/s, vision 5/5), Scene DSL **v0.1** schema + a validated example, system prompt, test scripts, OCR tooling (macOS Vision, Tesseract `uzb`/`uzb_cyrl`, poppler). Kept as-is; reused as reference and migrated into `examples/`.
- Toolchain: Node 20.20.2 was the nvm default with a broken pnpm 11 shim (needs Node ≥ 22.13). **Node 24.21.0 LTS installed via nvm** (default untouched); pnpm 11.27 available through corepack.
- Services already installed via Homebrew: `postgresql@16`, `redis`. Docker CLI + colima (VM stopped, 4 GiB) exist but are not required.
- Existing repositories of the owner use **Prisma 6, Fastify, Vitest 4, Zod** (`farzandim-backend`) and **pnpm 10** (`octogent`) → informs ORM/test-runner choices.
- Fresh majors on npm (TS 7.0, NestJS 12.0, Vitest 5.0, pnpm 12): deliberately not adopted (see §5).
- Git identity on this machine: `polvonuzb <rashidkhalikov1995@gmail.com>` (global config, unchanged). New repo initialised on `main`.

### Phase 1 — Workspace bootstrap + Scene DSL v0.2 (size M) — **first critical implementation**

Goal: a production-quality, AI-independent DSL package that every other layer depends on.

Scope:
1. **Bootstrap**: root `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.nvmrc`, `tooling/tsconfig`, `tooling/eslint`, Prettier, `.editorconfig`, `.gitignore`; `examples/` seeded from the v0.1 work; docs skeleton.
2. **`packages/scene-schema`**
   - `schema/` — JSON Schema 2020-12 with `$defs` for `Book → Chapter → Lesson → Scene` (Book/Chapter/Lesson are thin containers; Scene is the focus).
   - Scene v0.2 model: `id, version, type, title?, instruction?, learningObjective?, layout, objects[], interactions[], animations[], feedback, completion, metadata`.
   - `SceneObject`: `id, type, asset?, position?, size?, rotation?, zIndex?, draggable?, selectable?, group?, metadata`. Position is optional: objects without one are auto-arranged by the engine from `layout` — keeps AI output small and robust ([ADR-010](./DECISIONS.md#adr-010)).
   - Vocabularies (closed enums): object types `apple, car, ball, star, number, shape, text, container, generic-image`; scene types `count, compose, split, select, match, sort, multiple-choice`; interactions `tap, tap-count, select, drag-drop, drag-to-group`; animations `appear, disappear, move, scale, bounce, highlight`; feedback `success, hint, retry`; completion `target-count, target-state, correct-answer, all-required-actions`.
   - Codegen: `pnpm codegen` → `src/generated/*.ts` (committed) via json-schema-to-typescript; `pnpm codegen:check` fails when stale.
   - `parseScene()/parseLesson()` (JSON text → typed object or typed error), `validateScene()/validateLesson()` (Ajv, `allErrors`, strict), error formatter (`path · message · hint`), typed constants derived from the schema (no magic strings anywhere else).
3. **`packages/validation`** — `SemanticRule` interface, rule registry, `validateSceneSemantics()` → `ValidationReport { ok, issues[] { code, severity, path, message } }`. Initial rules: unique ids; referenced targets exist (interactions, animations, completion); counts ≥ 0 and integers; target count ≤ available objects; correct answer ∈ options; arithmetic correct when an expression is declared; completion is satisfiable; interaction type compatible with scene type; animation targets exist and durations are positive.
4. Docs: `SCENE_DSL.md` (model, vocabularies, examples, versioning policy), `DEVELOPMENT.md` (setup, scripts).

Tests (Vitest): valid — count, compose, drag-drop (split), multiple-choice; invalid — duplicate ids, missing target, answer not in options, impossible target count, malformed animation, unsupported interaction type; plus parser error paths and a codegen-freshness test.

Acceptance: `pnpm turbo lint typecheck test` green; schema + semantic validation deterministic (same input → same report); zero AI dependency; generated types match schema; v0.2 examples in `examples/` validate; a v0.1 → v0.2 migration of `scene-example.json` exists.

Depends on: Phase 0.

### Phase 2 — AI core (size M)

Goal: prompt → validated Lesson DSL through a provider-agnostic pipeline, measured on ≥ 20 prompts.

Scope: `packages/ai-core` — `AIProvider` interface (`generateStructured<T>({ system, user, schema, options })`), `OllamaProvider` (isomorphic `fetch`; `/api/chat` with `format: schema`, `think:false`, temperature 0.2, `num_ctx` 8192, consistent across calls), `PromptBuilder` (pedagogy rules, age appropriateness, concrete-before-abstract, DSL vocabulary summary generated from the schema, few-shot examples), `generateLesson()` pipeline (schema → semantic → repair prompt with the ValidationReport → max 2 repairs → typed `GenerationResult` success/failure with attempts and metadata; never silently accepts invalid output), provider routing hook for Phase 10. Eval harness `pnpm ai:eval` over `examples/eval-prompts.json` (≥ 20 first-grade maths prompts) tracking schema-valid rate, semantic-valid rate (first try / after repair), repair success rate, latency p50/p95, tokens → `docs/AI_EVAL_RESULTS.md`. `packages/shared` created here (Result type, error base).

Acceptance: unit tests with a mocked provider (pipeline, repair loop, failure typing) — no live AI in unit tests; live eval documented with targets: schema-valid ≥ 95 %, semantic-valid after repair ≥ 85 %, p50 ≤ 45 s per lesson on this machine. `docs/AI_PIPELINE.md` written.

Depends on: Phase 1.

### Phase 3 — Interactive engine + player playground (size L) — **Milestone 1**

Goal: a validated Scene plays in the browser and a child can interact with it.

Scope: `packages/scene-engine` (PixiJS 8): `Renderer`, `InteractionController`, `AnimationController`, `SceneState` (immutable updates, reducer-style), `CompletionEvaluator`, typed `EventBus` (`scene:loaded, object:tapped, object:selected, object:drag-start, object:drag-end, interaction:success, interaction:retry, scene:completed`), `ScenePlayer` facade + React wrapper. Initial support only: scenes `count, compose, split`; interactions `tap-count, drag-drop, drag-to-group`; animations `appear, move, bounce, highlight`; objects `apple, car, ball, number, text, container`. Auto-layout for objects without positions. `packages/assets` created with the minimum SVGs the engine needs (completed in Phase 4). `apps/player` (Vite): load example JSON, render, interact, reset, state inspector, event log, and a **dev-only "generate" panel** calling ai-core directly from the browser (Ollama allows localhost origins) so the full prompt → DSL → engine flow runs in one page.

Acceptance (**M1**): typing `1-sinf o'quvchisiga 10 sonining tarkibini olma yordamida tushuntir` in the playground produces a validated lesson that renders and can be completed by interaction; `examples/` scenes play end-to-end; engine unit tests for state, completion and event emission (no Pixi canvas needed); `docs/ENGINE.md`.

Depends on: Phase 1 (contract), Phase 2 (generation for the dev panel).

### Phase 4 — Asset system (size S)

Scope: `AssetDefinition { id, type, source, dimensions?, tags?, style? }`, registry + resolver, starter SVG pack in one consistent flat style (apple, car, ball, star, circle/square/triangle, basket, box/container), stored locally; engine resolves `SceneObject.asset` through the registry with type-based defaults. Original artwork only.

Acceptance: every object type in the DSL has a default asset; playground renders all of them; registry tests.

Depends on: Phase 3.

### Phase 5 — NestJS API (size M)

Scope: `apps/api` (NestJS 11): modules `health`, `ai`, `lessons`, `scenes`; `POST /lessons/generate` `{ grade, subject, prompt }` → validated Lesson DSL + metadata `{ provider, model, latencyMs, repairCount, validation }`; `POST /scenes/validate`; config via typed env (documented in `.env.example`); consistent error envelope; optional SSE stream of product-level generation stages (understanding → planning → creating → validating) for Phase 7 UX. No chain-of-thought exposure. No DB yet (in-memory store behind a repository interface).

Acceptance: e2e tests with a mocked provider; a live curl produces a lesson identical in shape to the playground flow.

Depends on: Phase 2.

### Phase 6 — Database foundation (size M)

Scope: Prisma 7 + PostgreSQL 16 (Homebrew service; optional compose file). Minimal entities: `User, Book, Chapter, Lesson, Scene, BookVersion, Asset, Generation` (Scene stores DSL JSON + `dslVersion`). Migrations, repositories replacing the in-memory store, CRUD endpoints for the book tree, `StorageAdapter` (local FS) for uploaded assets. Explicitly excluded: subscriptions, marketplace, schools, students, analytics.

Acceptance: `prisma migrate` from zero; repository tests against a test database; generate → persist → reload → still validates.

Depends on: Phase 5.

### Phase 7 — Creator MVP (size L) — **Milestone 2**

Scope: `packages/ui` design system first (semantic color tokens, 5-level glass material system, typography scale, spacing/radii, motion tokens, control heights, focus states, primitives: GlassPanel/GlassCard/GlassToolbar, Button, IconButton, Input, Select, Tabs, Tooltip, Dialog, InspectorSection, EmptyState, GenerationState). Then `apps/web`: Dashboard, Books, Create Book, Book Editor (left structure / center live PixiJS canvas / right inspector / top toolbar), AI panel "AI bilan yaratish" with staged generation and natural transition to preview, Preview. Uzbek-first copy with an i18n structure. Desktop-first; light theme shipped, tokens dark-ready.

Acceptance (**M2**): prompt → generate → interactive preview → edit properties → save → reopen → still works. Design review checklist from the brief passes (no generic dashboard, meaningful glass, readable text, 60 fps editor interactions on the M4 Pro).

Depends on: Phases 3–6.

### Phase 8 — First real book (size L)

Scope: pilot **1-sinf Matematika**, 10–20 original lessons (object properties, counting 1–5 / 1–10, comparison, compose 5 / 10, addition, subtraction, sequence, basic shapes) built **only through the Creator**. Every missing capability becomes a tracked platform improvement.

Acceptance: the book plays end-to-end in the player; gap list documented and triaged.

Depends on: Phase 7.

### Phase 9 — Quality system (size M)

Scope: error boundaries, loading states, retries, structured logging, API error format, generation audit log, validation reports UI, versioning basics; accessibility (keyboard, hit targets ≥ 44 px, reduced motion, contrast, no colour-only feedback).

Depends on: Phase 7 (can start earlier for infrastructure parts).

### Phase 10 — Cloud fallback (size S/M)

Scope: `GeminiProvider` implementing `AIProvider`; routing `AI_PROVIDER=local`, `AI_FALLBACK_PROVIDER=gemini`; fallback after failed repairs or for complex vision tasks; no hard-coded credentials.

Depends on: Phase 2 (interface), Phase 5 (config).

## 7. Milestones

| Milestone | Definition | After |
|---|---|---|
| **M1 — Prompt to playable lesson** | `1-sinf o'quvchisiga 10 sonining tarkibini olma yordamida tushuntir` → local Qwen → valid Scene DSL → PixiJS engine → a child can complete the lesson in the browser | Phase 3 |
| **M2 — Creator loop** | prompt → generate → interactive preview → edit properties → save → reopen → still works | Phase 7 |
| M3 — Pilot book | 10–20 original first-grade maths lessons authored in the platform | Phase 8 |

## 8. Dependency graph

```
P0 ─▶ P1 (bootstrap + DSL) ─▶ P2 (ai-core) ─▶ P3 (engine + playground) ═▶ M1
                       │                             │
                       │                             ├─▶ P4 (assets)
                       │                             │
                       └────────────▶ P5 (api) ─▶ P6 (db) ─▶ P7 (creator) ═▶ M2 ─▶ P8 (pilot book)
                                                                       │
                                            P2 ──────▶ P10 (cloud)     └─▶ P9 (quality)
```

## 9. Risks and mitigations

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R1 | Per-instance objects in v0.2 make AI output longer and error-prone (ids, positions) | invalid scenes, slow generation | optional `position` + engine auto-layout; ids generated by convention (`apple-1`); schema-constrained decoding; repair loop; measured in Phase 2 evals |
| R2 | Small model (9B) produces pedagogically weak or inconsistent content | poor lessons | pedagogy rules in the prompt, few-shot examples, semantic rules (object/word consistency), human editing in the Creator, Gemini fallback (Phase 10) |
| R3 | Memory pressure on the 24 GB dev machine (Ollama ~6 GB + Next dev + Postgres + browser) | slow dev loop | Homebrew Postgres/Redis instead of a 4 GiB VM; one model at a time; consistent `num_ctx` to avoid reloads |
| R4 | Generation latency (~25–45 s per lesson) hurts Creator UX | perceived slowness | staged progress states (SSE), streaming, async job only if needed (BullMQ postponed) |
| R5 | Deep-glass UI becomes expensive | jank | parent-level backdrop filters, ≤ 3 blurred layers on screen, profiling before sign-off |
| R6 | DSL evolution breaks stored content | data loss / broken lessons | `version` on every scene/lesson, additive changes, migration functions per version starting v0.1 → v0.2 |
| R7 | Fresh major versions (TS 7, Nest 12, Vitest 5, pnpm 12) | tooling breakage | pinned stable lines; upgrades as explicit chores |
| R8 | Scope creep from the very large brief | never reaching M1 | phase gates; postponed list (§10); M1 before any Creator UI |
| R9 | Uzbek typography/i18n gaps (apostrophes ʻ ’ ', Cyrillic later) | awkward UI | one canonical apostrophe policy in shared i18n utils; fonts verified for Latin Uzbek |
| R10 | PixiJS inside React (imperative lifecycle, HMR, resize) | leaks, double init | engine owns its lifecycle; React wrapper is thin (`mount/unmount/load`); tests on state logic without canvas |

## 10. Intentionally postponed

From the brief: TTS, AI video, marketplace, subscriptions, payments, school admin, student accounts, advanced analytics, collaboration, real-time multi-user editing, mobile apps, EPUB export, public marketplace, complex permissions.

Added by this plan: BullMQ/queues (until a measured need), MinIO/S3 (local FS adapter first), dark theme implementation (tokens only), languages beyond `uz` (+ `en` keys for developers), DSL migration tooling beyond v0.1 → v0.2, TypeScript 7 / NestJS 12 / Vitest 5 upgrades, vision/PDF ingestion in the Creator (available in ai-core after Phase 10), authentication (single local user until Phase 6+; real auth is a Phase 9+ decision).

## 11. Working agreement

- **Per phase**: read current code → state goal → implement → `pnpm lint` → `pnpm typecheck` → `pnpm test` → fix → update docs → commit → summary (what changed, tests, limitations, next).
- **Commits**: Conventional Commits scoped by package/app (`feat(scene-schema): …`, `test(validation): …`, `docs: …`, `chore(tooling): …`); one logical change per commit; no pushes unless a remote is explicitly configured.
- **Definition of done** for a package: strict TS, no `any` without a comment, small modules, typed constants (no magic strings), meaningful errors, tests around critical logic, README section in `docs/`.
- **Questions** to the owner are asked in Uzbek and only when the answer changes product behaviour, architecture, design direction, scope, cost, or involves destructive operations. Everything else is decided and recorded in `DECISIONS.md`.
- **If a phase exposes an architectural problem**: stop, fix the architecture, record the ADR, continue.

## 12. Environment prerequisites

```bash
nvm use                      # Node 24 (from .nvmrc); default nvm alias stays 20 until you change it
corepack enable              # pnpm 11 from package.json#packageManager
open -a Ollama               # local model runtime (qwen3.5:9b pulled)
# Phase 6:
brew services start postgresql@16 && brew services start redis
```
