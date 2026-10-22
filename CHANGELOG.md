# Changelog

## 2026-10-22 — Visual system replaced: "The Workbench"

"The Test Section" was judged off the point. The product owner pinned **lineaprompt.com** as
the reference, asked for animation, and asked for a genuinely mobile-friendly, compatible
build. Implements [ADR-0012](docs/decisions/0012-visual-system-workbench.md), which supersedes
ADR-0011. The pin overrode direction roll `e85e233b`.

**The world**
- Cool blue-grey ground with soft light; white windows with title bars on deep soft shadows.
- One indigo accent (`#32389F`) for the primary action, focus, and solid row selection.
- The platform's own typeface (SF Pro / Segoe UI Variable / Roboto) replaces Archivo; IBM Plex
  Mono replaces JetBrains Mono for measurements. New indigo brand mark and favicon.

**Interaction and motion**
- Selection highlight glides between rows; `↑`/`↓`/`j`/`k` move through cases; `⌘↵`/`Ctrl↵`
  generates. Keycaps appear only beside shortcuts that work.
- Hand-drawn underline drawn once on sign-in and New analysis; staggered window/row arrival;
  a traveling dot and shimmer on the run timeline; breathing status dots.
- One ease-out curve everywhere; no bounce. Everything off under `prefers-reduced-motion`.

**Mobile and compatibility**
- Phone layout: glass top bar, bottom tab bar (Analyze / Runs / Library) with safe-area
  padding, coverage chip rail, full-screen case sheet (Escape/back closes, scroll locks).
- `100dvh`, `-webkit-text-size-adjust`, `backdrop-filter` with a solid fallback; no horizontal
  scroll at 360px.

**Removed:** `src/components/tunnel/*` (streamline field, manometer board, primitives, brand
mark) and `src/components/AppSidebar.tsx`. New: `src/components/bench/`.

**Docs:** DESIGN.md and `.impeccable/design.json` rewritten; ADR-0012 added, ADR-0011 marked
superseded; README, CONTEXT, DECISIONS, PRODUCT updated. No behaviour, storage, auth, or API
changes.

## 2026-10-22 — Visual system replaced: "The Test Section"

The previous design ("The Specification Binder") was judged too basic. Every pin was released
— palette, type, structure, copy — and the interface was rebuilt as a wind-tunnel facility.
Implements [ADR-0011](docs/decisions/0011-visual-system-test-section.md), which supersedes
ADR-0008. Direction roll seed `1d3ddec9`, assigned candidate 4 of 7, chosen by the product
owner over two dealt challengers and the category standard.

**Product name:** **AI Powered Testing Agent** (set by the product owner), now used in the
browser title, sign-in, and the instrument rail. Recorded in PRODUCT.md as a brand commitment.

**The world**
- Facility-grey daylight panels for reading; graphite test-section windows for the product's
  moments; safety yellow for the run button and engaged indicators; manometer fluids
  (red/amber/blue) for severity.
- Archivo variable across its width axis (condensed placards → expanded wall lettering);
  JetBrains Mono only for measurements. Replaces Geist.
- New brand mark and favicon: three streamlines parting around a body, on safety yellow.

**New instruments — each carries real data**
- **Streamline field** (`src/components/tunnel/StreamlineField.tsx`): SVG smoke streamlines
  that part around the mounted PRD and run ×3.2 faster during generation. Smooth displacement
  (`dy' = sign·√(dy² + H²·g(dx))`) — no kinks; seamless dash loops; scattered phases.
- **Manometer board** (`ManometerBoard.tsx`): twelve tubes, one per coverage area, fluid
  stacked by severity. **Dry tubes expose coverage gaps at a glance.** Each tube filters the
  case list.
- **Tunnel lamp** (`use-tunnel-status.ts`): reports checking / spinning up / online /
  unreachable, making the free host's cold start visible instead of mysterious.
- **Severity vial**: hue paired with fill height, so severity reads in greyscale.
- **Coverage fingerprint** on every run in the history log.

**Interaction**
- PRDs can be dragged onto the test section, with file-type validation.
- Coverage list filterable by area (via the board) and by severity.
- The run view shows a real elapsed clock — no invented progress percentage.
- **Fixed:** opening a run from *Previous runs* no longer highlights *New analysis*.
- The rail's collapsed state now shows icon buttons instead of hiding navigation entirely;
  sign-out and the signed-in identity moved into the rail footer.

**Verification**
- Desktop (1440px) and mobile (390px) inspected across sign-in, new analysis (empty and
  mounted), and the run report.
- Fixed in the inspection rounds: streamline kinks at the body, aligned dash pulses reading
  as a barcode, a truncated readout strip, the PRD card swallowing the mobile test section,
  a duplicated status lamp on mobile, and **the run report overflowing horizontally on
  phones** (manometer board widening its parent grid — fixed with `min-w-0`).
- Contrast sweep across every text node on the run report: 0 failures.
- Design detector: 0 findings after the DESIGN.md rewrite. 15/15 tests passing.
- **Not visually verified:** the run-in-progress view, which needs a real authenticated
  generation to trigger. It is composed from the same verified components.

**Documentation:** DESIGN.md and `.impeccable/design.json` rewritten from the built world;
ADR-0011 added; ADR-0008 marked superseded; README, CONTEXT, DECISIONS, and PRODUCT updated.

## 2026-08-06 — Production verified end to end

**Version 1 is live and working.** The authenticated flow was walked by hand against the
deployed app:

- Google sign-in loads and completes in production
- The workspace opens with the signed-in identity
- **Data survives a page refresh**, confirming the per-account IndexedDB and localStorage
  layers behave as designed
- The OAuth consent screen is published to Production, lifting the 100-user cap and the
  7-day refresh-token expiry

This closed the project's largest open risk, which had been carried and flagged since the
storage rewrite: no automated test can cover it, because it needs a real Google sign-in.

**Recorded as consciously deferred:** the Gemini billing budget and alert. ADR-0010 makes it
the primary spend protection, since the in-app counters reset on restart. Assessed as low
risk at current usage. CONTEXT.md now records the specific conditions that make it urgent —
exposure of the URL rather than passage of time, because signup is open to anyone with a
Google account.

**Still open:** rotating the setup credentials, and connecting the repository in the Render
dashboard so backend pushes auto-deploy.

## 2026-08-06 — Deployed to production, and documentation consolidated

**v1 is live.** App on Vercel, API on Render, verified end to end.

**Deployment**
- Render service `ai-powered-testing-agent-api` created and deployed; Vercel project
  `ai-testing-agent` imported from the repository.
- `CORS_ORIGIN` restricted to the Vercel origins plus localhost; verified that a foreign
  origin receives no `Access-Control-Allow-Origin` header.
- Added `.env.production` carrying the public OAuth client ID, so production builds are
  reproducible on any host without dashboard configuration. It contains no secrets — the
  client ID ships in the browser bundle regardless and authorizes nothing on its own.
- Regenerated `package-lock.json` after the package rename. `npm ci` validates the lockfile
  against `package.json`, so the stale name would have failed the Render build.
- Gitignored `.agents/`, `.claude/`, `.codex/`, `.gemini/` — roughly 200k lines of local
  agent tooling across three duplicate copies that were about to enter the product repo.
  The initial commit went from 516 files to 80.

**Documentation**
- Added [CONTEXT.md](CONTEXT.md) — a complete cold-start snapshot: state, live URLs,
  infrastructure identifiers, outstanding actions, the traps already hit, and how the
  project reached its current shape.
- Added [DECISIONS.md](DECISIONS.md) — a root-level index over the ten decision records,
  with the trade-off each accepted and the four that constrain everything else.
- Rewrote [README.md](README.md) with an explicit documentation map showing which file owns
  which kind of truth, how they relate, and the invariants that stop them drifting.
- Corrected stale README claims: it still described runs as "stored in the backend database"
  and listed authentication as a *future* enhancement.
- Recorded the live environment and the missing Render webhook in
  [docs/deployment.md](docs/deployment.md).

**Known gap:** the authenticated end-to-end flow remains unverified by anyone. Documented
prominently in CONTEXT.md rather than left implicit.

## 2026-08-06 — Spend controls and deployment configuration (v1, step 4 of 4)

Completes the version 1 build. Implements the mitigations
[ADR-0004](docs/decisions/0004-open-signup.md) made mandatory under open signup.

**Spend controls**
- Added `server/middleware/rateLimit.ts`. Two limits protecting different things: a
  per-user hourly limit stops one account monopolising the service, and a **global daily
  cap** is the only thing between an abuse incident and an unbounded bill.
- Applied to `/api/generate-test-cases` (5/user/hour, 100/day globally) and, more loosely,
  to `/api/parse` (40/user/hour) — parsing is not billed but a large PDF is the likeliest
  way to exhaust a 512 MB instance.
- Exceeding a limit returns `429` with `Retry-After` and an honest message.
- Every threshold is env-overridable, so a limit can be loosened on a running deployment
  the moment a legitimate user hits it.
- Keyed by the Google `sub` claim, and **fails closed** if identity is somehow absent.
- Counters are in process memory and reset on restart — documented as a speed bump, with
  the billing budget alert as the real backstop.

**Hardening**
- Added `helmet`. Verified `Strict-Transport-Security`, `X-Content-Type-Options`,
  `X-Frame-Options`, and `X-DNS-Prefetch-Control` on responses.
- `CORS_ORIGIN` now restricts allowed origins; unset still allows any, with a startup
  warning. Verified an allowed origin is echoed and a disallowed one receives no header.
- The server now binds `0.0.0.0`. A loopback-only bind is unreachable from outside a
  container.

**Deployment**
- Added `vercel.json` (SPA build plus an `/api/*` rewrite to Render) and `render.yaml`
  (Blueprint, secrets marked `sync:false`).
- Split `build:client` out of `build`, so Vercel builds only the SPA and Render only the
  API. `npm run build` still does both for local verification.
- Pinned `"engines": { "node": ">=20" }`.
- `src/lib/api.ts` gained optional `VITE_API_BASE_URL` support, defaulting to same-origin
  so the rewrite path needs no configuration and avoids CORS entirely.
- Added [docs/deployment.md](docs/deployment.md) — a runbook covering both platforms, the
  OAuth consent screen, the billing budget, and the failure modes worth knowing.

**Verification**
- 16/16 tests passing, including seven new ones covering the quota: per-user limits,
  per-user isolation, window expiry, the global cap across different users, failing closed
  without identity, `Retry-After`, and bucket sweeping so memory stays bounded.
- Auth still runs before metering — an unauthenticated request gets `401`, not `429`.
- Client and server builds verified independently.

## 2026-08-05 — Persistence removed; browser storage (v1, step 3 of 4)

Implements [ADR-0001](docs/decisions/0001-browser-scoped-persistence.md). **The backend is
now stateless** — it holds no data of any kind, so restarts and redeploys are harmless.

**Removed**
- `server/database.ts`, `server/services/persistenceService.ts`, `server/routes/testRuns.ts`,
  `server/routes/knowledgeBase.ts`, and the `data/` directory.
- `src/lib/workspaceStorage.ts`, superseded by the two stores below.
- The last `node:sqlite` reference, which **lifts the Node 22+ requirement** and widens host
  compatibility.

**Added — backend**
- `POST /api/parse` (`server/routes/parseDocuments.ts`) — extracts text from uploaded
  documents and returns it. The server keeps no copy.
- `POST /api/generate-test-cases` now accepts knowledge-base context as a JSON form field
  rather than reading it from a database. That input is client-controlled, so it is
  re-validated and re-capped server-side: the client enforcing a budget is a convenience,
  the server enforcing it is what stops a crafted request running up an unbounded model bill.
- `maxKnowledgeBaseFieldBytes` (4 MB). Multer's 1 MB default *field* limit sits below the
  600,000-character context budget once JSON escaping is counted — it would have silently
  truncated the knowledge base.
- `PROMPT_VERSION` is now returned with every generation.

**Added — browser storage**
- `src/lib/knowledgeBaseStore.ts` — IndexedDB, holding extracted text. Not localStorage:
  at 200,000 characters per document stored as UTF-16, ten documents is ~4 MB against a
  typical 5 MB quota, before history.
- `src/lib/runHistoryStore.ts` — localStorage, capped at 50 runs, recovering from a quota
  error by trimming rather than discarding the run the user just waited minutes for.
- **Every record is namespaced by the Google `sub` claim**, and deletes verify ownership.
  Two people signing in on one machine must never see each other's data — this is why auth
  was built before storage rather than after.

**Traceability**
- Runs now record `modelName` and `promptVersion`, per
  [ADR-0009](docs/decisions/0009-data-model-authority.md). Nothing reads them yet; they are
  impossible to backfill.

**UI**
- Knowledge base and history each state plainly that data lives in this browser, and each
  gained a "Clear all" control — previously there was no escape hatch from wedged storage.
- Loading copy now sets an expectation ("one to three minutes") rather than spinning
  indefinitely.
- Truncated knowledge-base documents are labelled as such.

**Verification**
- 9/9 tests passing, including six covering the new run store: per-account isolation,
  de-duplication, corrupt-data tolerance, and quota recovery.
- `POST /api/parse` and `POST /api/generate-test-cases` return `401` unauthenticated;
  `GET /api/health` stays open at `200`.
- Lint 0 errors; client and server builds clean.

**Not yet done:** per-user rate limiting and the global daily cap required by
[ADR-0004](docs/decisions/0004-open-signup.md). These land with the deploy step.

## 2026-08-05 — Google authentication (v1, step 2 of 4)

Implements [ADR-0003](docs/decisions/0003-google-identity-services.md) and
[ADR-0004](docs/decisions/0004-open-signup.md). Signup is open to anyone with a Google
account.

**Backend**
- Added `server/middleware/requireAuth.ts` — verifies the Google ID token on every request
  with `google-auth-library`, checking signature, `iss`, `exp`, and `aud`. Identity is
  re-derived per request; no sessions are stored, so the API stays stateless.
- `server/app.ts` now mounts `requireAuth` on `/api`, **after** `GET /api/health`.
  Health stays deliberately open: it is the warm-up target the client pings before any
  token exists, and it exposes only liveness.
- Added `GOOGLE_CLIENT_ID` to `server/config.ts`. The server refuses to authenticate at all
  if it is unset, rather than failing open.

**Frontend**
- Added `src/lib/auth.ts` — Google Identity Services loader, token storage, and claim
  decoding. Claims are read locally only to render the user and detect expiry; the server
  never trusts anything decoded in the browser.
- Added `src/contexts/AuthContext.tsx` — session restore, sign-in callback, sign-out, and
  an expiry timer that ends the session in-app at the moment the token dies, so users are
  told to sign in again rather than discovering it through a failed generation.
- Added `src/components/SignIn.tsx` and `src/components/AuthGate.tsx`. The gate is UX only;
  the API is the security boundary.
- `src/lib/api.ts` routes every call through one helper that attaches the bearer token and
  handles `401` in a single place, clearing the token and dropping the app to signed-out.
- Signed-in user and a sign-out control added to the workspace header.

**Warm-up**
- `warmUpBackend()` fires from `src/main.tsx` before React mounts, implementing
  [ADR-0005](docs/decisions/0005-cold-start-warm-up.md). Fire-and-forget: never awaited,
  never surfaces an error.

**Configuration**
- `.env.example` documents `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID`. Both hold the
  same public OAuth client ID; the server uses it as the required `aud` claim, the browser
  bundle needs the `VITE_`-prefixed copy.

**Housekeeping**
- Deleted `src/App.css`, unimported Vite template scaffold.

**Verification**
- API returns `401` with no token and with an invalid token; `GET /api/health` returns `200`
  unauthenticated.
- 3/3 tests passing; lint 0 errors; client and server builds clean.

**Not yet done:** per-user rate limiting and the global daily generation cap required by
[ADR-0004](docs/decisions/0004-open-signup.md). These land with the deploy step.

## 2026-08-05 — Version 1 planned and documented (no code changes)

Documentation only. No application code was modified.

- Added [docs/original-product.md](docs/original-product.md) — the product as originally
  ideated, reconstructed from the project's own PRD and technical specification. Includes
  the full five-table data model and API contract that were specified but never built, so
  they survive the deletion of the current persistence layer.
- Added [docs/v1-scope.md](docs/v1-scope.md) — what version 1 ships, every cut, and a
  restore path per cut.
- Added [docs/decisions/](docs/decisions/) — nine numbered decision records covering
  browser-scoped persistence, hosting topology, Google authentication, open signup,
  cold-start warm-up, provider swappability, the prompt contract, the visual system, and
  data-model authority. Each records the options rejected and the trade-off accepted.
- Updated `PRODUCT.md`: closed two open decisions (authentication/hosting, and data-model
  authority) and recorded that persistence is deferred rather than abandoned.

Notable finding: the original technical specification explicitly describes a **stateless**
MVP with knowledge-base files sent on the generation request and persistence deferred. The
SQLite phase went beyond that plan; version 1 returns to the original architecture and adds
retention it never had.

## 2026-08-03 — Scaffold branding removed

- Replaced the scaffold favicon with `public/favicon.svg`, drawn in the current design
  language (black sheet mark, blue section tick). The old `favicon.ico` is deleted, so no
  stale icon can be served from `/favicon.ico`.
- Removed the `og:image` and `twitter:image` tags, which pointed at a screenshot hosted on
  the scaffold vendor's CDN. `twitter:card` drops to `summary` accordingly. This resolves
  the outstanding "asset you must replace" item from the redesign entry below.
- Removed the scaffold's component-tagger dev dependency and its Vite plugin registration.
  It only fed the original vendor's visual editor and did nothing for local development.
- Deleted `playwright.config.ts` and `playwright-fixture.ts`. Both imported a scaffold
  vendor package that is not installed, so they were already broken — there are no spec
  files and no npm script referencing them. `@playwright/test` remains in `devDependencies`
  and is now unused; remove it too if you do not plan to add E2E tests.
- Deleted the unused `public/placeholder.svg` scaffold asset.

## 2026-08-02 — Visual system replaced: "The Specification Binder"

A full replacement of the interface's visual world. Product truth, content, copy meaning,
API behaviour, and application logic are unchanged — this is presentation only. No route,
handler, state shape, or network call was modified.

Direction contract recorded in `index.html` (seed `99663515`, direction/operate, candidate 6 of 7)
and verified present in the production build output.

---

### Typography — now Geist throughout

| | Before | After |
|---|---|---|
| Display face | Instrument Serif 400 | *(removed)* |
| Body face | Manrope 400–800 | Geist variable 100–900 |
| Largest size | 48px | 26px |
| Label tracking | 0.24em | 0.075em |

- Loaded Geist as a variable font from Google Fonts, replacing the Instrument Serif +
  Manrope pair. One family now sets everything including numerals.
- Collapsed the type ramp to six declared steps: **11 / 12 / 13 / 17 / 24 / 26px**.
  Hierarchy is carried by weight (400 / 500 / 600) and rule placement instead of size —
  the previous world's 48px serif headline had no replacement at equivalent scale by design.
- Body dropped 14px → 13px; measure capped at 68ch.
- `font-variant-numeric: tabular-nums` applied to counts, dates, indices, and step numbers
  so columns align.
- Reduced label tracking from the previous 0.24em to 0.075em.
- `.font-serif` is retained as a *name only*, remapped to Geist 600, so any untouched call
  site inherits the new voice instead of falling back to Georgia.

### Color — beige, white, blue, black

- Replaced the entire palette. New tokens: `stock` / `stock-sunk` / `stock-edge` (beige),
  `paper` / `paper-sunk` (white), `ink` / `ink-soft` / `ink-faint` (black),
  `blue` / `blue-deep` / `blue-wash` / `blue-line`.
- **The dark navy sidebar is gone.** The rail is now beige index stock, making the app
  single-ground and light throughout.
- **Criticality is no longer hue-coded.** The rose / amber / emerald trio was removed to
  honour the four-colour palette. Priority is now encoded by *fill density* on an 8px
  square: High = solid blue, Medium = 40% blue, Low = hollow. This is a deliberate
  trade — see *Notable behaviour changes* below.
- Removed the orange/ember accent and all sky-* / slate-* / rose-* / amber-* / emerald-*
  literal palette classes from the app screens. Every chromatic decision now routes through
  one accent.
- Deleted dead scaffold tokens `--bullish`, `--bearish`, `--neutral`, `--confidence` and
  their Tailwind colour keys. They had no live consumer.

### Transparency and depth — removed

- Deleted **all** `backdrop-blur`, `bg-white/85`, `bg-white/88`, `bg-white/80`,
  `bg-white/75` and `border-white/60` translucency.
- Deleted the page's layered radial + linear gradient field.
- Replaced the signature `0 24px 80px -40px rgba(15,23,42,0.45)` shadow with a single
  near-invisible sheet shadow (1px offset, 2–3px blur, 4–5% ink) whose only job is to keep
  a sheet's bottom edge from dissolving into the stock.
- Depth is now value separation plus a 1px hairline. Nothing lifts on hover or selection.

### Shape

- Radius scale rewritten and **declared end to end**: `none 0 / sm 2 / md 3 / lg 4 / xl 5 /
  2xl 6 / 3xl 8 / full`.
- **Fixed a live inversion bug:** the previous theme raised `sm`/`md`/`lg` to 12/14/16px but
  left `xl` at the framework default of 12px, so `rounded-xl` rendered *smaller* than
  `rounded-lg`. Every step is now explicit, so the ordering cannot invert again.
- Working radius dropped from 24px to 4px on sheets, buttons, and the drop target.
- **All pills removed.** Badges are no longer capsules; status and metadata are set as type
  with a mark beside them.

### Layout and components

- Cards replaced by **sheets**: a white surface divided into full-bleed horizontal bands
  separated by hairlines. Nested bordered boxes were eliminated.
- New **title block** on results — a divided 4-across metadata strip (document, generated,
  cases, high priority), replacing the floating metrics box.
- New **section rule** — a 3×10px blue tick plus a standalone uppercase label opening a band.
- Previous runs rebuilt as a **register**: zero-padded index, name, excerpt, and a
  right-aligned tabular metric group that hides below `sm`.
- Coverage rebuilt as numbered clauses in an asymmetric master–detail split (`1fr / 1.15fr`,
  weighted to the detail pane).
- Evidence trio (risk scan / source context / assumptions) converted from three nested cards
  into three ruled columns inside one sheet.
- Sidebar rebuilt as **index tabs**: the active tab takes the white sheet fill and pulls one
  pixel right over the rail edge.
- Header bar reduced from 64px to 48px.
- Buttons: default height 40px → 36px, `sm` 36px → 32px, label 14px → 13px.
- Loading state: the spinning ring was replaced by a rule being read left-to-right.
- Motion consolidated to one authored moment — a sheet settling on view change, 260ms
  exponential ease-out, disabled under `prefers-reduced-motion`.

### Removed: eyebrow labels

Four small tracked labels that sat above headings were deleted — `TEST A NEW PRD`,
`SUMMARY OF THE PRD`, `SELECTED TEST CASE`, and `RESULTS`. Headings now carry themselves.
Labels survive only where they mark a *region* and stand alone (section rules, title-block
fields).

### Accessibility

- **Fixed a contrast failure.** Secondary text measured **3.15:1** against the beige rail —
  below the 4.5:1 floor — and 4.42:1 on white. `--ink-soft` and `--ink-faint` were darkened
  and re-separated; they now measure 9.6:1 / 6.4:1 on paper and 6.8:1 / 4.6:1 on stock.
  Verified programmatically across every text node on the page: **0 failures**.
- Every text colour is now specified against the beige stock, not white, because stock is
  the darkest ground secondary text sits on.
- Priority no longer depends on hue, so the scale survives greyscale printing and
  colour-blind reading.
- Added `aria-current` to index tabs and coverage rows; `aria-label` on the tab nav;
  `aria-hidden` on decorative marks.
- Focus rings standardised to a 2px blue ring at 2px offset, with inset rings on list rows.

### Fixed

- **The sidebar product title was invisible** — `text-foreground` (near-black) on the
  near-black navy rail. Inverting the rail to beige makes it legible by construction.
- The browser tab still carried the scaffold's placeholder name and description, and the
  `og:`/`twitter:` tags carried the same. All now describe the product.
- Removed the stale `TODO` scaffold comments and the scaffold's twitter:site attribution.

### Design system artifacts

- `DESIGN.md` rewritten from the built world — new frontmatter tokens, 11 named rules,
  and the eight canonical sections.
- `.impeccable/design.json` regenerated: 9 self-contained component snippets, tonal ramps,
  motion and shadow tokens.
- Recorded `overused-font: Geist` as an approved exception in `.impeccable/config.json`,
  since Geist was explicitly pinned by the brief.

### Verification

- Design detector: **43 findings → 0**.
- Contrast sweep across all rendered text: **0 failures**.
- `tsc --noEmit`: clean. `npm run build` (client + server): clean.
- Inspected at 1280px desktop and 390px mobile.

---

### Notable behaviour changes

- **Severity colour is gone.** Scanning a long suite for "the red ones" no longer works;
  you now scan for solid squares. This follows directly from the four-colour palette
  constraint. If hue-coded severity matters more than palette purity, that decision should
  be reversed deliberately.
- **Sidebar descriptions were kept but de-emphasised** (11px, faint). They are content, not
  chrome, so they were not deleted.

### Known issues, not addressed

- Opening a run from **Previous runs** highlights **New analysis** in the rail. This is
  pre-existing navigation logic (`results` is treated as a child of `new`), not a
  presentation issue, and changing it would alter behaviour beyond this brief.
- The dead trading-template files (`PriceChart`, `TradeCard`, `TrendAnalysis`,
  `ControlPanel`, `NavLink`, `mockData`, `workspaceStorage`) still exist and now reference
  utilities that no longer exist. Nothing imports them, so they do not build or render.

### Asset you must replace

`og:image` / `twitter:image` in `index.html` still point at a hosted screenshot of the
**previous** design. Replace with a capture of the current interface — marked with a `TODO`
in the file.
