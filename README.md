# TracePilot QA

TracePilot QA is a browser QA agent that explores a focused user journey, records a durable trace, turns failures into an evidence-backed report, and exports readable Playwright regression tests.

The core runner is deterministic and remains usable without AI. Optional analysis and test enrichment are available through one provider-agnostic gateway supporting OpenAI, Groq, Anthropic, and Gemini. Authenticated users can connect their own encrypted provider key (BYOK), while the public [demo report](http://localhost:3000/demo/report) works without an account or external service.

> TracePilot QA is a QA automation portfolio project, not a vulnerability scanner or pentesting tool. The runner is intentionally same-domain, time-bounded, step-bounded, and protected from destructive actions.

## Product tour

- `/` — product landing page and lightweight Three.js route-graph visual
- `/demo/report` — public, dependency-free recruiter demo report
- `/case-study` — architecture, engineering decisions, and deployment tradeoffs
- `/dashboard` — create projects and launch user-owned QA runs
- `/runs/[id]` — live progress, evidence, findings, AI analysis, and test export
- `/settings` — platform provider status and runner/test-generation policy
- `/settings/providers` — encrypted user-level BYOK management

## What a run produces

1. A Playwright Chromium session navigates the target under the configured safety policy.
2. Browser steps, console errors, network failures, and screenshots are stored as run evidence.
3. Deterministic findings are saved before optional AI enrichment.
4. The AI gateway can plan coverage, enrich bug analysis, and generate structured Playwright files.
5. If AI is absent, invalid, or times out, deterministic test generation still completes.
6. Generated `.spec.ts` files can be previewed, copied, downloaded individually, or exported as a zip.

## Stack

- Next.js 15 App Router, React 18, strict TypeScript
- PostgreSQL and Prisma
- Playwright with Chromium
- Zod validation at API, settings, AI-response, and URL boundaries
- AES-256-GCM encrypted BYOK credentials
- GSAP/ScrollTrigger for restrained motion; Three.js only on the landing hero
- Tailwind CSS with graphite, ivory, ash, ruby, wine, and soft-red tokens

## Local setup

Requirements: Node.js 18.18 or newer, npm, and PostgreSQL.

```bash
npm install
copy .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run playwright:install
npm run dev
```

Open `http://localhost:3000`. On macOS/Linux, use `cp .env.example .env` instead of `copy`.

### PostgreSQL with Docker

The included compose file runs only the local database:

```bash
docker compose up -d db
```

Then use this local connection in `.env`:

```dotenv
DATABASE_URL=postgresql://tracepilot:tracepilot@localhost:5432/tracepilot?schema=public
```

For an existing database, `npm run prisma:migrate` creates and applies development migrations. In production or CI, use:

```bash
npx prisma migrate deploy
```

The migration history includes a complete initial schema and can bootstrap an empty PostgreSQL database.

### Required application secrets

Set a long, random `AUTH_SECRET`. BYOK operations additionally require `APP_ENCRYPTION_KEY` containing exactly 32 bytes encoded as 64 hex characters or base64.

Examples using Node:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Use the 32-byte hex result for `APP_ENCRYPTION_KEY` and the longer value for `AUTH_SECRET`. Never reuse development secrets in production.

## AI providers

The server gateway supports these provider names:

| Provider  | Environment key     | Model variable    | Optional base URL    |
| --------- | ------------------- | ----------------- | -------------------- |
| OpenAI    | `OPENAI_API_KEY`    | `OPENAI_MODEL`    | `OPENAI_BASE_URL`    |
| Groq      | `GROQ_API_KEY`      | `GROQ_MODEL`      | `GROQ_BASE_URL`      |
| Anthropic | `ANTHROPIC_API_KEY` | `ANTHROPIC_MODEL` | `ANTHROPIC_BASE_URL` |
| Gemini    | `GEMINI_API_KEY`    | `GEMINI_MODEL`    | `GEMINI_BASE_URL`    |

`AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`, and `AI_BASE_URL` can define the active platform configuration directly. Provider status and connection tests are server-only; API keys are never returned to the client.

For authenticated runs, a user's default BYOK provider is attempted first. Platform credentials are available only when `ALLOW_PLATFORM_AI_FALLBACK=true`. With that policy enabled, the platform provider is used when no user key exists and may be retried after a user-provider failure. Leave it `false` if platform usage must never absorb user AI traffic.

All product AI features call `src/lib/ai/generate-structured-object.ts`; provider-specific fetch logic is isolated under `src/lib/ai/providers/`. Calls have bounded timeouts, safe error messages, JSON recovery, and Zod validation.

## BYOK security model

- Keys are encrypted before persistence with authenticated AES-256-GCM.
- The encryption key is supplied only through `APP_ENCRYPTION_KEY`; it is not stored in the database.
- Raw and encrypted keys are excluded from every client response. The UI receives only provider metadata and a display preview.
- Decryption happens only in server code immediately before a provider request.
- Raw keys are never logged, sent to Playwright, included in screenshots, or added to generated tests.
- Saving the same provider replaces its ciphertext. Users can test, replace, set a default, or delete a key.
- Generated auth tests use `TEST_EMAIL`, `TEST_PASSWORD`, and `TEST_BASE_URL`; run credentials are request-scoped and not persisted.
- If encryption is missing or ciphertext authentication fails, BYOK resolution fails closed.

The application does not implement key recovery. Rotating `APP_ENCRYPTION_KEY` requires a deliberate re-encryption process or replacing saved user keys.

## Runner policy

Environment-managed controls include maximum steps, total runtime, navigation timeout, evidence capture, same-domain navigation, and destructive-action protection. Targets on localhost or private IP ranges are blocked unless explicitly enabled while `NODE_ENV=development`.

Chromium sandboxing is enabled by default. Set `PLAYWRIGHT_DISABLE_SANDBOX=true` only inside a hardened container whose runtime cannot start Chromium with its sandbox enabled; do not use that switch as a general deployment default.

Dangerous action detection refuses controls containing destructive or transactional language such as delete, remove, unsubscribe, checkout, purchase, transfer, or withdraw. This is a safety boundary, not a guarantee against every possible side effect; run only against systems and accounts intended for QA.

## Demo data

The public `/demo/report` route renders stable in-memory sample data and requires neither login nor provider access. For an authenticated database-backed example, sign in and use **Create demo run** on the runs page. That route creates a completed, user-owned report with browser steps, findings, screenshot placeholders, AI metadata, and a generated Playwright test.

## Generated tests

Exported tests expect:

```dotenv
TEST_BASE_URL=https://staging.example.com
TEST_EMAIL=qa-user@example.com
TEST_PASSWORD=replace-at-runtime
```

TracePilot never substitutes stored credentials into generated code. Review generated tests before running them against a real environment.

## Deployment

Build and start the web application with:

```bash
npm run build
npm run start
```

### Browser execution requires a Node server or worker

Playwright launches a real Chromium process and a run may take tens of seconds. Execute browser jobs on a long-running Node server or dedicated worker with sufficient memory, CPU, filesystem access, and explicit timeouts. Do not rely on a short-timeout serverless function for browser execution; it can terminate the request mid-run and leave incomplete evidence.

The current portfolio build executes a run inline from the Node route for local simplicity. A production topology should enqueue the run, execute it in an isolated worker, persist progress, and let the report continue polling the database.

Deployment checklist:

- Provision PostgreSQL and run `npx prisma migrate deploy`.
- Install Playwright's Chromium binary and required operating-system libraries.
- Set `AUTH_SECRET`, `APP_ENCRYPTION_KEY`, `APP_URL`, and `DATABASE_URL` as secrets.
- Decide explicitly whether `ALLOW_PLATFORM_AI_FALLBACK` is permitted.
- Use persistent or external artifact storage for screenshots.
- Apply rate limiting to authentication and provider-test endpoints at the edge or gateway.
- Restrict outbound browser and provider network access according to deployment policy.

## Validation commands

```bash
npm run prisma:generate
npm run typecheck
npm run lint
npm run build
```

## Scripts

| Script                       | Purpose                                      |
| ---------------------------- | -------------------------------------------- |
| `npm run dev`                | Start the development server                 |
| `npm run build`              | Create a production build                    |
| `npm run start`              | Serve the production build                   |
| `npm run typecheck`          | Run strict TypeScript without emitting files |
| `npm run lint`               | Run Next.js ESLint rules                     |
| `npm run prisma:generate`    | Generate Prisma Client                       |
| `npm run prisma:migrate`     | Create/apply development migrations          |
| `npm run prisma:studio`      | Inspect the database locally                 |
| `npm run playwright:install` | Install Chromium for the runner              |

## Known limitations

- Browser execution is inline rather than queue-backed.
- Screenshots use the local filesystem; horizontally scaled deployments need shared artifact storage.
- Run login credentials are memory-only and cannot yet be scheduled or reused.
- The safety classifier is intentionally conservative and text-based.
- Generated tests are starting points and should be reviewed before CI adoption.
- This phase supports Playwright only; Cypress and team collaboration are out of scope.
- Application-level rate limiting is left as a documented TODO when no shared limiter is installed.

## Project layout

```text
prisma/                         schema and deployable migration history
src/app/api/                    authenticated project, run, provider, and BYOK routes
src/app/case-study/             public portfolio case study
src/components/runs/            live report and generated-test export UI
src/lib/ai/                     gateway, registry, adapters, prompts, and parsing
src/lib/auth/                   password hashing and signed server sessions
src/lib/runner/                 Playwright exploration and safety policy
src/lib/security/               authenticated encryption and masking
src/lib/test-generation/        AI orchestration and deterministic fallback
```

See the in-product [case study](http://localhost:3000/case-study) for the product and architecture narrative.
