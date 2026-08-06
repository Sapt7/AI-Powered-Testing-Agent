# 0004 — Open signup, and how spend is controlled without an allowlist

**Status:** Accepted
**Date:** 2026-08-05

## Context

[0003](0003-google-identity-services.md) puts a Google sign-in gate in front of the product.
A separate question remains: **who is allowed through it?**

This is the primary cost dial. The backend calls Gemini with up to 600,000 characters of
context per generation, which is roughly 150,000 tokens per request. Gemini's free tier has
rate limits; past them, usage is billed to the project owner.

## Options considered

**A. Email or domain allowlist via environment variable.** Effectively closes the cost risk
— only named people can spend. Rejected by product decision: it makes the product
un-demoable and un-shareable, which defeats the point of hosting it publicly.

**B. Invite codes.** Middle ground. Rejected: requires storing issued and redeemed codes,
and there is no database.

**C. Open — anyone with a Google account.** **Chosen.**

## Decision

Anyone with a valid Google account may sign in and use the product. No allowlist, no
invite gate.

## Consequences — read this part

**Authentication does not limit spend here; it only provides identity.** With open signup,
anyone in the world can create a Google account, sign in, and consume Gemini quota billed
to the project owner. An earlier analysis in this project concluded that adding auth
"largely resolves" the cost risk — **that conclusion assumed an allowlist and does not hold
under this decision.**

The abuse surface narrows from "anonymous internet" to "anyone willing to sign in," which
is a meaningful reduction in casual scraping but no protection against a determined or
automated abuser.

## Required mitigations

> **Amended for v1 by [ADR-0010](0010-v1-non-commercial-best-effort-limits.md):** items 1
> and 2 below are built but their counters reset on restart, and that weakness is accepted
> rather than fixed. Item 3, the billing budget, is therefore promoted from backstop to
> **primary** spend protection and is not optional.

These move from prudent to **mandatory** as a direct result of this decision:

1. **Per-user rate limiting** on `POST /api/generate-test-cases`, keyed by the Google `sub`
   claim rather than by IP. This is the expensive route; the others are cheap.
2. **A global daily generation cap** so that total spend has a hard ceiling regardless of
   how many users arrive. When the cap is hit, fail with an honest message rather than
   silently degrading.
3. **A billing budget and alert** on the Google Cloud project hosting the Gemini key. This
   is the backstop that turns an incident into a notification instead of an invoice.
4. **Reconsider `maxCombinedChars: 600_000`.** It was raised from 18,000 for correctness on
   large PRDs, and that reasoning stands for a private tool. For a public one, it is also
   the per-request cost multiplier. A lower public ceiling is worth considering.

Rate-limit counters are in-process and reset on restart or spin-down
([0001](0001-browser-scoped-persistence.md)), so they are a speed bump rather than a wall.
The global cap and the billing alert are the real protections.

## Trade-off accepted

We accept unbounded *user* growth and a bounded *spend* ceiling, enforced by a global cap
and a billing alert rather than by gatekeeping. The product stays shareable; the wallet
stays protected by a hard limit that degrades service rather than by refusing users.

The failure mode we are explicitly choosing: under abuse, legitimate users hit the global
cap and see "daily limit reached" — rather than the owner receiving an unexpected bill.

## Revisit when

- The daily cap is being hit by legitimate use → raise it, or introduce per-account quotas.
- Abuse is observed → allowlist, invite codes, or a paid tier.
- The product takes paying customers → per-tenant quotas replace the global cap entirely.
