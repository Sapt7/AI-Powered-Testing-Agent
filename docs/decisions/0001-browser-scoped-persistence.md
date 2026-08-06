# 0001 — Browser-scoped persistence for v1

**Status:** Accepted
**Date:** 2026-08-05

## Context

The product needs public hosting at zero infrastructure cost. The existing implementation
persists the knowledge base and run history in a local SQLite file via Node's `node:sqlite`,
at a hardcoded absolute path.

Two facts collide:

1. `PRODUCT.md` records the **retained knowledge base as a binding constraint** — the
   mechanism a competitor could not copy without building the same thing. Principle 2 is
   "context compounds."
2. Render's free tier has an **ephemeral filesystem**. Persistent disks are a paid add-on.
   A SQLite file there is destroyed on every deploy, restart, and wake-from-sleep.

Shipping SQLite to Render free would therefore delete the differentiator repeatedly, with
no error surfaced to the user — the worst possible failure mode for a trust-oriented tool.

## Options considered

**A. SQLite on a Render persistent disk.** Smallest code change — fix the hardcoded path
and deploy. Rejected: disks require a paid instance type, violating the zero-cost constraint.

**B. Free hosted Postgres (Neon).** Keeps full server-side persistence and unlocks
multi-device access. Rejected *for v1 only* on scope: it requires converting the entire
persistence layer from synchronous module-scope prepared statements to an async client,
rippling into three route files, plus SQL dialect changes. Correct destination, wrong
moment. **This is the restore path.**

**C. Turso / libSQL.** SQLite dialect, so `?` placeholders and existing SQL survive —
materially smaller diff than Postgres. Rejected for v1 because v1 needs no database at all;
retained as the cheapest option if persistence returns.

**D. Fully stateless, re-upload knowledge base every run.** Matches the original technical
specification exactly. Rejected: the user must re-attach supporting documents on every
generation, which destroys "context compounds" as a felt experience even though the
mechanism technically still works.

**E. Browser storage — IndexedDB for knowledge base, localStorage for run history.**
**Chosen.**

## Decision

Remove server-side persistence entirely. The backend becomes stateless. The browser retains:

- **IndexedDB** — knowledge-base documents including extracted text
- **localStorage** — run history

Both **namespaced by the Google `sub` claim** (see [0003](0003-google-identity-services.md)).

localStorage is not used for knowledge-base text. At 200,000 characters per document stored
as UTF-16, ten documents is roughly 4 MB against a typical 5 MB origin quota, before run
history — `QuotaExceededError` in ordinary use. Run history alone is small enough.

A new stateless `POST /api/parse` returns extracted text at upload time so parsing happens
once per document rather than on every generation.

## Consequences

**Gained**
- Zero database cost and zero database operations.
- Backend is stateless: any instance serves any request; redeploys are harmless.
- `node:sqlite` removed, so the Node 22+ requirement disappears and host compatibility widens.
- Roughly 300 lines deleted.

**Lost**
- Data does not follow a user across devices or browsers.
- Clearing site data destroys the knowledge base and history irrecoverably.
- No server-side audit trail or usage analytics.
- Rate-limit counters become in-memory and reset on restart.

**Required by this decision**
- `express.json({ limit })` must rise above 1 MB — the knowledge-base text payload at
  generation time approaches 600 KB before JSON escaping.
- The product must state plainly, in the UI, that data lives in this browser.
- A "clear stored data" control, since there is otherwise no escape hatch from a wedged
  IndexedDB.

## Trade-off accepted

We trade multi-device access and durability for zero cost and zero operations. This is
acceptable for v1 because the primary user is a QA engineer working at one desk, and the
alternative — silent data loss on Render's ephemeral disk — is strictly worse than honest
browser-scoped storage.

Note this is not a regression from the original design. The original technical specification
states "the MVP is intentionally lightweight and stateless" and defers persistence. v1
returns to that architecture and adds retention the original never had.

## Revisit when

Any one of:
- A user asks for their data on a second device.
- The product takes its first external customer.
- Someone needs to measure prompt quality across runs (requires a server-side corpus).
- Free hosted Postgres becomes cheaper to operate than the browser storage layer.
