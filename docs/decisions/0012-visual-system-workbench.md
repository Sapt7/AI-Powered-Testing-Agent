# 0012 — Visual system: "The Workbench"

**Status:** Accepted
**Date:** 2026-10-22
**Supersedes:** [0011](0011-visual-system-test-section.md)

## Context

[ADR-0011](0011-visual-system-test-section.md) shipped "The Test Section" — a wind-tunnel
facility with live streamlines, a manometer board, and safety yellow. The product owner judged
it **not to the point**: the metaphor asked a QA engineer to learn a world before they could
use the tool. They named a reference — **lineaprompt.com** — asked for animation, and asked for
the product to be genuinely mobile-friendly and compatible across devices.

## Decision

Replace the visual system with **"The Workbench"**, a native-app product language
([DESIGN.md](../../DESIGN.md)):

- Cool blue-grey ground with soft top-left light; white windows (title bar + body) on deep,
  soft shadows; one indigo accent; IBM Plex Mono for measurements.
- **The platform's own typeface** (SF Pro / Segoe UI Variable / Roboto) — native on every
  device and zero font bytes. Replaces Archivo + JetBrains Mono.
- Solid indigo selection that glides between rows; `↑`/`↓`/`j`/`k` case navigation and
  `⌘↵`/`Ctrl↵` to generate.
- One hand-drawn underline (Flourish) per screen.
- Phone layout designed, not shrunk: glass top bar, bottom tab bar with safe-area padding,
  area chip rail, full-screen case sheet.
- Motion on one ease-out curve (rise, fade, pop, draw, glide, travel, breathe, shimmer); all
  disabled under `prefers-reduced-motion`.

The reference was **brief-pinned**, so it overrode the direction roll (seed `e85e233b`). What
was borrowed is grammar — calm windowed surfaces, solid selection, keyboard-first movement, a
single flourish — not content, copy, or branding.

## Consequences

- `src/components/tunnel/*` and `AppSidebar.tsx` are deleted; the new primitives live in
  `src/components/bench/` (`ui.tsx`, `AppShell.tsx`).
- The manometer board is replaced by a **Coverage** window: a 12-area sidebar (desktop) or chip
  rail (phone) that shows counts per area and greys out areas with no cases, so gaps stay
  visible.
- The cold-start status survives as a **status pill** (Connecting / Server waking up / Server
  online / Server unreachable).
- No behaviour, storage, auth, or API contract changed.

## Trade-offs

- **Less memorable, more usable.** A strong metaphor was traded for an interface that reads
  as familiar on first sight.
- **System fonts render slightly differently per OS.** Accepted: that is the point of a
  native language, and it removes a webfont dependency.
