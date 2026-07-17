# TracePilot QA

**An autonomous browser QA testing agent.** Point it at a URL, give it a goal (and login
credentials if a flow needs them), and it explores your product like a real user — detecting
broken flows, capturing screenshots and console/network errors, and generating Playwright tests.

> **Status: foundation phase.** This build ships the project architecture, design system, theme
> system, and placeholder routes. The browser agent and AI planning layers are **not** implemented
> yet — the run form and run views are wired to sample data.

## Tech stack

- **Next.js** (App Router) + **TypeScript** (strict)
- **Tailwind CSS** — custom warm-ivory / graphite / ruby design system, class-based dark mode
- **PostgreSQL** + **Prisma**
- **Three.js** — the hero route-graph visual (an agent traversing site nodes)
- **GSAP** + **ScrollTrigger** — restrained scroll/load motion
- **Playwright** — target for generated tests (added in a later phase)
- OpenAI-compatible AI provider abstraction (later phase)

## Requirements

- Node.js **18.18+** (or 20+)
- A PostgreSQL database

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#   then edit .env with your DATABASE_URL, AI_* values, and APP_URL

# 3. Generate the Prisma client
npm run prisma:generate

# 4. Create the database schema (needs a running Postgres + DATABASE_URL)
npm run prisma:migrate

# 5. Install the Chromium browser Playwright drives
npm run playwright:install

# 6. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Running the agent

The QA runner (`src/lib/runner/`) launches a real Chromium via Playwright, explores a
project's site (safe internal links only, same hostname, bounded steps/runtime), and saves
`BrowserStep` and `Finding` rows plus per-step screenshots to `/public/screenshots`.

Create a project and queue a run from the dashboard, open the run, and click **Run agent**
(`POST /api/runs/[id]/execute`). Exploration is entirely rule-based in this phase — there is no AI.

> **Deployment:** browser execution must run on a long-lived Node.js server or background
> worker, not an edge runtime or short-timeout serverless function. For production, dispatch
> `executeRun` to a queue/worker rather than calling it inline from the request handler.
>
> **Credentials:** login details are used only in-memory for a single execution — never
> logged, never persisted, never sent to any third party.

## Environment variables

| Variable       | Description                                                        |
| -------------- | ------------------------------------------------------------------ |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma.                       |
| `AI_PROVIDER`  | OpenAI-compatible provider name (e.g. `openai`).                   |
| `AI_API_KEY`   | API key for the AI provider.                                       |
| `AI_BASE_URL`  | Base URL of the OpenAI-compatible endpoint.                        |
| `APP_URL`      | Public origin of the app (used for metadata and absolute URLs).    |

See [`.env.example`](./.env.example) for a template.

## Scripts

| Script                    | Purpose                                  |
| ------------------------- | ---------------------------------------- |
| `npm run dev`             | Start the development server.            |
| `npm run build`           | Production build.                        |
| `npm run start`           | Serve the production build.              |
| `npm run lint`            | ESLint (Next.js config).                 |
| `npm run typecheck`       | TypeScript, no emit.                     |
| `npm run prisma:generate` | Generate the Prisma client.              |
| `npm run playwright:install` | Download the Chromium browser binary. |
| `npm run prisma:migrate`  | Run a development migration.             |
| `npm run prisma:studio`   | Open Prisma Studio.                      |

## Project structure

```
prisma/
  schema.prisma            # Project / QaRun / Finding / BrowserStep / GeneratedTest
src/
  app/
    layout.tsx             # Root layout, theme, fonts, header/footer
    globals.css            # Design tokens (light/dark) + base styles
    page.tsx               # Landing page + Three.js hero
    dashboard/             # Configure & launch a run
    runs/                  # Run history list
    runs/[id]/             # Single run detail
    settings/              # Provider / infra / appearance
  components/
    animations/            # GSAP Reveal wrapper
    hero/                  # Three.js agent route-graph scene
    layout/                # Header, footer, logo
    theme/                 # Theme provider + toggle (no-flash)
    ui/                    # Button, Card, Input, Textarea, Badge,
                           #   Dialog, EmptyState, Section, Slot
  lib/                     # prisma client, env, utils, formatting, sample data
```

## Design system

A premium developer-tool palette — no blue / green / yellow anywhere.

- **Light:** warm ivory background, graphite text, ash surfaces, muted ruby accent.
- **Dark:** deep warm charcoal, smoke-gray surfaces, ivory text, wine/ruby accent.
- **Type:** Space Grotesk (display), Inter (body), JetBrains Mono (labels, run IDs, traces).
- **Statuses** stay inside the palette — neutral "ink" for passed, ruby for failed, rust for
  warnings — differentiated by weight and a status dot rather than hue.

Tokens live as CSS custom properties in `src/app/globals.css` and are exposed to Tailwind in
`tailwind.config.ts`, so every color supports opacity modifiers and both themes from one source.

## Roadmap (not in this phase)

- Browser agent execution (Playwright driver + exploration loop)
- AI planning via the OpenAI-compatible provider abstraction
- Persisting runs, steps, artifacts, and issues to Postgres
- Generating and exporting Playwright tests
