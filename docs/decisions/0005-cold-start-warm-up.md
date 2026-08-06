# 0005 — Warm the backend with a health ping on landing

**Status:** Accepted
**Date:** 2026-08-05

## Context

Render free web services spin down after roughly 15 minutes of inactivity. The next request
triggers a cold start measured in tens of seconds. Layered on top of a generation that
already takes 60–180 seconds, a returning user's first action could take three minutes with
no clear explanation.

The frontend is on Vercel and loads instantly regardless, so the problem is confined to the
first API call.

## Options considered

**A. Accept it and communicate honestly.** Zero effort, poor experience.

**B. Ping `GET /api/health` when the user lands, before they act.** **Chosen.** The wake
overlaps with sign-in and file selection — time the user is spending anyway.

**C. External cron pinging every 10 minutes to prevent spin-down entirely.** Effective, and
the arithmetic works: Render allows 750 instance-hours per month against a ~730-hour month,
so one always-awake service fits inside the free allowance. **Rejected on principle** — it
deliberately defeats a constraint the free tier is designed around, and consumes the entire
monthly allowance to do it. If the service genuinely needs to be always-on, the honest
answer is a paid instance.

**D. Paid always-on Render instance.** ~$7/month. Rejected under the zero-cost constraint,
but this is the correct fix and the first thing to buy when the product has real users.

## Decision

Fire a fire-and-forget `GET /api/health` as early as possible in the frontend lifecycle —
in `main.tsx` before React mounts, not in a component effect.

The endpoint already exists and returns `{ "status": "ok" }`, so this requires **no backend
change at all**.

The sequencing works especially well alongside [0003](0003-google-identity-services.md):
Google sign-in adds 15–45 seconds of genuine user activity, which is dead time the cold
start hides behind. The two decisions compound.

## Consequences

- **The ping itself will hang** for the full duration of the cold start. It must never be
  awaited on the render path, and its failure must never surface a toast or error state.
  It is a side effect, not a dependency.
- **It overlaps the wait; it does not remove it.** A user who is already signed in with a
  file ready can still outrun the wake.
- The loading state must therefore still handle a cold generate honestly — "waking the
  server" is a more truthful message than an indefinite spinner.
- No measurable cost. One extra request per session against a static endpoint.

## Trade-off accepted

We accept that some users still wait, in exchange for a mitigation that costs nothing and
respects the platform's terms. We explicitly decline the keep-alive cron, which would hide
the problem more completely but by circumventing the free tier's design rather than by
paying for what we need.

## Revisit when

- Users report slowness despite the ping → buy the paid instance (option D).
- The backend moves to a platform without spin-down → delete this entirely.
