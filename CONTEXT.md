# Project Context

**Read this first.** It is a complete snapshot of the project as of **2026-10-22** — what it
is, what state it is in, what is deployed, what works, and what does not. It exists so work
can resume from a cold start without reconstructing anything.

---

## 1. What this is

**AI Powered Testing Agent** — an AI-powered QA workspace. A QA engineer attaches a Product Requirements Document; the
system analyses it against a knowledge base of the team's own supporting documents and
returns 18–28 executable test cases across twelve fixed coverage areas.

**The differentiator is the retained knowledge base** — context accumulates across runs, so
coverage quality compounds rather than resetting with every PRD. That mechanism is recorded
as a binding constraint in `PRODUCT.md`.

The primary user is a **QA engineer or SDET**, working late in a release cycle under time
pressure. Their workflow is the tiebreaker when design decisions conflict.

**Not** a test management system. No execution tracking, no defect lifecycle.

---

## 2. Current state

**Version 1 is deployed and live.** Non-commercial.

| | |
|---|---|
| App | https://ai-testing-agent-black.vercel.app |
| API | https://ai-powered-testing-agent-api.onrender.com |
| Repository | https://github.com/Sapt7/AI-Powered-Testing-Agent |
| Branch | `main`, at `4e1886c` |
| Tests | 15 passing |
| Lint | 0 errors, 8 warnings (all `react-refresh`, benign) |
| Builds | client and server both clean |

### Verified in production

`GET /api/health` → 200 · `POST /api/parse` → 401 without a token · invalid token → 401 ·
CORS echoes the allowed origin and withholds it from foreign origins · HSTS, nosniff, and
X-Frame-Options present · SPA deep links fall back correctly · `/api/*` proxies from Vercel
through to Render.

### Verified by hand in production (2026-08-06)

The authenticated end-to-end flow has been walked and works:

- Google sign-in loads and completes on the live site
- The workspace opens with the signed-in identity
- **Data survives a page refresh** — the real test of the per-account IndexedDB and
  localStorage layers
- The OAuth consent screen is **published to Production**, so the 100-user cap and the
  7-day refresh-token expiry no longer apply

This closed the project's largest open risk. The remaining unknowns are operational
(see below), not functional.

**Still worth watching on a cold instance:** the first generation after ~15 minutes of
inactivity pays a Render cold start *plus* 1–3 minutes of model time. The landing-page
health ping hides part of that behind sign-in, but not all of it.

---

## 3. Outstanding actions

### Done

- [x] Authorized JavaScript origin added — sign-in works in production
- [x] OAuth consent screen published to Production
- [x] End-to-end authenticated flow verified by hand

### Open

- [ ] **Rotate the Render API key and the GitHub personal access token.** Both were shared in
      a chat session during setup. Nothing depends on them any more — the Render service and
      the repository are fully configured — so rotating costs nothing.
- [ ] **Connect the repository in the Render dashboard.** The service was created via API,
      which skips the GitHub OAuth flow that installs the push webhook — so **Render does not
      auto-deploy**. Vercel does. Until this is connected, every backend change needs a manual
      deploy.

### Consciously deferred

- **Gemini billing budget + alert.** [ADR-0010](docs/decisions/0010-v1-non-commercial-best-effort-limits.md)
  treats this as the primary spend protection, because the in-app rate-limit counters reset
  whenever the free instance restarts. Assessed as low risk at current usage and deliberately
  deferred.

  **Revisit the moment any of these become true:** the URL is shared beyond a handful of
  known people, sign-ups appear from unknown accounts, or the app is linked publicly. Signup
  is open to anyone with a Google account
  ([ADR-0004](docs/decisions/0004-open-signup.md)), so exposure is what turns this from
  theoretical into urgent — not time.

---

## 4. Architecture

```
Browser (Vercel, static SPA)
  ├── Google Identity Services  → ID token (JWT)
  ├── IndexedDB                 → KB docs + extracted text, keyed by Google `sub`
  └── localStorage              → run history (max 50), keyed by Google `sub`
        │  Authorization: Bearer <id_token>
        │  same-origin; /api/* proxied by vercel.json
        ▼
Express API (Render free, STATELESS)
  ├── helmet → CORS → /api/health (open) → requireAuth → quotas → routes
  ├── POST /api/parse                  extract text, return it, store nothing
  ├── POST /api/generate-test-cases    PRD + KB context → Gemini → validated suite
  └── GET  /api/health                 open, unmetered, warm-up target
        ▼
   Gemini API (gemini-2.5-flash, temperature 0.2)
```

**The backend stores nothing.** Restarts and redeploys are harmless. There is no database
anywhere in the system.

### Three things that follow from that

1. **Rate-limit counters reset on every restart.** Accepted, not a bug.
2. **Data does not sync across devices.** Accepted, stated in the UI.
3. **Every stored record is namespaced by the Google `sub` claim.** Two people signing in on
   one machine must never see each other's data. This is why auth was built *before* the
   storage layer.

---

## 5. Documentation map

| File | Owns |
|---|---|
| **CONTEXT.md** (this) | The whole picture, for resuming cold |
| **PRODUCT.md** | Durable product truth — user, purpose, constraints, open decisions |
| **DESIGN.md** | The visual system — tokens, type ramp, named rules, components |
| **DECISIONS.md** | Index of all twelve architectural decisions and their trade-offs |
| **CHANGELOG.md** | Dated record of what changed and why |
| **README.md** | How the implementation works today |
| `docs/deployment.md` | Runbook, live environment, spend controls, gotchas |
| `docs/v1-scope.md` | What v1 cuts, and a restore path per cut |
| `docs/original-product.md` | The full original intent, including the intended data model |
| `docs/decisions/` | The twelve records in full |

**Invariants that keep these honest:**

- `PRODUCT.md` describes the *full* product and is never narrowed to fit v1. `docs/v1-scope.md`
  holds the cuts.
- `DESIGN.md` is written from the *built* interface, not from intention.
- Decision records are immutable; changes get new records that amend the old.

---

## 6. The decisions that constrain everything

Full index in `DECISIONS.md`. The four that shape most future work:

**[0001] There is no database.** Render's free tier has an ephemeral filesystem, so SQLite
there would be silently destroyed on every deploy — deleting the product's differentiator.
Storage moved to the browser. *This is why* the API is stateless, why counters don't persist,
and why `/api/parse` exists.

**[0003 + 0004] Authenticated, but open to anyone.** Google sign-in verified server-side, no
allowlist. Auth supplies identity, *not* a spend ceiling.

**[0009] The runtime contract outranks storage.** `GeneratedSuite` is the stable object. *This
is why* runs record `modelName` and `promptVersion` even though nothing reads them yet —
impossible to backfill.

**[0010] v1 is non-commercial.** This is what makes free-tier hosting legitimate and lets
best-effort spend controls suffice.

---

## 7. Infrastructure

| Resource | Identifier |
|---|---|
| Render service | `srv-d9q3deqd0e5s738tm9k0` (`ai-powered-testing-agent-api`) |
| Render project | `prj-d9q3904s728c738ui7ug` — env `evm-d9q3904s728c738ui7v0` |
| Render owner | `tea-d9q299ss728c738smisg` (team MindX), free plan, Oregon |
| Vercel project | `prj_IDYbjJr3VDQz8luwK6BC1JLfuBjN` (`ai-testing-agent`) |
| Vercel team | `team_vTR3NvfY4MWjx7mU9bk93k7e` (`mind-x2`) |
| OAuth client ID | `895232353971-o6dttnfjigbirv431qnfm4n41drbgntq.apps.googleusercontent.com` |

The OAuth client ID is public — it ships in the browser bundle and authorizes nothing on its
own. It is committed in `.env.production` so builds are reproducible without dashboard config.

### Render environment variables

`GEMINI_API_KEY` (secret) · `GEMINI_MODEL` · `GOOGLE_CLIENT_ID` · `CORS_ORIGIN` ·
`NODE_VERSION=20` · `GENERATIONS_PER_USER_PER_HOUR=5` · `GENERATIONS_GLOBAL_PER_DAY=100` ·
`PARSES_PER_USER_PER_HOUR=40`

**Never set `PORT`** — Render injects it and `server/config.ts` already reads it.

Vercel needs **no** environment variables.

### Build commands

| Platform | Command |
|---|---|
| Vercel | `npm run build:client` → `dist` |
| Render | `npm ci && npm run build:server` → `npm start` |

Each platform builds only its half. Running the full `npm run build` on either wastes
minutes compiling something it does not serve.

---

## 8. Traps that have already cost time

Every one of these was hit during the build. They will be hit again.

**`npm ci` validates the lockfile against `package.json`.** Renaming the package without
regenerating `package-lock.json` fails the Render build with a confusing npm usage dump.
Always run `npm install --package-lock-only` after touching name or version.

**Render does not auto-deploy.** Created via API, so no push webhook. Trigger deploys
manually or connect the repo in the dashboard.

**Vercel cannot interpolate env vars into `vercel.json` rewrites.** The Render URL must be a
literal string. It is currently hardcoded there.

**The server must bind `0.0.0.0`.** A loopback bind is unreachable inside a container and
fails with "no open ports detected."

**Multer's *field* size limit is 1 MB by default** — below the knowledge-base context budget
once JSON escaping is counted. It is raised to 4 MB via `maxKnowledgeBaseFieldBytes`. Lower
it and the knowledge base is silently truncated.

**The layout changes shape at 768px.** Below it the capsule nav becomes a glass top bar plus
a bottom tab bar, the area sidebar becomes a chip rail, and the case detail opens as a
full-screen sheet. That is the designed phone layout, not a bug — do not "fix" it.

**The design hook flags fonts and sizes against `DESIGN.md`.** After a deliberate design
change, the fix is to update `DESIGN.md`, not to add an ignore rule.

**Brand marks need unique gradient ids.** The responsive shell renders the mark twice, one
copy in a `display:none` subtree; a shared SVG id resolves to the hidden copy and the visible
mark loses its fill. `BrandMark` uses `useId` — keep it that way.

**Do not commit `.agents/`, `.claude/`, `.gemini/`, `.codex/`.** They are local agent tooling
— ~200k lines across three duplicate copies. Already gitignored; keep it that way.

---

## 9. Local development

```bash
npm install
cp .env.example .env   # fill in GEMINI_API_KEY and the OAuth client ID
npm run dev
```

Frontend `http://localhost:8080`, backend `http://localhost:8787`, `/api` proxied by Vite.

`http://localhost:8080` must be an Authorized JavaScript origin on the OAuth client or the
Google button will not render.

Node 20+ required (the repo pins `>=20`; developed on v24).

### Shipping a change

```bash
npm test && npm run lint && npm run build   # gate
git push                                     # Vercel auto-deploys
```

Then trigger a Render deploy manually (dashboard, or `POST /v1/services/{id}/deploys`) until
the webhook is connected.

---

## 10. How the project got here

Useful for understanding why things look the way they do.

1. **Scaffold origin.** Began as a Lovable/Vite template with unrelated trading-app
   components. All removed; vendor branding stripped.
2. **First implementation.** Server-side SQLite persistence with a hardcoded absolute path,
   a "warm cream editorial" aesthetic, and a thin prompt asking for "at least 5 test cases."
3. **Prompt rewrite.** Replaced with a reasoning-procedure system instruction targeting
   18–28 cases. Adopting it exposed four schema conflicts — two of which (`risks`,
   `sourceHighlights` being required with `.min(2)`) would have hard-failed every generation.
4. **Visual replacement.** "The Specification Binder" — Geist, beige/white/blue/black, flat.
   Fixed a live radius inversion and a 3.15:1 contrast failure in the process.
5. **v1 scoping.** Hosting analysis found Render's ephemeral filesystem would silently
   destroy the knowledge base. Persistence moved to the browser; the full intent was
   preserved in `docs/original-product.md` with restore paths.
6. **Auth, then storage.** Deliberately in that order, so IndexedDB could be namespaced by
   Google `sub` from the first line rather than retrofitted.
7. **Deployment.** Render via API, Vercel via Git import, CORS closed, spend caps applied.
8. **Second visual replacement (2026-10-22).** The binder read as too basic. Replaced with
   "The Test Section" — a wind-tunnel facility with live streamlines, a manometer board for
   coverage, and a tunnel lamp for cold-start state. Product renamed to **AI Powered Testing
   Agent**. See [ADR-0011](docs/decisions/0011-visual-system-test-section.md).
9. **Third visual replacement (2026-10-22).** The wind tunnel read as off the point. Replaced
   with "The Workbench" — a native-app language brief-pinned to lineaprompt.com: white windows,
   one indigo accent, gliding selection, keyboard navigation, and a designed phone layout
   (bottom tabs, case sheet). See [ADR-0012](docs/decisions/0012-visual-system-workbench.md).

**A note on the original design:** the project's own technical specification described a
*stateless* MVP with knowledge-base files sent on the generation request. The SQLite phase
went beyond that plan. **v1 is a return to the original architecture**, plus retention and
auth it never had.
