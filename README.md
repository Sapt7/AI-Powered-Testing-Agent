# Test Case Generator

An AI-powered QA workspace that converts a Product Requirements Document (PRD) into structured test coverage using Gemini, while retaining prior runs and reusable knowledge-base context in a local database.

## What Has Been Built

This project currently includes:

- A React + Vite frontend for:
  - uploading a PRD
  - managing retained knowledge-base documents
  - generating QA test cases
  - viewing previous test-generation runs
  - reviewing generated test cases in a list-and-detail format
- A **stateless** TypeScript + Express backend for:
  - parsing uploaded files
  - calling the Gemini API
  - validating structured AI output
  - verifying Google identity on every request
- Google sign-in, with browser-side retention of the knowledge base and run history so
  context still accumulates without a server database
- A documented design system (`DESIGN.md`), product record (`PRODUCT.md`), and numbered
  decision records (`docs/decisions/`)

## Core User Flow

The product is organized into three workspace sections, reachable from the index rail:

### 1. New analysis

This is the primary landing flow.

Users can:

- attach a PRD
- rely on the retained knowledge base already stored in the system
- generate a fresh QA suite from the attached PRD plus saved context

Generation stays disabled until a PRD is attached.

### 2. Previous runs

This section shows all previously generated PRD runs stored in the backend database.

Users can:

- browse earlier runs
- reopen a generated suite
- inspect the PRD name, timestamp, case count, and high-priority count

### 3. Knowledge base

This section stores reusable supporting documents that should influence future testcase generation.

Users can:

- upload knowledge-base documents
- see all previously retained knowledge-base documents
- remove knowledge-base documents from the stored set

## Generated Results Experience

When generation succeeds, the app opens a dedicated results sheet that shows:

- the feature name and a short summary of the PRD
- a title block carrying document, generation date, case count, and high-priority count
- three evidence columns: risk scan, source context, and assumptions
- a numbered coverage list paired with a detail pane for the selected case

Each generated test case includes:

- title
- criticality: `Low`, `Medium`, or `High`
- rationale
- coverage area (one of twelve fixed values, listed below)
- ordered test steps

Priority is encoded by **fill density** rather than colour — solid, half, and hollow marks — so the scale stays readable in greyscale and to colour-blind reviewers.

## Backend Architecture

The backend lives inside the same repository and runs as an Express server.

### Main responsibilities

- receive PRD uploads
- parse supported document formats
- assemble prompt context for Gemini
- validate the AI response against a strict schema
- retry once if the first AI response fails validation or quality checks
- persist successful runs and knowledge-base documents

### Main backend files

- [server/index.ts](server/index.ts)
  Starts the API server.
- [server/app.ts](server/app.ts)
  Registers API routes.
- [server/config.ts](server/config.ts)
  Model, port, upload, and document-size limits.
- [server/middleware/requireAuth.ts](server/middleware/requireAuth.ts)
  Verifies the Google ID token on every protected request.
- [server/routes/parseDocuments.ts](server/routes/parseDocuments.ts)
  Extracts text from uploaded documents and returns it, storing nothing.
- [server/routes/generateTestCases.ts](server/routes/generateTestCases.ts)
  Handles PRD upload, knowledge-base context, and test-case generation.
- [server/services/documentParser.ts](server/services/documentParser.ts)
  Extracts text from supported file types and flags truncation.
- [server/services/geminiTestCaseService.ts](server/services/geminiTestCaseService.ts)
  Holds the system prompt, builds the user message, validates responses, and retries once.

## Frontend Architecture

The frontend is a React application built with Vite and shadcn/ui primitives.

### Main frontend files

- [src/pages/Index.tsx](src/pages/Index.tsx)
  Main workspace page and view-state controller.
- [src/components/AppSidebar.tsx](src/components/AppSidebar.tsx)
  Index-rail navigation for the three workspace sections.
- [src/components/TestCaseExplorer.tsx](src/components/TestCaseExplorer.tsx)
  Results-sheet evidence columns, coverage list, and step detail.
- [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)
  Session restore, sign-in callback, sign-out, and the token-expiry timer.
- [src/components/AuthGate.tsx](src/components/AuthGate.tsx) ·
  [src/components/SignIn.tsx](src/components/SignIn.tsx)
  Sign-in gate and surface. The gate is UX only; the API is the security boundary.
- [src/lib/auth.ts](src/lib/auth.ts)
  Google Identity Services loader, token storage, and claim decoding.
- [src/lib/knowledgeBaseStore.ts](src/lib/knowledgeBaseStore.ts)
  IndexedDB store for knowledge-base documents, namespaced by Google account.
- [src/lib/runHistoryStore.ts](src/lib/runHistoryStore.ts)
  localStorage run history, capped and quota-tolerant, namespaced by Google account.
- [src/lib/api.ts](src/lib/api.ts)
  API client. Attaches the bearer token and handles `401` in one place.
- [src/lib/testCaseTypes.ts](src/lib/testCaseTypes.ts)
  Shared generated-suite structure.
- [src/lib/workspaceTypes.ts](src/lib/workspaceTypes.ts)
  Shared frontend/backend request and storage models.

## AI Generation Behavior

The system uses the Gemini API to generate structured QA test coverage. The prompt is split
into a **system instruction** (the QA architect persona, reasoning procedure, and output
rules) and a **user message** (the PRD and knowledge-base documents). Both live in
[geminiTestCaseService.ts](server/services/geminiTestCaseService.ts).

### What the system prompt instructs

Before writing any JSON, the model works through a reasoning procedure: requirement
inventory, knowledge-base reconciliation, first-principles derivation, blast-radius
analysis, and gap identification. It is then asked to:

- produce **18 to 28 test cases**, sized to the actual surface area of the PRD
- write **4 to 7 steps** per case, with 3 as an absolute floor
- keep no more than 25% of cases on the happy path, and include at least four
  negative or failure-mode cases
- embed the expected result inside the step text, since the schema has no separate
  expected-result field
- use concrete test data rather than placeholders like "valid input"
- assign criticality from an explicit rubric, keeping High at roughly 30% or less
- record every inference, ambiguity, and document conflict in `assumptions`
- ground every case in the PRD, the knowledge base, or a stated inference

### Coverage areas

`coverageArea` is a fixed enum, enforced in the Gemini response schema and re-checked by Zod:

`Core Functional Flow` · `Input Validation & Error Handling` · `Permissions & Access Control` ·
`API & Data Integrity` · `Integrations & External Dependencies` ·
`State, Concurrency & Edge Cases` · `Cross-Module Impact & Regression` ·
`Notifications & Messaging` · `Analytics & Instrumentation` · `Accessibility` ·
`Performance & Load` · `Security`

### Validation and retry

The response is constrained three ways: a JSON response schema sent to the API (types,
required keys, enums, `minItems`), a Zod parse on the reply, and the prompt itself for the
rules a schema cannot express.

- **Schema failure** → one automatic retry with the specific validation issues fed back.
  If the retry also fails, the user gets a clean error rather than raw schema output.
- **Quality failure** (placeholder phrases, duplicate case titles, mostly-thin cases) →
  one automatic retry. These checks are *advisory*: if the retry does not improve the
  result, the schema-valid suite is still returned rather than failing the run.

Generation runs at `temperature: 0.2`. `gemini-2.5-flash` performs its reasoning with
thinking enabled by default.

## Supported Document Formats

### PRD upload

Supported:

- PDF
- DOCX
- TXT
- MD
- RTF

One PRD per run. Attaching a new PRD replaces the current one.

### Knowledge-base upload

Supported:

- PDF
- DOCX
- TXT
- MD
- CSV
- JSON
- RTF

Up to 10 files per upload action.

## Document Size Limits

Configured in [server/config.ts](server/config.ts):

| Limit | Value |
|---|---|
| Max upload size | 15 MB per file |
| Max extracted text per document | 200,000 characters |
| Max combined knowledge-base text per generation | 600,000 characters |

The PRD is **never** truncated to make room for knowledge-base context — only the knowledge
base is trimmed. Any truncation that does occur is reported to the model in the user
message so it can declare the gap in `assumptions` and flag which areas may be
under-covered.

## Persistence Model

**The backend is stateless — it stores nothing.** Any instance can serve any request, and
restarts and redeploys are harmless.

Data lives in the browser, namespaced by the signed-in Google account:

| Data | Where | Why |
|---|---|---|
| Knowledge-base documents and extracted text | IndexedDB | Extracted text is far too large for localStorage |
| Run history (capped at 50) | localStorage | Small records; simple synchronous access |

Every record carries the Google `sub` claim and every read filters on it, so two people
signing in on the same machine never see each other's data.

**Consequences:** data does not sync across devices or browsers, and clearing site data
erases it. Both are stated in the UI. See
[ADR-0001](docs/decisions/0001-browser-scoped-persistence.md) for the reasoning and the
restore path back to server-side persistence.

## Product, Design, and Decision Records

- [PRODUCT.md](PRODUCT.md) — durable product truth: primary user, purpose, positioning,
  binding constraints, and explicitly open decisions.
- [docs/original-product.md](docs/original-product.md) — the product as originally ideated,
  including the full intended data model and API contract.
- [docs/v1-scope.md](docs/v1-scope.md) — what version 1 ships, what it cuts, and the
  restore path for every cut.
- [docs/decisions/](docs/decisions/) — numbered decision records: what was chosen, what was
  rejected, the trade-off accepted, and when to revisit.
- [DESIGN.md](DESIGN.md) — the visual system: tokens, type ramp, named rules, and
  component specifications.
- [CHANGELOG.md](CHANGELOG.md) — dated record of changes.
- `.impeccable/design.json` — machine-readable design sidecar.

> **Version 1 is code-complete.** Documentation, Google authentication, browser-scoped
> storage, spend controls, and deployment configuration are all in place. See
> [docs/deployment.md](docs/deployment.md) to put it online.

## Local Development

### Environment variables

Create a `.env` file from [.env.example](.env.example).

Expected variables:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
PORT=8787

# Google sign-in. Both hold the same public OAuth client ID.
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

Sign-in is required. `http://localhost:8080` must be listed under **Authorized JavaScript
origins** on the OAuth client, or the Google button will not render.

### Install dependencies

```bash
npm install
```

### Run the app locally

```bash
npm run dev
```

This starts:

- frontend: `http://localhost:8080`
- backend: `http://localhost:8787`

The frontend proxies `/api` to the backend, so only the frontend URL is needed in a browser.

### Production-style build

```bash
npm run build
```

### Start built backend

```bash
npm start
```

## API Endpoints

All routes except `/api/health` require `Authorization: Bearer <google-id-token>` and
return `401` without one.

### `GET /api/health`

Returns backend health status. **Deliberately unauthenticated** — it is the warm-up target
the client pings on landing, before any token exists. Exposes only liveness.

### `POST /api/parse`

Accepts one or more files in the `documents` field. Extracts text and returns it. **The
server keeps no copy**; the caller stores what comes back.

Returns `{ documents: [{ fileName, text, excerpt, truncated }] }`.

### `POST /api/generate-test-cases`

Accepts:

- `prd` — multipart file upload, exactly one
- `knowledgeBase` — optional JSON string field, `[{ fileName, text }]`

Behavior:

- parses the PRD server-side
- re-validates and re-caps the supplied knowledge-base context
- generates a Gemini-backed test suite

Returns `{ suite, meta }`, where `meta` carries `prdName`, `prdExcerpt`, `prdTruncated`,
`generatedAt`, `modelName`, and `promptVersion`. The caller stores the run.

## Testing and Validation

### Automated checks

```bash
npm test          # vitest
npm run lint      # eslint
npm run build     # client + server build
```

### Current status

- Tests: passing.
- Lint: passes with 0 errors and 8 warnings, all `react-refresh/only-export-components`
  from the shadcn/ui scaffold and the auth context. They do not block the app.
- Build: clean for both the client bundle and the server TypeScript output.

## Current Limitations

- Data lives in one browser, for one Google account. It does not sync across devices, and
  clearing site data erases it. See
  [ADR-0001](docs/decisions/0001-browser-scoped-persistence.md).
- Run history is capped at 50 runs; older runs are dropped.
- Legacy `.doc` binaries are not supported. Use `.docx` or PDF.
- In-browser preview of an attached PRD only works for text-like formats; PDF and DOCX
  are parsed server-side and show no client-side excerpt.
- Rate-limit counters live in process memory and reset when the service restarts or spins
  down. They are a speed bump; the billing budget alert is the real backstop. See
  [docs/deployment.md](docs/deployment.md).
- Opening a run from **Previous runs** highlights **New analysis** in the rail; results are
  treated as a child of the analysis flow.
- There is no multi-tenancy. Google sign-in provides identity, not organisations or roles.

## Suggested Next Enhancements

- export generated test cases to CSV, XLSX, or test-management tools
- allow users to tag, group, or archive previous runs
- add authentication and multi-user storage
- support richer document ingestion and OCR for image-based PDFs
- add prompt/version audit history for generated runs
- enable editing and saving curated test cases after generation

## Project Status

As of the latest build, the system supports:

- PRD-driven testcase generation via Gemini, targeting 18–28 cases across twelve
  coverage areas
- retained knowledge-base documents
- persistent previous-run history
- structured testcase review in the UI
- a documented design system and product record
- local end-to-end usage through one dev command
