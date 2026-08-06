# 0008 — Visual system: "The Specification Binder"

**Status:** Accepted
**Date:** 2026-08-02 *(recorded retrospectively 2026-08-05)*

## Context

The interface inherited a scaffold aesthetic that had drifted into a warm-cream editorial
look: a 48px literary serif over a layered gradient field, frosted translucent cards on a
very soft deep shadow, 24px radii, a dark navy sidebar, and pastel hue-coded severity.

A redesign was requested with a pinned brief: **Geist**, a **beige / white / blue / black**
palette, and a **minimalist, professional** register, with explicit instruction to adjust
weight, colour, transparency, and shape.

## Decision

Replace the visual world with **"The Specification Binder"** — beige index stock, white
spec sheets, one ink blue for rules and priority, near-black Geist. Depth comes from value
separation and hairlines; there is no translucency and no gradient.

Full system: [../../DESIGN.md](../../DESIGN.md). Machine-readable tokens and component
snippets: `.impeccable/design.json`.

The direction contract is recorded as an HTML comment in `index.html` and survives into the
production build, so the reasoning is auditable from the shipped artifact.

## Notable consequences

**Severity is no longer hue-coded.** The rose/amber/emerald trio could not survive a
four-colour palette. Priority is now encoded by **fill density** — solid, half, hollow.

This was a genuine trade. Scanning a long suite for "the red ones" no longer works. In
exchange the scale survives greyscale printing and colour-blind reading, which the previous
system did not. Given a suite is now 18–28 cases rather than 5, density scanning matters
more than it did.

**Eyebrow labels were removed** — four small tracked labels above headings. Headings carry
themselves. Small tracked labels survive only where they mark a region and stand alone.

**A live radius bug was fixed.** The previous theme raised `sm`/`md`/`lg` to 12/14/16px but
left `xl` at the framework default of 12px, making `rounded-xl` *smaller* than `rounded-lg`.
The scale is now declared end to end so it cannot invert again.

**A contrast failure was fixed.** Secondary text measured 3.15:1 against the beige rail and
4.42:1 on white — below the 4.5:1 floor in both cases. Every text colour is now specified
against the beige stock, not white, because stock is the darkest ground secondary text sits
on. A programmatic sweep of every text node reports zero failures.

**The invisible sidebar title was fixed** — `text-foreground` on a near-black rail. Inverting
the rail to beige resolved it by construction rather than by patch.

## Open divergence

The confirmed component character is "crisp and technical," but the implemented radii are
softer than that reads. `DESIGN.md` documents the built values as normative and records the
gap rather than asserting a change that was not made.

## Trade-off accepted

We traded a distinctive, atmospheric look for a disciplined, information-dense one. The
previous world was more memorable; this one is more legible at 18–28 cases per suite and
more defensible for a professional QA audience. The brief pinned the direction, and the
brief wins.

## Revisit when

- The product acquires a marketing surface — a landing page is a different mode and should
  not inherit the workspace's restraint wholesale.
- Suites routinely exceed ~30 cases, at which point density needs re-testing.
- The "crisp and technical" divergence above is deliberately closed or abandoned.
