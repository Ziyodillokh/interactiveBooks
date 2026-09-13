# interactive-book-platform

AI-powered interactive book platform: teachers and authors create interactive educational
books without coding. AI generates a strict **Scene DSL** (JSON), the **PixiJS engine** plays it,
the **Creator** edits it, the **Player** lets children experience it.

Start here:

- [`docs/MASTER_PLAN.md`](docs/MASTER_PLAN.md) — vision, architecture, phases, milestones, risks
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — architecture decision records
- [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md) — the original brief (verbatim)

Environment: Node 24 (`nvm use`), pnpm 11 via corepack, Ollama with `qwen3.5:9b` running locally.
The verified local AI environment and its test scripts live in `~/Developer/interactive-book-ai`.
