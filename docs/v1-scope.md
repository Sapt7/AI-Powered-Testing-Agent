# Version 1 — Scope, Cuts, and Restore Paths

**Status:** code-complete as of 2026-08-06; not yet deployed.
Deployment runbook: [deployment.md](deployment.md).
**Goal:** ship a publicly hosted, authenticated product at zero infrastructure cost.

This is the rebuild document. Every cut below carries a restore path, so v1 can be grown
back into the [originally ideated product](original-product.md) without archaeology.

Read alongside:
- [original-product.md](original-product.md) — the full intent
- [../PRODUCT.md](../PRODUCT.md) — durable product truth
- [decisions/](decisions/) — why each choice was made, and what was rejected

---

## 1. What v1 is

The originally specified stateless MVP, plus two things it never had: **Google sign-in**
and **browser-side retention** of the knowledge base and run history.

| Concern | v1 answer |
|---|---|
| Frontend hosting | Vercel (static SPA) |
| Backend hosting | Render free web service (Express) |
| Database | **None.** Browser IndexedDB + localStorage |
| Auth | Google Identity Services, ID token verified server-side |
| Signup | Open — anyone with a Google account |
| Commercial status | **Non-commercial** ([ADR-0010](decisions/0010-v1-non-commercial-best-effort-limits.md)) |
| Model | Gemini 2.5 Flash, provider treated as swappable |
| Cost | $0 infrastructure; Gemini usage is the only variable spend |

## 2. What ships

- PRD upload and parsing (PDF, DOCX, TXT, MD, RTF)
- Knowledge-base upload and parsing (adds CSV, JSON)
- Gemini-backed generation: 18–28 cases across twelve fixed coverage areas
- Schema validation with one repair retry, plus advisory quality checks
- Results review: title block, evidence columns, coverage list, step detail
- Knowledge base retained **per browser, per Google account**
- Run history retained **per browser, per Google account**
- Google sign-in gate before the workspace is reachable

## 3. What is cut, and how to restore it

### 3.1 Server-side persistence → browser storage

**Cut:** SQLite, `server/database.ts`, `server/services/persistenceService.ts`,
`server/routes/testRuns.ts`, and the DB-backed half of `server/routes/knowledgeBase.ts`.

**Why:** Render's free tier has an ephemeral filesystem — persistent disks are paid-only.
A SQLite file there is wiped on every deploy, restart, and wake, silently destroying the
knowledge base that `PRODUCT.md` names as the product's differentiator. See
[ADR-0001](decisions/0001-browser-scoped-persistence.md).

**What is lost:**
- Data does not follow a user across devices or browsers.
- Clearing site data destroys the knowledge base and history.
- No server-side audit trail, no cross-user sharing, no analytics on usage.

**Restore path:**
1. Provision free hosted Postgres (Neon — no expiry; **not** Render's own free Postgres,
   which expires after 30 days).
2. Reinstate a persistence service against the schema in
   [original-product.md §8](original-product.md#8-the-intended-durable-data-model),
   keyed by the Google `sub` claim for per-user isolation.
3. Convert the persistence layer to async — the deleted implementation used a synchronous
   module-scope API that neither Neon nor Turso supports. Call sites in the route files
   are already `async`.
4. Add a one-time import that pushes each signed-in user's IndexedDB contents to the
   server, so v1 users do not lose their accumulated context.

**Alternative considered:** Turso (libSQL) keeps SQLite dialect and `?` placeholders, a
much smaller diff than Postgres. Rejected for v1 only because v1 needs no database at all;
still the cheapest migration if persistence returns.

### 3.2 Multi-device and multi-user access

**Cut:** Any notion of a user's data existing outside the browser they created it in.

**Why:** direct consequence of 3.1.

**Restore path:** identical to 3.1 — the moment storage is server-side and keyed by Google
`sub`, this resolves. Auth is already in place in v1, so no additional identity work.

### 3.3 Export to test management tooling

**Cut:** not built. Remains a **binding constraint** in `PRODUCT.md` — the output data
model must stay export-shaped.

**Why:** scope. Not blocked by anything in v1.

**Restore path:** the `GeneratedSuite` type is already flat and serialisable. A client-side
CSV/XLSX export needs no backend at all and could ship inside v1 if wanted. Jira/TestRail/
Xray integration needs the target chosen first — still undecided.

### 3.4 Editing generated cases

**Cut:** not built. Suites are read-only.

**Restore path:** with browser storage this is straightforward — edit in place and write
back to IndexedDB. Note that edited suites then diverge from what the model produced;
keep the original alongside if provenance matters.

### 3.5 Prompt and model traceability

**Cut:** runs do not record which prompt version or model produced them.

**Why:** inherited from the current implementation; the original tech spec did specify
`prompt_version` and `model_name` on `generation_runs`.

**Restore path:** add both fields to the stored run record. Cheap to do in v1's browser
storage and worth doing now — without it, a suite cannot be attributed to the prompt that
made it, and prompt changes become unmeasurable.

### 3.6 Server-side rate limit durability

**Cut:** rate limiting is in-process memory only, reset on every restart/spin-down.

**Why:** no database, no Redis.

**Built anyway:** `server/middleware/rateLimit.ts` enforces a per-user hourly limit and a
global daily cap, both env-tunable. The weakness is durability, not absence.

**Restore path:** move counters to the database added in 3.1, or a free Upstash Redis tier.
The `createQuota` interface stays the same; only the bucket storage changes.

## 4. What v1 adds beyond the original design

### 4.1 Google authentication
Not in the original spec at all. Added because a public URL backed by a paid LLM API needs
an identity gate. See [ADR-0003](decisions/0003-google-identity-services.md).

### 4.2 Browser-scoped retention
The original design re-sent knowledge-base files on every generation. v1 stores extracted
text in IndexedDB so context genuinely accumulates, preserving the "context compounds"
principle without a server database.

### 4.3 Cold-start warm-up
A health ping on landing, overlapping Render's wake with sign-in.
See [ADR-0005](decisions/0005-cold-start-warm-up.md).

## 5. Architecture

```
Browser (Vercel, static SPA)
  ├── Google Identity Services  → ID token (JWT)
  ├── IndexedDB                 → KB documents + extracted text, namespaced by Google sub
  └── localStorage              → run history, namespaced by Google sub
        │
        │  Authorization: Bearer <id_token>
        ▼
Express API (Render free, stateless)
  ├── verify ID token (google-auth-library)
  ├── POST /api/parse            → extract text, return it (no storage)
  ├── POST /api/generate-test-cases → PRD file + KB text → Gemini → validated suite
  └── GET  /api/health           → warm-up target
        │
        ▼
   Gemini API
```

The backend holds **no state whatsoever**. Any instance can serve any request; restarts
and redeploys are harmless.

## 6. Known limitations to state publicly

These are inherent to v1 and should be visible in the product, not just the docs:

- Data lives in this browser. Clearing site data erases it.
- Data does not sync across devices or browsers.
- First request after a period of inactivity is slow while the backend wakes.
- Generated suites are drafts for human review.

## 7. Build order

1. **Documentation** — this set. Rebuild insurance, written while reasoning is fresh.
2. **Google authentication** — gate the app and the API.
3. **Variant B** — remove persistence, add `/api/parse`, add browser storage.
4. **Deploy configuration** — Vercel + Render, CORS, rate limiting, warm-up.

Auth precedes the storage rewrite deliberately: IndexedDB must be namespaced by Google
`sub` from the first line, and retrofitting that is how two users end up sharing a
knowledge base on one machine.

## 8. Explicitly not doing in v1

- No migration of existing local SQLite data. The two runs in `data/` are discarded by
  decision, not oversight.
- No multi-tenancy, org model, or billing.
- No OCR for image-based PDFs.
- No keep-alive cron to defeat Render's spin-down. See
  [ADR-0005](decisions/0005-cold-start-warm-up.md) for why.
