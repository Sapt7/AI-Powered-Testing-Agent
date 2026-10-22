# AI Powered Testing Agent

An AI-powered QA workspace that turns a Product Requirements Document into structured,
review-ready test coverage using Gemini — grounded in a knowledge base of your own
supporting documents that accumulates across runs.

| | |
|---|---|
| **App** | https://ai-testing-agent-black.vercel.app |
| **API** | https://ai-powered-testing-agent-api.onrender.com |
| **Repository** | https://github.com/Sapt7/AI-Powered-Testing-Agent |
| **Status** | Version 1 live and verified in production. Non-commercial. |

---

## Documentation map

This project keeps its knowledge in separate files on purpose. Each owns one kind of truth,
and they are meant to be read in a particular order. **If you are new here, start with
[CONTEXT.md](CONTEXT.md).**

| File | Owns | Read it when |
|---|---|---|
| **[CONTEXT.md](CONTEXT.md)** | The whole picture in one place: state, URLs, architecture, what's done, what's not | You are starting cold and need to get oriented fast |
| **[PRODUCT.md](PRODUCT.md)** | Durable product truth — user, purpose, positioning, binding constraints, open decisions | You are deciding *what* to build |
| **[DESIGN.md](DESIGN.md)** | The visual system ("The Workbench") — tokens, type ramp, named rules, component specs | You are building or changing any UI |
| **[DECISIONS.md](DECISIONS.md)** | Index of every architectural decision, with the trade-off each accepted | You are wondering *why* something is the way it is |
| **[CHANGELOG.md](CHANGELOG.md)** | Dated record of what changed and why | You want the history of a specific change |
| **[README.md](README.md)** | How the thing works today — architecture, API, how to run it | You are operating or extending the code |

### How they relate

```
PRODUCT.md ──── defines the problem and constraints
     │
     ├──> DESIGN.md ──── how it looks and behaves, derived from the product's mode
     │                   (machine-readable companion: .impeccable/design.json)
     │
     ├──> DECISIONS.md ─┬─ docs/decisions/0001..0012  the full records
     │                  └─ each decision cites PRODUCT.md constraints it honours
     │
     └──> docs/v1-scope.md ──── what v1 cuts from the full product, and how to restore it
                │
                └──> docs/original-product.md ──── the complete original intent,
                                                   preserved so v1 can be grown back

README.md ──── describes the current implementation
CHANGELOG.md ── records how it got here
CONTEXT.md ──── snapshot of all of the above, for resuming cold
```

**The rules that keep these from drifting:**

- `PRODUCT.md` describes the *full* product. It is not narrowed to fit v1 — `docs/v1-scope.md`
  records the cuts instead, so the original intent survives.
- `DESIGN.md` is written **from the built interface**, not from intention. If code and
  `DESIGN.md` disagree, the code is the bug or the doc is stale — check `CHANGELOG.md` for
  which came last.
- Decision records are **immutable once accepted**. A changed decision gets a new record
  that supersedes or amends the old one, and the old one is annotated rather than edited.
- `CHANGELOG.md` entries cite the decision record that authorised the change.

### Supporting documents

| File | Contents |
|---|---|
| [docs/deployment.md](docs/deployment.md) | Deployment runbook, live environment, spend controls, operational gotchas |
| [docs/v1-scope.md](docs/v1-scope.md) | What v1 ships, every cut, and a restore path per cut |
| [docs/original-product.md](docs/original-product.md) | The originally ideated product, including the full intended data model |
| [docs/decisions/](docs/decisions/) | The twelve numbered decision records in full |
| `.impeccable/design.json` | Machine-readable design tokens and component snippets |

---

## What it does

Three workspace sections, reached from the index rail:

**1. New analysis** — attach a PRD; the retained knowledge base is applied automatically.
Generation stays disabled until a PRD is attached.

**2. Previous runs** — browse and reopen earlier suites, with PRD name, timestamp, case
count, and high-priority count.

**3. Knowledge base** — add, review, and remove the supporting documents that ground every
future analysis.

### The visual system

The interface is a native-app product language — **"The Workbench"** ([DESIGN.md](DESIGN.md),
[ADR-0012](docs/decisions/0012-visual-system-workbench.md)). White windows float on a cool
ground; one indigo accent marks the primary action and the selected row, which glides between
cases. `↑`/`↓`/`j`/`k` move through cases and `⌘↵`/`Ctrl↵` starts a run. On phones the app has
its own shape: a bottom tab bar, a chip rail for coverage areas, and a full-screen case sheet.
Motion respects `prefers-reduced-motion`.

### The run report

- feature name, summary, and pills (cases, high severity, coverage gaps, document, date)
- **the Coverage window** — the twelve coverage areas with case counts; areas the run never
  reached are greyed out, so gaps are visible before a single case is read. Each area filters
  the case list, alongside a severity filter.
- three evidence panels: risk scan, source context, assumptions
- a numbered, filterable coverage list paired with a detail pane and its procedure

Severity is always written out as a word next to its colour, so it reads in greyscale and to
colour-blind users.

A **status pill** reports the backend's real state — connecting, waking up, online, or
unreachable — so the free host's cold start is visible rather than mysterious.

---

## Architecture

```
Browser (Vercel, static SPA)
  ├── Google Identity Services  → ID token (JWT)
  ├── IndexedDB                 → knowledge-base docs + extracted text, keyed by Google sub
  └── localStorage              → run history (max 50), keyed by Google sub
        │  Authorization: Bearer <id_token>
        │  (same-origin; /api/* proxied by vercel.json)
        ▼
Express API (Render, stateless)
  ├── verify ID token          google-auth-library
  ├── POST /api/parse          extract text, return it, store nothing
  ├── POST /api/generate-test-cases → Gemini → validated suite
  └── GET  /api/health         open, unmetered, warm-up target
        ▼
   Gemini API
```

**The backend holds no state.** Any instance serves any request; restarts and redeploys are
harmless.

### Persistence

Data lives in the browser, namespaced by the signed-in Google account:

| Data | Where | Why |
|---|---|---|
| Knowledge-base documents and extracted text | IndexedDB | Extracted text is far too large for localStorage |
| Run history (capped at 50) | localStorage | Small records; simple synchronous access |

Every record carries the Google `sub` claim and every read filters on it, so two people
signing in on the same machine never see each other's data.

**Consequences:** data does not sync across devices, and clearing site data erases it. Both
are stated in the UI. See [ADR-0001](docs/decisions/0001-browser-scoped-persistence.md) for
the reasoning and the restore path to server-side persistence.

### Backend files

| File | Role |
|---|---|
| [server/index.ts](server/index.ts) | Starts the server; binds `0.0.0.0` |
| [server/app.ts](server/app.ts) | Middleware order: helmet → CORS → health → auth → quotas → routes |
| [server/config.ts](server/config.ts) | Model, limits, CORS origins, spend caps — all env-overridable |
| [server/middleware/requireAuth.ts](server/middleware/requireAuth.ts) | Verifies the Google ID token per request |
| [server/middleware/rateLimit.ts](server/middleware/rateLimit.ts) | Per-user and global spend caps |
| [server/routes/parseDocuments.ts](server/routes/parseDocuments.ts) | Extracts text, stores nothing |
| [server/routes/generateTestCases.ts](server/routes/generateTestCases.ts) | PRD upload, KB context, generation |
| [server/services/documentParser.ts](server/services/documentParser.ts) | PDF/DOCX/text extraction, truncation flagging |
| [server/services/geminiTestCaseService.ts](server/services/geminiTestCaseService.ts) | System prompt, schemas, validation, retry |

### Frontend files

| File | Role |
|---|---|
| [src/pages/Index.tsx](src/pages/Index.tsx) | Workspace page and view-state controller |
| [src/components/bench/AppShell.tsx](src/components/bench/AppShell.tsx) | Capsule nav (desktop), top bar + bottom tab bar (phone) |
| [src/components/bench/ui.tsx](src/components/bench/ui.tsx) | Primitives: window, pill, keycap, status pill, severity tag, flourish, brand mark, gliding selection |
| [src/components/TestCaseExplorer.tsx](src/components/TestCaseExplorer.tsx) | Run report: coverage areas, keyboard-navigable case list, detail pane / phone sheet, evidence |
| [src/hooks/use-tunnel-status.ts](src/hooks/use-tunnel-status.ts) | Backend cold-start status for the status pill |
| [src/lib/coverage.ts](src/lib/coverage.ts) | The twelve coverage areas and per-area readings |
| [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx) | Session restore, sign-in, sign-out, expiry timer |
| [src/components/AuthGate.tsx](src/components/AuthGate.tsx) · [SignIn.tsx](src/components/SignIn.tsx) | Sign-in gate and surface (UX only; the API is the boundary) |
| [src/lib/auth.ts](src/lib/auth.ts) | GIS loader, token storage, claim decoding |
| [src/lib/knowledgeBaseStore.ts](src/lib/knowledgeBaseStore.ts) | IndexedDB store, namespaced per account |
| [src/lib/runHistoryStore.ts](src/lib/runHistoryStore.ts) | localStorage history, capped and quota-tolerant |
| [src/lib/api.ts](src/lib/api.ts) | API client; attaches the token and handles `401` in one place |
| [src/lib/testCaseTypes.ts](src/lib/testCaseTypes.ts) · [workspaceTypes.ts](src/lib/workspaceTypes.ts) | Shared contracts |

---

## AI generation

The prompt is split into a **system instruction** (QA architect persona, reasoning
procedure, output rules) and a **user message** (the documents). Both live in
[geminiTestCaseService.ts](server/services/geminiTestCaseService.ts).

Before writing JSON the model works through requirement inventory, knowledge-base
reconciliation, first-principles derivation, blast-radius analysis, and gap identification.
It is then asked to:

- produce **18–28 test cases**, sized to the PRD's actual surface area
- write **4–7 steps** per case, 3 as an absolute floor
- keep no more than 25% on the happy path; include at least four negative cases
- embed expected results in step text, since the schema has no expected-result field
- use concrete test data, never placeholders
- assign criticality from an explicit rubric, High capped near 30%
- record every inference and ambiguity in `assumptions`

### Coverage areas

A fixed enum, enforced in the Gemini response schema and re-checked by Zod:

`Core Functional Flow` · `Input Validation & Error Handling` · `Permissions & Access Control` ·
`API & Data Integrity` · `Integrations & External Dependencies` ·
`State, Concurrency & Edge Cases` · `Cross-Module Impact & Regression` ·
`Notifications & Messaging` · `Analytics & Instrumentation` · `Accessibility` ·
`Performance & Load` · `Security`

### Validation and retry

Three layers: the API response schema (types, required keys, enums, `minItems`), a Zod parse
(the authority), and the prompt for what a schema cannot express.

- **Schema failure** → one retry with the specific issues fed back; a second failure returns
  a clean error.
- **Quality failure** (placeholders, duplicate titles, mostly-thin cases) → one retry.
  **Advisory**: if the retry does not improve things, the schema-valid suite still ships.

`temperature: 0.2`. The 18–28 range is deliberately *not* machine-enforced — `minItems: 18`
would force padding, which the prompt forbids.

### Limits

| Limit | Value |
|---|---|
| Max upload size | 15 MB per file |
| Max extracted text per document | 200,000 characters |
| Max combined knowledge-base text per generation | 600,000 characters |

The PRD is **never** truncated to make room for knowledge-base context. Any truncation is
reported to the model so it can flag under-coverage in `assumptions`.

**Supported formats** — PRD: PDF, DOCX, TXT, MD, RTF (one per run).
Knowledge base: the same plus CSV and JSON (up to 10 files per upload).

---

## API

All routes except `/api/health` require `Authorization: Bearer <google-id-token>` and return
`401` without one.

| Endpoint | Notes |
|---|---|
| `GET /api/health` | **Unauthenticated and unmetered** — the warm-up target pinged before any token exists. Exposes only liveness. |
| `POST /api/parse` | Files in the `documents` field. Returns `{ documents: [{ fileName, text, excerpt, truncated }] }`. Stores nothing. |
| `POST /api/generate-test-cases` | `prd` file + optional `knowledgeBase` JSON field. Returns `{ suite, meta }`. |

`meta` carries `prdName`, `prdExcerpt`, `prdTruncated`, `generatedAt`, `modelName`, and
`promptVersion`. The caller stores the run.

### Spend controls

| Control | Default | Env var |
|---|---|---|
| Generations per user per hour | 5 | `GENERATIONS_PER_USER_PER_HOUR` |
| Generations across all users per day | 100 | `GENERATIONS_GLOBAL_PER_DAY` |
| Document parses per user per hour | 40 | `PARSES_PER_USER_PER_HOUR` |

Exceeding a limit returns `429` with `Retry-After`. Counters are in process memory and reset
on restart — see [ADR-0010](docs/decisions/0010-v1-non-commercial-best-effort-limits.md).

---

## Local development

```bash
npm install
cp .env.example .env   # then fill in the values
npm run dev
```

Frontend on `http://localhost:8080`, backend on `http://localhost:8787`, with `/api` proxied
by Vite — only the frontend URL is needed in a browser.

`http://localhost:8080` must be listed under **Authorized JavaScript origins** on the OAuth
client, or the Google button will not render (silently — no error).

### Scripts

| Command | Does |
|---|---|
| `npm run dev` | Frontend and backend together |
| `npm run build` | Both builds |
| `npm run build:client` | SPA only (what Vercel runs) |
| `npm run build:server` | API only (what Render runs) |
| `npm start` | Start the built backend |
| `npm test` | Vitest |
| `npm run lint` | ESLint |

Deployment: [docs/deployment.md](docs/deployment.md).

---

## Testing

```bash
npm test          # 15 tests
npm run lint      # 0 errors, 8 warnings
npm run build     # client + server
```

Warnings are all `react-refresh/only-export-components` from the shadcn/ui scaffold and the
auth context. They do not block the app.

Covered: the quota middleware (per-user limits, isolation, window expiry, the global cap,
failing closed, bucket sweeping), the run history store (per-account isolation,
de-duplication, corrupt-data tolerance, quota recovery), and workspace rendering.

The authenticated end-to-end flow — sign-in, generation, and data surviving a refresh — is
verified by hand in production, not by automated tests. Automating it would need a headless
Google sign-in, which is why it is a manual check. See [CONTEXT.md](CONTEXT.md).

---

## Current limitations

- Data lives in one browser, for one Google account — no cross-device sync; clearing site
  data erases it ([ADR-0001](docs/decisions/0001-browser-scoped-persistence.md)).
- Run history is capped at 50; older runs are dropped.
- Legacy `.doc` binaries are unsupported. Use `.docx` or PDF.
- In-browser PRD preview works only for text-like formats; PDF and DOCX are parsed
  server-side and show no client-side excerpt.
- Rate-limit counters reset on restart or spin-down; the billing alert is the real backstop.
- Render free spins down after ~15 minutes idle. The client pings `/api/health` on landing
  so the wake overlaps with sign-in, but it does not remove the wait.
- No multi-tenancy — Google sign-in provides identity, not organisations or roles.

## Next

- export generated cases to CSV, XLSX, or a test-management tool *(a binding constraint in
  PRODUCT.md — the output model is already export-shaped)*
- editing and curating cases after generation
- tag, group, or archive previous runs
- server-side persistence for cross-device access
  ([restore path](docs/v1-scope.md))
- OCR for image-based PDFs
