# 0010 — Version 1 ships non-commercial with best-effort spend controls

**Status:** Accepted
**Date:** 2026-08-06
**Amends:** [0002](0002-hosting-topology.md), [0004](0004-open-signup.md)

## Context

Two open risks were carried through the v1 build and are now settled by product decision.

**1. Vercel Hobby licensing.** [ADR-0002](0002-hosting-topology.md) recorded that Vercel's
Hobby plan is licensed for non-commercial use only, while `PRODUCT.md` names the product's
destination as "a product for other companies." It called this "the most likely reason this
decision gets revisited."

**2. Rate-limit durability.** [ADR-0004](0004-open-signup.md) made per-user limiting and a
global daily cap mandatory under open signup. Both were built, but their counters live in
process memory and reset on every restart or spin-down — frequent on a free instance.
Making them durable requires a datastore v1 deliberately does not have.

## Decision

**Version 1 is explicitly non-commercial.** It is a working product used and shared without
charge. The commercial destination in `PRODUCT.md` is unchanged, but it is not v1's problem.

**The existing spend controls are accepted as best-effort.** They ship as built. Their
reset-on-restart weakness is a known and accepted limitation, not a defect to fix before
launch.

## Consequences

**Resolved by this decision**
- Vercel Hobby is a legitimate choice for v1. The Cloudflare Pages fallback noted in
  ADR-0002 is not needed and should not be built.
- No durable rate-limit store is required. `createQuota`'s in-memory buckets stand.
- v1 can ship without the work ADR-0004 previously classified as mandatory.

**Newly load-bearing**
- **The Gemini billing budget and alert is now the primary spend protection, not a
  backstop.** The in-app caps were the first line of defence precisely because they were
  assumed to hold across restarts. They do not, and that is now accepted — so the billing
  alert is what actually bounds cost. It is no longer optional.
- Because signup remains open, an abuser who triggers restarts (or simply arrives after
  one) faces fresh counters. The realistic worst case is a spend spike caught by the
  billing alert rather than prevented by the limiter.

**Unchanged**
- Signup stays open to anyone with a Google account ([0004](0004-open-signup.md)).
- Authentication still bounds the abuse surface to people willing to sign in.
- All limits remain env-tunable, so tightening them needs no code change.

## Trade-off accepted

We trade enforcement strength for shipping speed, and cover the gap with a billing alert
that converts a runaway into a notification rather than an invoice. This is a reasonable
trade for a non-commercial v1 with a small audience. It would not be reasonable for a
product taking payment, which is exactly when it should be revisited.

## Revisit when

Any one of:
- The product is used commercially, or takes its first paying customer → Vercel licensing
  and durable limits both return as blockers, together.
- A billing alert actually fires → the limiter was insufficient; add a durable store
  (Upstash Redis free tier, or the database from [0001](0001-browser-scoped-persistence.md)).
- Usage grows beyond a handful of users → per-account quotas replace the global cap.
