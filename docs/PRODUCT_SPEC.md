# Product Specification — AI-Powered Interactive Book Platform

> Original product brief, saved verbatim on 2026-09-13. This is the source document for
> `MASTER_PLAN.md`; the plan interprets it, this file does not change.

---

You are acting as the LEAD SOFTWARE ARCHITECT + SENIOR FULL-STACK ENGINEER for a new product.

You have full access to my development machine, terminal, filesystem, existing local AI setup, and project workspace.

Your job is NOT to rush into coding.

Your job is to:
1. Understand the complete product vision.
2. Design the architecture professionally.
3. Break the work into clear phases.
4. Document decisions.
5. Implement phases one by one.
6. Test every phase before moving forward.
7. Keep the architecture scalable and maintainable from day one.

==================================================
PRODUCT
==================================================

We are building an:

AI-POWERED INTERACTIVE BOOK PLATFORM

This is NOT:
- a PDF reader
- a normal ebook app
- a static lesson builder
- a generic AI chat app

The product goal is:

Allow a teacher, author, publisher, or educational content creator to create interactive educational books without coding.

A traditional educational task like:

"7 - 3 = ?"

should be transformable into an interactive experience such as:

- 7 apples appear
- child removes 3
- 4 remain
- only then show:
  7 - 3 = 4

Core pedagogical principle:

SEE
→ INTERACT
→ UNDERSTAND
→ ABSTRACT
→ PRACTICE
→ FEEDBACK

==================================================
LONG-TERM PRODUCT VISION
==================================================

The future platform will have 3 main product areas:

1. CREATE
   - Create books
   - Create chapters
   - Create lessons
   - Create scenes
   - AI-assisted lesson generation
   - Visual editor
   - Animation configuration
   - Interaction configuration
   - Preview

2. PUBLISH
   - Publish books
   - Version books
   - Private/public library
   - Future marketplace
   - School/publisher distribution

3. LEARN
   - Interactive Book Player
   - Student progress
   - Attempts
   - Completion
   - Learning analytics

DO NOT implement all of this immediately.

We will build the technology foundation first.

==================================================
CURRENT LOCAL AI ENVIRONMENT
==================================================

The local AI environment is already prepared.

Machine:
- MacBook Pro 14"
- Apple M4 Pro
- 24 GB unified memory
- 1 TB SSD

Installed:
- Ollama 0.34.0
- Main model: qwen3.5:9b
- Model is multimodal
- 256K context
- Uzbek works well
- Structured JSON tested
- Vision tested
- Scene DSL generation tested
- Ollama API available locally

Main model:
qwen3.5:9b

Recommended runtime settings:
- structured output using JSON Schema
- think: false by default
- temperature: 0.2
- num_ctx: 8192 initially
- validation after generation
- repair loop max 2 attempts
- cloud fallback later

Cloud fallback:
Gemini API

DO NOT add more LLMs unless there is a clear technical reason.

==================================================
MOST IMPORTANT ARCHITECTURAL PRINCIPLE
==================================================

AI MUST NOT generate arbitrary HTML/JavaScript for each lesson.

That would make the platform unstable.

Instead:

USER PROMPT
↓
AI
↓
STRICT LESSON / SCENE JSON
↓
SCHEMA VALIDATION
↓
SEMANTIC VALIDATION
↓
INTERACTIVE ENGINE
↓
WORKING LESSON

We need our own:

SCENE DSL

This DSL will be the contract between:

- AI
- backend
- editor
- renderer
- player
- analytics

The Scene DSL is one of the most important assets of the entire platform.

==================================================
TECH STACK
==================================================

Use a modern TypeScript monorepo.

Preferred stack:

MONOREPO
- pnpm workspaces
- Turborepo

FRONTEND
- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui only where useful
- avoid unnecessary UI dependencies

INTERACTIVE ENGINE
- PixiJS
- TypeScript

UI ANIMATIONS
- Framer Motion only for application UI
- NOT for the interactive scene engine

BACKEND
- NestJS
- TypeScript

DATABASE
- PostgreSQL

ORM
Choose between:
- Prisma
or
- TypeORM

Inspect the existing environment and make a reasoned decision.
Prefer simplicity, migrations, maintainability, and good TypeScript DX.

CACHE / QUEUE
- Redis
- BullMQ if async generation jobs become useful

STORAGE
- S3-compatible abstraction
- MinIO for local development

VALIDATION
- JSON Schema
- Ajv

AI
- Ollama local
- qwen3.5:9b
- Gemini fallback adapter later

TESTING
- Vitest for packages/frontend where appropriate
- Jest for NestJS if better integrated
- Playwright for E2E later

==================================================
MONOREPO TARGET
==================================================

Create a clean structure similar to:

interactive-book-platform/
│
├── apps/
│   ├── web/
│   ├── api/
│   └── player/
│
├── packages/
│   ├── scene-schema/
│   ├── scene-engine/
│   ├── ai-core/
│   ├── validation/
│   ├── asset-types/
│   ├── shared/
│   └── ui/
│
├── docs/
│
├── examples/
│
├── tooling/
│
├── package.json
├── pnpm-workspace.yaml
└── turbo.json

You may improve this structure if you have a strong architectural reason.

Do NOT create unnecessary packages.

==================================================
PHASE 0 — AUDIT AND PLAN
==================================================

FIRST:

1. Inspect:
   - current ~/Developer/interactive-book-ai/
   - existing docs
   - scene.schema.json
   - scene-example.json
   - scripts
   - installed Node versions
   - pnpm
   - Git state
   - existing repositories

2. Do not overwrite useful files.

3. Read the existing architecture documents.

4. Create:

docs/MASTER_PLAN.md

This must contain:

- product vision
- architecture
- development phases
- dependencies between phases
- risks
- acceptance criteria
- what is intentionally postponed

Then STOP briefly and show me the plan summary before major implementation.

Do not ask unnecessary questions.

If a decision can be made professionally from available context, make it and document it.

==================================================
PHASE 1 — SCENE DSL v0.2
==================================================

THIS IS THE FIRST CRITICAL IMPLEMENTATION.

Create a production-quality Scene DSL package.

Package:

packages/scene-schema

The schema must support a clean base model for:

Book
→ Chapter
→ Lesson
→ Scene

BUT implementation focus is Scene.

Design extensibility carefully.

Minimum scene concepts:

Scene
- id
- version
- type
- title?
- instruction?
- learningObjective?
- layout
- objects
- interactions
- animations
- feedback
- completion
- metadata

SceneObject
- id
- type
- asset
- position
- size
- rotation
- zIndex
- draggable?
- selectable?
- metadata

Supported initial object types:

- apple
- car
- ball
- star
- number
- shape
- text
- container
- generic-image

Initial scene types:

- count
- compose
- split
- select
- match
- sort
- multiple-choice

Initial interaction types:

- tap
- tap-count
- select
- drag-drop
- drag-to-group

Initial animation primitives:

- appear
- disappear
- move
- scale
- bounce
- highlight

Feedback:

- success
- hint
- retry

Completion rules:

- target-count
- target-state
- correct-answer
- all-required-actions

Keep v0.2 SMALL and COHERENT.

Do NOT design 100 interaction types now.

==================================================
SCHEMA REQUIREMENTS
==================================================

Use JSON Schema as the source of truth.

Generate TypeScript types from it.

Provide:

- schema
- generated types
- parser
- validator
- meaningful validation errors

Use Ajv.

Add semantic validation separate from schema validation.

Examples of semantic rules:

- count cannot be negative
- IDs must be unique
- referenced target object must exist
- drag-drop target must exist
- correct answer must be one of options
- arithmetic result must be correct when specified
- target count cannot exceed available objects
- scene should not have impossible completion state

Create:

packages/validation

if semantic validation deserves separation.

==================================================
PHASE 1 TESTING
==================================================

Write tests for:

VALID:
- simple counting scene
- compose scene
- drag-drop scene
- multiple choice scene

INVALID:
- duplicate object IDs
- missing target
- wrong answer not in options
- impossible target count
- malformed animation
- unsupported interaction type

Acceptance:

- schema validation deterministic
- semantic validation deterministic
- no AI dependency
- types generated automatically
- tests pass

==================================================
PHASE 2 — AI CORE
==================================================

Create:

packages/ai-core

Responsibilities:

- provider abstraction
- prompt building
- structured generation
- schema-enforced output
- validation
- repair loop
- future cloud fallback

Design interfaces such as:

AIProvider

generateStructured<T>()

Providers:

OllamaProvider

Later:
GeminiProvider

Do NOT tightly couple business logic to Ollama.

==================================================
OLLAMA IMPLEMENTATION
==================================================

Use:

qwen3.5:9b

Local endpoint:
http://localhost:11434

Generate Scene JSON using the exact Scene Schema.

Flow:

User prompt
↓
system prompt
↓
Ollama
↓
structured JSON
↓
schema validator
↓
semantic validator
↓
if invalid:
repair prompt
↓
max 2 repairs
↓
if still invalid:
return typed failure
↓
future cloud fallback

Never silently accept invalid AI output.

==================================================
PROMPTING STRATEGY
==================================================

Create professional prompts.

The model must understand:

- age appropriateness
- educational objective
- concrete-before-abstract learning
- interaction should teach, not decorate
- use only supported DSL components
- avoid unsupported objects/interactions

Example:

"1-sinf o'quvchisiga 10 sonining tarkibini olma yordamida tushuntir."

Expected:
valid Scene DSL

Not HTML.

==================================================
PHASE 2 TESTS
==================================================

Create eval prompts:

At least 20 first-grade mathematics prompts.

Examples:

- 5 gacha sanash
- 10 gacha sanash
- 7+3
- 8-2
- compare 4 and 7
- number sequence
- compose 10
- split 9
- count shapes
- choose larger number

Track:

- valid schema rate
- valid semantic rate
- repair success rate
- generation latency

Create:

docs/AI_EVAL_RESULTS.md

==================================================
PHASE 3 — INTERACTIVE ENGINE
==================================================

Create:

packages/scene-engine

Use PixiJS.

The engine must:

- accept validated Scene DSL
- render objects
- manage interaction state
- execute animations
- evaluate completion
- emit events

Architecture should separate:

Renderer
InteractionController
AnimationController
SceneState
CompletionEvaluator
EventBus

Do not create spaghetti state logic.

==================================================
ENGINE EVENTS
==================================================

Define typed events such as:

scene:loaded
object:tapped
object:selected
object:drag-start
object:drag-end
interaction:success
interaction:retry
scene:completed

These will later support analytics.

==================================================
PHASE 3 INITIAL SUPPORT
==================================================

Implement only:

SCENES
- count
- compose
- split

INTERACTIONS
- tap-count
- drag-drop
- drag-to-group

ANIMATIONS
- appear
- move
- bounce
- highlight

OBJECTS
- apple
- car
- ball
- number
- text
- container

==================================================
PHASE 3 TEST APP
==================================================

Create a development playground.

Possible location:

apps/player

or:
apps/web/engine-playground

It must allow:

- load example Scene JSON
- render it
- interact
- reset
- inspect current state
- see emitted events

Use:

examples/scene-example.json

Acceptance:

Opening the page must render and play the generated scene end-to-end.

==================================================
PHASE 4 — ASSET SYSTEM
==================================================

Create a simple asset abstraction.

Do not overbuild DAM/media management yet.

We need:

AssetDefinition
- id
- type
- source
- dimensions?
- tags?
- style?

Create a starter SVG asset pack:

- apple
- car
- ball
- star
- basic shapes
- basket
- box/container

Use a consistent visual style.

Avoid copyrighted or copied assets.

Store locally.

==================================================
PHASE 5 — NESTJS API
==================================================

Create:

apps/api

Initial modules:

- health
- ai
- lessons
- scenes

First important endpoint:

POST /lessons/generate

Input example:

{
  "grade": 1,
  "subject": "mathematics",
  "prompt": "10 sonining tarkibini olma yordamida tushuntir"
}

Output:

validated Lesson/Scene DSL

Response must include metadata:

- provider
- model
- latency
- repairCount
- validation result

Do not expose internal chain-of-thought.

==================================================
PHASE 6 — DATABASE FOUNDATION
==================================================

Only after AI + engine work end-to-end.

Create migrations and entities for:

User
Book
Chapter
Lesson
Scene
BookVersion
Asset
Generation

Keep schema minimal.

Do NOT implement:
- subscriptions
- marketplace
- schools
- students
- analytics dashboards

yet.

==================================================
PHASE 7 — CREATOR MVP
==================================================

Create the first real creator experience in apps/web.

Desktop-first.

Main screens:

1. Dashboard
2. Books
3. Create Book
4. Book Editor
5. AI Generate Lesson
6. Preview

Editor layout:

LEFT
- chapters
- lessons
- scenes

CENTER
- interactive canvas

RIGHT
- properties

Properties sections:

- object
- position
- interaction
- animation
- feedback

TOP:
- save
- preview
- publish disabled/placeholder initially

AI panel:

"AI bilan yaratish"

User prompt
↓
Generate
↓
Scene DSL
↓
Preview
↓
Accept / Regenerate

==================================================
IMPORTANT CREATOR RULE
==================================================

The editor modifies Scene DSL.

The PixiJS engine renders Scene DSL.

AI generates Scene DSL.

There must be ONE source of truth.

Do not create separate incompatible representations.

==================================================
PHASE 8 — FIRST REAL BOOK
==================================================

Only after creator + engine are usable.

Create the first internal pilot:

1-sinf Matematika

Do not copy copyrighted textbook content directly unless we own permission.

Create original educational content aligned with first-grade mathematics.

First target:

10–20 lessons.

Topics:

- object properties
- counting 1–5
- counting 1–10
- compare numbers
- compose 5
- compose 10
- addition
- subtraction
- sequence
- basic shapes

Create every lesson using OUR OWN Creator platform.

This is important.

Do not manually bypass the platform.

Any missing capability discovered while building the book should become a platform improvement.

==================================================
PHASE 9 — QUALITY SYSTEM
==================================================

Before expanding features:

Add:

- error boundaries
- loading states
- retries
- logging
- API error format
- generation audit log
- validation reports
- versioning basics

Add accessibility:

- keyboard support where practical
- touch-friendly targets
- reduced motion
- readable text
- no color-only feedback

==================================================
PHASE 10 — CLOUD FALLBACK
==================================================

Only after local flow works.

Add:

GeminiProvider

Routing:

Local Qwen
↓
validation
↓
repair x2
↓
if still invalid or complex vision task
↓
Gemini

Provider routing must be configurable.

Example:

AI_PROVIDER=local
AI_FALLBACK_PROVIDER=gemini

No hard-coded credentials.

==================================================
DO NOT BUILD YET
==================================================

Explicitly postpone:

- TTS
- AI video generation
- marketplace
- subscriptions
- payments
- school admin system
- student accounts
- advanced analytics
- collaboration
- real-time multi-user editing
- mobile apps
- EPUB export
- public marketplace
- complex permissions

These are NOT MVP dependencies.

==================================================
CODE QUALITY RULES
==================================================

Follow these rules:

- strict TypeScript
- no `any` unless unavoidable and justified
- small modules
- clear boundaries
- no duplicated business logic
- no giant files
- no magic strings for interaction types
- typed domain constants/enums/unions
- meaningful errors
- tests around critical logic
- comments explain WHY, not obvious WHAT
- environment variables documented
- no secrets committed
- commit-ready code after each phase

==================================================
DOCUMENTATION
==================================================

Maintain:

docs/
├── MASTER_PLAN.md
├── ARCHITECTURE.md
├── SCENE_DSL.md
├── AI_PIPELINE.md
├── AI_EVAL_RESULTS.md
├── ENGINE.md
├── DEVELOPMENT.md
└── DECISIONS.md

For significant architecture choices add ADR-style notes in DECISIONS.md.

Examples:

- Why PixiJS
- Why Scene DSL
- Why JSON Schema
- Why local-first AI
- Why Ollama abstraction
- Why AI does not generate HTML

==================================================
GIT WORKFLOW
==================================================

If Git repo does not exist:

initialize it.

Use clear commits per phase.

Examples:

feat(scene-schema): add Scene DSL v0.2
feat(ai-core): add Ollama structured generation
feat(scene-engine): add counting scene renderer

Do NOT squash everything into one giant commit.

Do not push to remote unless explicitly configured and safe.

==================================================
EXECUTION STYLE
==================================================

IMPORTANT:

Do not attempt to implement the entire platform in one uncontrolled run.

For EACH PHASE:

1. Read relevant current code.
2. State the implementation goal.
3. Implement.
4. Run lint.
5. Run typecheck.
6. Run tests.
7. Fix failures.
8. Update documentation.
9. Commit.
10. Summarize:
   - what changed
   - tests
   - known limitations
   - next phase

Then continue to the next phase if there is no blocker.

If a phase exposes a serious architecture problem:
STOP,
fix the architecture,
document the decision,
then continue.

==================================================
FIRST MAJOR MILESTONE
==================================================

The first milestone is NOT a beautiful dashboard.

The first milestone is:

USER PROMPT

"1-sinf o'quvchisiga 10 sonining tarkibini olma yordamida tushuntir"

↓

LOCAL QWEN

↓

VALID SCENE DSL

↓

PIXIJS ENGINE

↓

A REAL WORKING INTERACTIVE LESSON IN THE BROWSER

The child must be able to interact with it.

This flow must work end-to-end.

Only after this works should we invest heavily in the Creator UI.

==================================================
SECOND MAJOR MILESTONE
==================================================

Creator UI:

Prompt
↓
Generate lesson
↓
Interactive preview
↓
Edit properties
↓
Save
↓
Reopen
↓
Still works

==================================================
FINAL PRODUCT PRINCIPLE
==================================================

Remember:

We are NOT building software that makes animated PDFs.

We are building a new authoring system where:

AI decides WHAT educational experience should be created.

Scene DSL defines WHAT that experience contains.

Interactive Engine defines HOW it behaves.

Creator allows humans to EDIT it.

Player allows children to EXPERIENCE it.

The architecture must preserve this separation.

==================================================
BEGIN
==================================================

Start with PHASE 0.

Audit the current environment and existing interactive-book-ai files.

Then create:

docs/MASTER_PLAN.md

Before making large structural changes, show me:

1. Proposed monorepo structure
2. Phase breakdown
3. Main architecture decisions
4. First milestone definition
5. Any serious risk you identified

Then proceed phase-by-phase according to the plan.

==================================================
CRITICAL — UI/UX & VISUAL DESIGN DIRECTION
==================================================

The visual quality of this platform is EXTREMELY IMPORTANT.

Treat UI/UX design as a first-class engineering requirement, not as decoration to be added after functionality is complete.

The final product must feel like it was designed and implemented by:

- a senior product designer
- a senior frontend engineer
- a professional SaaS product team

Do NOT produce a generic AI-generated dashboard.

Do NOT use a typical Tailwind/shadcn dashboard template and simply change the colors.

The interface must have its own strong, recognizable visual identity.

==================================================
DESIGN VISION
==================================================

The visual direction should be inspired by the depth, material behavior, translucency and spatial hierarchy of modern Apple / iOS / macOS interfaces.

However:

DO NOT copy Apple interfaces directly.

Use the underlying design principles:

- deep translucent surfaces
- layered glass materials
- realistic background blur
- subtle refraction-like visual depth
- soft light interaction
- strong foreground/background separation
- elegant hierarchy
- carefully controlled transparency
- premium typography
- restrained motion
- precise spacing
- excellent alignment
- tactile interactive states

The desired feeling is:

PREMIUM
+
FUTURISTIC
+
CALM
+
INTELLIGENT
+
EDUCATIONAL
+
PROFESSIONAL

It should NOT feel childish.

Children may consume the books, but the Creator Platform itself is a professional tool for:

- teachers
- authors
- publishers
- educational teams
- content creators

Think of it as a professional creative tool rather than a children's application.

==================================================
DEEP GLASS MATERIAL SYSTEM
==================================================

Create a reusable glass material system.

Do NOT use one generic:

background: rgba(...)
backdrop-filter: blur(...)

for everything.

Define several material depths.

For example conceptually:

Glass Surface 0
- application background

Glass Surface 1
- navigation/sidebar

Glass Surface 2
- normal cards

Glass Surface 3
- floating controls

Glass Surface 4
- modal / AI assistant / important overlays

Each depth should differ subtly in:

- opacity
- blur
- saturation
- border luminance
- shadow
- inner highlight
- background interaction

The result should create a real perception of layers.

Use techniques such as, where appropriate:

- backdrop-filter
- translucent fills
- subtle 1px light borders
- inner highlights
- extremely soft shadows
- background blur
- controlled saturation
- subtle radial lighting
- restrained gradients
- pseudo-elements for material highlights

But keep performance in mind.

Do not stack expensive blur effects unnecessarily.

==================================================
BACKGROUND
==================================================

The background must play an important role in making the glass material visible.

Do NOT use a plain white background behind glass cards.

Create a sophisticated atmospheric background system.

It can use:

- very soft blue
- sky blue
- cool cyan
- subtle warm light
- extremely restrained lavender only where appropriate

Avoid strong purple dominance.

Avoid neon.

Avoid dark black-heavy interfaces.

The background should have subtle depth and lighting so translucent surfaces visibly interact with what is behind them.

The result should still remain calm enough for long professional work sessions.

==================================================
COLOR SYSTEM
==================================================

Create semantic design tokens.

Do NOT scatter arbitrary hex values throughout components.

Define tokens for:

- canvas/background
- primary
- secondary
- accent
- text-primary
- text-secondary
- text-tertiary
- glass-fill
- glass-border
- glass-highlight
- success
- warning
- danger
- focus
- shadow

Prefer:

- sophisticated blue
- sky/cyan tones
- clean neutral surfaces
- restrained warm accents

Avoid:

- black-heavy design
- oversaturated colors
- random purple gradients
- excessive green
- excessive rainbow coloring

Color should communicate hierarchy and state, not decorate everything.

==================================================
TYPOGRAPHY
==================================================

Typography must feel exceptionally polished.

Create a clear type scale for:

- page title
- section title
- card title
- body
- metadata
- labels
- captions

Pay close attention to:

- font weight
- line height
- letter spacing
- maximum text width
- hierarchy

Do not make everything bold.

Do not make everything huge.

The interface should feel mature.

==================================================
SPACING & GEOMETRY
==================================================

Use a consistent spacing system.

Every:

- gap
- padding
- margin
- card radius
- control height

should follow a coherent design scale.

Do not eyeball each component independently.

Use generous whitespace.

Prefer fewer, better-designed elements over many small cards.

Avoid the common AI-generated-dashboard problem where the page contains dozens of unrelated widgets.

==================================================
DASHBOARD
==================================================

The Dashboard should immediately answer:

1. What am I working on?
2. What did I recently create?
3. How do I create something new?
4. How can AI help me?
5. What requires my attention?

Do not fill it with meaningless statistics just to make it look like a SaaS dashboard.

Useful areas may include:

- recent books
- drafts
- recent lessons
- continue editing
- AI generation shortcut
- recent activity
- creation shortcuts

Statistics should only exist when they provide actual product value.

==================================================
BOOK CREATOR — MOST IMPORTANT UI
==================================================

The Book Creator / Interactive Editor is the visual centerpiece of this product.

Spend substantially more design attention here than on the Dashboard.

Recommended conceptual layout:

LEFT SIDEBAR
- book structure
- chapters
- lessons
- scenes

CENTER
- large interactive canvas
- live PixiJS scene
- selection states
- editing handles where appropriate

RIGHT INSPECTOR
- properties
- layout
- interaction
- animation
- feedback

TOP TOOLBAR
- project name
- save state
- undo/redo
- device preview
- preview
- AI controls

AI ASSISTANT
- should feel integrated into the creative workflow
- not like a separate chatbot pasted into the application

The editor should visually feel closer to a professional creative tool.

The canvas must remain the visual focus.

Sidebars should support the canvas rather than compete with it.

==================================================
GLASS IN THE EDITOR
==================================================

Use deep glass carefully.

For example:

Background
    ↓
Editor workspace
    ↓
Glass sidebar
    ↓
Canvas
    ↓
Floating glass toolbar
    ↓
Contextual controls

This should create visible spatial hierarchy.

Do not make every single element transparent.

Some surfaces should intentionally be more opaque to maintain readability.

Glass must serve hierarchy.

It must NOT be visual noise.

==================================================
INTERACTION QUALITY
==================================================

Every important control needs polished states:

- default
- hover
- pressed
- focused
- selected
- disabled
- loading
- success
- error

Avoid abrupt changes.

Use subtle transitions.

Buttons should feel tactile.

Cards may react very slightly to pointer movement only if it genuinely improves the experience.

Do not over-animate.

==================================================
MOTION SYSTEM
==================================================

Create a small reusable UI motion system.

Examples:

FAST
100–160ms

NORMAL
180–240ms

ENTER
250–350ms

Use appropriate easing.

Motion should communicate:

- hierarchy
- continuity
- cause and effect

Examples:

Opening inspector
→ smooth slide/fade

Selecting scene
→ subtle transition

Generating with AI
→ meaningful generation state

New scene generated
→ controlled reveal

Saving
→ quiet status feedback

Avoid:

- excessive bouncing
- constant floating
- decorative motion everywhere
- large dramatic transitions

The application must remain productive.

==================================================
AI GENERATION EXPERIENCE
==================================================

This interaction deserves special design attention.

Do NOT implement:

[Text box]
[Generate button]
[Spinner]
[Result]

as the entire experience.

Make AI generation feel native to the product.

Conceptually:

User writes:

"1-sinf o'quvchisiga 10 sonining tarkibini olma yordamida tushuntir"

Then visually communicate stages such as:

Understanding lesson
        ↓
Planning interactions
        ↓
Creating scenes
        ↓
Validating lesson
        ↓
Rendering preview

Do not expose chain-of-thought.

Only expose useful product-level progress states.

When generation completes, transition naturally into the interactive preview.

==================================================
RESPONSIVE STRATEGY
==================================================

Creator is DESKTOP-FIRST.

Optimize primarily for:

- 14-inch MacBook
- 16-inch MacBook
- common desktop monitors

It must still adapt gracefully to smaller laptop screens.

Do not compromise the professional desktop editor just to force it into a mobile layout.

The Book Player can later have a separate mobile-first experience.

==================================================
LIGHT / DARK ARCHITECTURE
==================================================

Even if the initial release ships primarily with one appearance:

design the token system so Light and Dark modes can exist cleanly later.

Do not hard-code assumptions that make dark mode expensive to implement.

However, do NOT delay the MVP merely to create multiple themes.

==================================================
DESIGN SYSTEM
==================================================

Before building many screens, create a small internal design system.

At minimum define:

- color tokens
- typography scale
- spacing scale
- radii
- glass materials
- shadows
- motion tokens
- icon sizing
- control heights
- focus states

Create reusable primitives where appropriate:

GlassPanel
GlassCard
GlassToolbar
Button
IconButton
Input
Select
Tabs
Tooltip
Dialog
InspectorSection
EmptyState
GenerationState

Do not create abstraction merely for abstraction's sake.

==================================================
ICONS
==================================================

Use one consistent professional icon family.

Do not mix unrelated icon styles.

Icons should be:

- simple
- geometric
- readable
- consistent in stroke weight

Avoid emoji as production UI icons.

==================================================
ACCESSIBILITY
==================================================

Premium design must not sacrifice usability.

Ensure:

- sufficient text contrast
- visible focus states
- keyboard navigation
- semantic controls
- large enough hit targets
- reduced-motion support
- glass surfaces remain readable on different backgrounds

If translucency hurts readability, readability wins.

==================================================
PERFORMANCE
==================================================

Deep glass can become expensive.

Profile performance.

Avoid dozens of independently blurred layers.

Prefer strategic parent-level backdrop effects.

Keep scrolling and editor interactions smooth on the target M4 Pro MacBook.

The interface should ideally feel 60fps during normal usage.

==================================================
QUALITY BAR
==================================================

Before considering any major screen complete, inspect it critically.

Ask:

- Does this look like a generic generated dashboard?
- Is there unnecessary visual noise?
- Are there too many cards?
- Is the hierarchy immediately understandable?
- Is the glass effect meaningful?
- Is text readable?
- Are spacing and alignment precise?
- Does this feel like a professional creative application?
- Would a senior designer accept this?
- Would a senior frontend engineer be comfortable maintaining this implementation?

If not, improve it before moving on.

DO NOT accept "good enough" visual implementation.

==================================================
VERY IMPORTANT
==================================================

Functionality and visual quality are BOTH product requirements.

Do not build ugly placeholder UI with the intention of "designing it later" for major product surfaces.

For infrastructure phases, simple developer interfaces are acceptable.

But once Creator UI development begins:

DESIGN → IMPLEMENT → REVIEW → REFINE

must be part of the same phase.

The final Creator should communicate the product idea even before someone starts using it.

When a person opens it for the first time, the desired reaction is:

"This is a serious new-generation creative platform."

Not:

"This is another admin dashboard."

==================================================
LANGUAGE
==================================================

The primary product interface should be designed with Uzbek localization in mind.

Do not use awkward machine-translated Uzbek UI labels.

Keep UI copy:

- short
- natural
- professional
- understandable

Structure localization so additional languages can be added later.

==================================================
COMMUNICATION WITH ME
==================================================

If you need to ask me any question, clarification, approval, design preference, product decision, or technical decision:

ASK ME IN UZBEK.

All questions directed to me must be in Uzbek.

Technical documentation and code identifiers may remain in English where appropriate.

Do not block progress with unnecessary questions.

Ask only when my decision would materially affect:

- product behavior
- architecture
- design direction
- destructive operations
- significant scope
- significant cost

Otherwise make the professional engineering decision yourself, document it, and continue.
