# 0011 — Visual system: "The Test Section"

**Status:** Superseded by [0012](0012-visual-system-workbench.md)
**Date:** 2026-10-22
**Supersedes:** [0008](0008-visual-system.md)

## Context

[ADR-0008](0008-visual-system.md) shipped "The Specification Binder" — Geist, a pinned
beige/white/blue/black palette, flat surfaces, hairlines, 2–8px radii. It was disciplined and
legible, and the product owner judged it **too basic**: it did not feel like a product worth
showing.

A redesign was requested with every pin released — palette, type, structure, and copy all
open — and "amazing" to land evenly across sign-in, workspace, results, and history.

## Options considered

The direction roll (seed `1d3ddec9`, operate mode) ranked seven grounded worlds from a QA
engineer's culture: crash-test lab, radiography light table, pre-flight checklist, **wind
tunnel test section**, hazard signage, oscilloscope bench, and the neutral SaaS dashboard
(the category rut, capped at one candidate). The roll assigned **#4**.

Dealt challengers, weighed on audience identification and product clarity:

- **Split-flap departures board** — a thrilling arrival moment, but matte-black-and-amber
  drifts into the dark AI-dashboard cliché, and QA engineers do not live in stations.
- **Jet-age ticket wallet** — superb print craft, but its grammar is *validated / used /
  void*: execution states this product does not track. Fuses poorly.
- **Category standard** (polished conventional SaaS) — offered as the standing exit.

The product owner chose the assigned direction.

## Decision

Adopt **"The Test Section"**: testing a PRD is a wind-tunnel run. Full system in
[../../DESIGN.md](../../DESIGN.md).

The metaphor holds because every element maps to real behaviour:

| Tunnel | Product |
|---|---|
| Model on the sting | The mounted PRD |
| Honeycomb flow-straightener | The knowledge base conditioning every run |
| Smoke streamlines | The run in progress |
| Manometer board | Case count per coverage area, stacked by severity |
| Dry tube | A coverage area the run never reached |
| Tunnel lamp | The backend's real cold-start state |

## Consequences

**Gained**
- **Coverage gaps are visible at a glance.** The manometer board shows dry areas before a
  single case is read — information the previous design required scanning the full list for.
- **The board is an interface, not a chart.** Each tube filters the case list.
- **Cold starts became honest.** The tunnel lamp reports checking / spinning up / online /
  unreachable, instead of an unexplained wait.
- **Severity colour returned**, paired with fill height so it still reads in greyscale.
  ADR-0008's fill-only encoding was forced by its four-colour pin; that constraint is gone.
- Opening a run from *Previous runs* now keeps that section lit — a navigation quirk carried
  since the first implementation.
- PRDs can be dragged onto the test section.

**Costs**
- More motion and more rendering: two dozen animated SVG paths on the main surfaces.
  Bounded (CSS dash animation, `prefers-reduced-motion` respected), but heavier than flat.
- The manometer board needs 540px and scrolls inside its own container on phones.
- Two new web fonts (Archivo variable, JetBrains Mono) replace one.
- Yellow carries two roles — the run button's fill on daylight, and the "engaged" lamp on
  graphite. Facility-true, but it must stay disciplined or it stops meaning anything.

## Trade-off accepted

We trade the previous system's restraint for a world with a point of view, and spend that
expressiveness on instruments that carry real data rather than on decoration. The test that
must keep passing: **if an element shows no real information, it does not belong**.

## Revisit when

- The product gains a marketing surface — that is Persuade mode and should not inherit the
  workspace wholesale.
- Suites routinely exceed ~30 cases per area, at which point the tube scale needs re-testing.
- Performance budgets tighten on low-end devices — the streamline density is the first lever.
