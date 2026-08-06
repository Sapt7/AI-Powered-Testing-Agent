# 0002 — Vercel frontend + Render backend, no database

**Status:** Accepted
**Date:** 2026-08-05

## Context

The product must be publicly reachable at zero infrastructure cost. It is a Vite SPA plus
an Express API that performs long-running LLM calls and server-side document parsing.

Two hard technical facts constrain the choice:

1. **Generation takes 60–180 seconds.** A suite of 18–28 cases over up to 600,000
   characters of context is not a fast request.
2. **Parsing requires a real Node runtime.** `pdf-parse` and `mammoth` depend on Node APIs
   and Buffer; they are not safe to assume working on edge runtimes.

## Options considered

**A. Vercel for everything (SPA + serverless functions).** Rejected on the timeout. Vercel
Hobby caps function duration at roughly 60 seconds, which generation routinely exceeds.
Sixty seconds is not a limit that can be engineered around without splitting generation
into a polled background job — disproportionate for v1.

**B. Render for everything (Express serves the built SPA).** Viable and simpler: one deploy,
one origin, no CORS, no API base URL problem. Rejected on user experience — every asset
would sit behind Render's cold start, so the app shell itself would take ~50 s to appear
after idle. Splitting the frontend onto a CDN means the interface loads instantly and only
API calls wait.

**C. Cloudflare Workers + D1.** Attractive for its lack of cold starts and generous free
tier. Rejected because `pdf-parse` and `mammoth` are Node-centric and risky on the Workers
runtime; document parsing is core, not incidental.

**D. Fly.io.** Rejected: free allowances now require a card and are usage-billed, so "no
additional cost" cannot be guaranteed.

**E. Vercel (static SPA) + Render free web service (Express), no database.** **Chosen.**

## Decision

| Layer | Platform | Rationale |
|---|---|---|
| Frontend | Vercel | Static CDN, instant load, free on Hobby |
| Backend | Render free web service | No hard request timeout; real Node runtime |
| Database | none | See [0001](0001-browser-scoped-persistence.md) |

Requests are routed via a **`vercel.json` rewrite** mapping `/api/*` to the Render service,
in preference to a `VITE_API_BASE_URL` environment variable. The rewrite keeps the browser
on a single origin, which eliminates CORS handling and preflight latency entirely, and
leaves `src/lib/api.ts` unchanged with its existing relative paths.

## Consequences

- Render free spins down after roughly 15 minutes idle; cold start is tens of seconds.
  Mitigated, not solved, by [0005](0005-cold-start-warm-up.md).
- Render free provides 750 instance-hours per month — sufficient for one service.
- Render free instances have 512 MB RAM. Multer buffers uploads in memory, and `pdf-parse`
  on a large PDF can spike; a 15 MB upload plus extraction is a genuine OOM risk that
  should be load-tested before launch.
- The backend must bind to Render's injected `PORT`. `server/config.ts` already reads
  `process.env.PORT`, so leave it unset in the dashboard.
- Render's build command should be `npm ci && npm run build:server` — the full
  `npm run build` also builds the frontend, which Render does not serve.
- `"engines": { "node": ">=22" }` is no longer required once `node:sqlite` is removed, but
  pinning a Node version is still worth doing for reproducibility.

## Trade-off accepted

We accept a slow first request after idle in exchange for zero cost. The alternative that
removes cold starts entirely — a paid always-on instance — is roughly $7/month and should
be the first thing purchased if this ever gets real users.

## Known non-technical constraint

**Vercel Hobby is licensed for non-commercial use only.** `PRODUCT.md` records the product's
destination as "a product for other companies." The moment this is commercial, Vercel
requires a Pro plan (~$20/month). Cloudflare Pages carries no equivalent restriction and is
the natural substitute if that becomes a problem. This is a licensing constraint, not a
technical one, and it is the most likely reason this decision gets revisited.

> **Settled for v1 by [ADR-0010](0010-v1-non-commercial-best-effort-limits.md):** version 1
> is explicitly non-commercial, so Hobby is a legitimate choice and the Cloudflare fallback
> should not be built. This constraint returns the moment the product is commercial.

## Revisit when

- The product is used commercially → re-examine Vercel Hobby licensing.
- Cold starts generate user complaints → paid Render instance, or a platform without
  spin-down.
- Memory pressure causes failures on large PDFs → larger instance or streamed parsing.
