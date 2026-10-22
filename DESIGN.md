---
name: AI Powered Testing Agent
description: A wind-tunnel test section for PRDs — facility daylight, graphite windows where the flow is visible, safety yellow to start a run, manometer fluids for severity.
colors:
  facility: "#E8EAE6"
  facility-deep: "#DBDDD9"
  panel: "#F8F8F6"
  line: "#D1D4CE"
  line-strong: "#B3B6AF"
  graphite: "#14161A"
  graphite-2: "#1D2126"
  graphite-3: "#282D34"
  graphite-line: "#363C45"
  ink: "#101418"
  ink-2: "#3C4149"
  ink-3: "#595B5F"
  flow: "#EEF2F7"
  flow-2: "#B2BCC7"
  flow-3: "#8793A1"
  safety: "#F5C219"
  safety-deep: "#DBA400"
  fluid-high: "#E0402E"
  fluid-med: "#E99A1C"
  fluid-low: "#307FD5"
  fluid-high-text: "#B42318"
  fluid-med-text: "#945100"
  fluid-low-text: "#1D5AA5"
typography:
  hero:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "72px"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.04em"
    fontVariation: "'wdth' 125"
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "56px"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.035em"
    fontVariation: "'wdth' 125"
  headline:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.025em"
    fontVariation: "'wdth' 118"
  subhead:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 118"
  lead:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "0em"
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 84"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "0em"
  small:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0em"
  placard:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 650
    lineHeight: 1
    letterSpacing: "0.09em"
    fontVariation: "'wdth' 68"
  data:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0em"
rounded:
  sm: "3px"
  md: "4px"
  lg: "6px"
  xl: "8px"
  2xl: "12px"
  3xl: "16px"
  full: "9999px"
spacing:
  xs: "6px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  2xl: "32px"
components:
  button-run:
    backgroundColor: "{colors.safety}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "0 24px"
    height: "48px"
  button-run-disabled:
    backgroundColor: "{colors.facility-deep}"
    textColor: "{colors.ink-3}"
  button-outline:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
    height: "32px"
  button-graphite:
    backgroundColor: "{colors.graphite-2}"
    textColor: "{colors.flow}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "40px"
  test-window:
    backgroundColor: "{colors.graphite}"
    textColor: "{colors.flow}"
    rounded: "{rounded.2xl}"
  panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
  rail-item-active:
    backgroundColor: "{colors.graphite-3}"
    textColor: "{colors.flow}"
    rounded: "{rounded.lg}"
    padding: "10px"
---

# Design System: AI Powered Testing Agent

## Overview

**Creative North Star: "The Test Section"**

Testing a PRD is a wind-tunnel run. The document is the model on the sting; the knowledge
base is the honeycomb that conditions the flow before it arrives; generation is the run,
with smoke streamlines made visible; and the result is read off a manometer board — a bank
of fluid tubes, one per coverage area, that shows at a glance which areas are full, thin, or
**dry**. The metaphor is not decoration: every element maps to something the product does.

The facility has two lights. **Daylight** — painted-concrete grey working surfaces where a
QA engineer reads dense text for long stretches. **Graphite** — the test-section windows and
the instrument rail, where the flow is made visible and the product's moments happen. The
two never blend: a surface is either a daylight panel or a graphite window.

The register is industrial and exact, not atmospheric. Type is one engineered family scaled
across its *width* axis like facility signage — condensed placards, normal reading text,
expanded wall lettering. Measurements (case IDs, counts, timers, sizes, dates) are set in
mono because they are measurements. Yellow appears only where a facility would paint it.

This world replaced "The Specification Binder," a flat beige/blue minimalist system that
read as too basic. It refuses that flatness, and it refuses the neon-on-black AI dashboard.

**Key Characteristics:**
- Daylight panels for reading; graphite windows for the product's moments
- Live SVG streamlines that part around a mounted PRD and speed up during a run
- The manometer board: coverage gaps visible before a single case is read
- Archivo across its width axis as the whole type system; mono only for measurements
- Safety yellow as a fill for the one control that starts a run, and as the engaged indicator on graphite

## Colors

Facility grey and graphite as the two grounds, ink for reading, smoke for type on graphite,
safety yellow as the facility's attention colour, and three manometer fluids for severity.

### Primary
- **Safety Yellow** (`#F5C219`): Two roles, both facility-true. On daylight surfaces it is
  the **fill** of the single control that starts a run — never text on a light ground. On
  graphite it marks what is **engaged**: the active section's icon and lamp, a selected
  manometer tube, the elapsed-time readout during a run. Also the brand mark's ground.
- **Safety Deep** (`#DBA400`): The pressed edge of a yellow button.

### Neutral — daylight
- **Facility** (`#E8EAE6`): The page ground, with faint 96px poured-concrete seams.
- **Facility Deep** (`#DBDDD9`): Recessed controls, disabled run button, filter tracks.
- **Panel** (`#F8F8F6`): Daylight working panels.
- **Line / Line Strong** (`#D1D4CE` / `#B3B6AF`): Hairlines; outline-button and step-rail borders.
- **Ink / Ink 2 / Ink 3** (`#101418` / `#3C4149` / `#595B5F`): Headings, body, meta.

### Neutral — graphite
- **Graphite / 2 / 3** (`#14161A` / `#1D2126` / `#282D34`): Window glass, controls, raised items.
- **Graphite Line** (`#363C45`): Window and rail edges.
- **Flow / Flow 2 / Flow 3** (`#EEF2F7` / `#B2BCC7` / `#8793A1`): Smoke — streamlines and type on graphite.

### Manometer fluids — severity
- **High** — fluid `#E0402E`, text `#B42318`
- **Medium** — fluid `#E99A1C`, text `#945100`
- **Low** — fluid `#307FD5`, text `#1D5AA5`

Fluid values fill tubes and vials; text values are tuned to clear 4.5:1 on the facility
ground. On graphite, lighter tints of the same hues are used for text.

### Named Rules

**The Two Lights Rule.** A surface is a daylight panel or a graphite window. Do not tint a
panel grey-blue or lighten a window toward panel — the contrast between them is the layout.

**The Yellow Is Paint Rule.** Yellow is a fill or a lamp, never running text on a light
ground. One yellow-filled control per surface, and it starts a run.

**The Fluid Rule.** Red, amber, and blue mean High, Medium, Low severity — always paired with
fill height (the vial) so the scale still reads in greyscale and to colour-blind users.

## Typography

**Face:** Archivo (variable: `wdth` 62–125, `wght` 100–900) · **Data:** JetBrains Mono

**Character:** One engineered grotesque doing every job by changing *width*, the way facility
signage scales from equipment labels to wall lettering. Mono is reserved for values that are
measured or identified — never as a costume for "technical".

### Hierarchy
- **Hero** (800, 72px, wdth 125): The product name on sign-in only.
- **Display** (800, 56px / 40px mobile, wdth 125): Page titles — "New analysis", "Previous runs".
- **Headline** (800, 40px / 28px mobile, wdth 118): The generated feature name in a run report.
- **Title** (700, 20px, wdth 84): The selected test case.
- **Body** (400, 14px, 1.625): Running copy, rationales, procedure steps. Measure ≤ 68ch.
- **Small** (400, 13px / 12px): Excerpts, meta, helper text.
- **Placard** (650, 11px, wdth 68, uppercase, 0.09em): Facility labels on instruments and regions.
- **Data** (JetBrains Mono, 12–13px, tabular, slashed zero): TC-001, R-002, counts, timers, sizes, dates.

Ramp: 11 · 12 · 13 · 14 · 16 · 20 · 28 · 40 · 56 · 72.

### Named Rules

**The Width Axis Rule.** Emphasis changes width and weight before it changes size. Condensed
labels, normal reading, expanded display.

**The Placard Rule.** Placards label instruments and regions — a window's chrome bar, a panel
header, a tube. They never sit above a heading as a kicker. A window's chrome bar carries
readouts alongside its placard and is separated from content by a rule.

**The Measurement Rule.** Mono for what is measured or identified. Prose is never mono.

## Layout

A graphite instrument rail (collapsible to icons; off-canvas below 768px) beside a daylight
facility. A 56px header carries a breadcrumb and the **tunnel lamp** (backend status). Content
sits in a 72rem well with 24–40px vertical padding.

Each page opens with an expanded display title and its lede beside it (stacked on mobile),
then a graphite window for the page's moment, then daylight panels for the work.

- **New analysis:** test-section window (PRD mount at centre) → Supporting context panel +
  Run sheet panel, `1.3fr / 1fr`, top-aligned.
- **Run report:** report window (title, summary, readout strip | manometer board) → three
  evidence panels → Coverage panel as master–detail `1fr / 1.2fr`.
- **Previous runs:** run log rows with a 12-tube coverage fingerprint per run.
- **Knowledge base:** flow-conditioning window (honeycomb) → documents panel.

The manometer board has a 540px minimum and scrolls inside its own container on narrow
screens. Its root must carry `min-w-0` or it widens the parent grid and overflows the page.

## Elevation & Depth

Two depths. **Panels** sit on the facility with a hairline, an inner top highlight, and a
soft drop (`0 10px 28px -16px` at 22% ink). **Windows** sit deeper (`0 28px 56px -28px` at
55% ink) with a 1px smoke inner edge — glass set into a wall. Inside a window, depth is light:
streamlines fade at the frame through a radial vignette, and the PRD card floats with a
graphite moat ring.

No glassmorphism, no gradient fields on daylight surfaces.

## Shapes

Industrial and generous at scale: windows 12px, panels 8px, controls 6px, small tags 3px.
The PRD mount is a 28px-radius capsule — the model on the sting. Manometer tubes are
round-topped glass with a meniscus highlight; dry tubes have a dashed outline. Severity vials
reuse the tube silhouette at 8×14px.

Hazard banding (yellow/graphite, 45°) appears in exactly one place: the top edge of the
run-in-progress window.

## Components

### Run button
Safety yellow fill, ink text, 2px darker bottom edge, 48px tall. Disabled is a flat facility
grey — never a faded yellow. Presses down 1px.

### Test window
Graphite, 12px radius, 44px chrome bar (placard left, readouts right, rule beneath).

### Streamline field
26–34 SVG paths displaced around a central body by `dy' = sign·√(dy² + H²·g(dx))` — smooth
everywhere, no kinks — plus a decaying wake downstream. Dash pulses with a fixed 200-unit
period loop seamlessly; golden-ratio phase offsets stop pulses aligning into columns.
Speeds ×3.2 during a run. Static under `prefers-reduced-motion`.

### Manometer board
Twelve tubes in coverage-area order (plus "Other" for pre-enum runs). Fluid stacked High →
Medium → Low from the bottom; height = case count on a shared scale. Fluids rise on arrival
with a 45ms stagger. Each tube is a toggle that filters the case list, with a full spoken
label ("Security: 2 cases — 1 high, 1 medium, 0 low"). Dry tubes are labelled as gaps.

### Tunnel lamp
Grey checking → pulsing yellow "spinning up" (after 1.5s without a reply) → green online →
red unreachable (after 2 minutes). Live region. Makes the free host's cold start honest.

### Rail item
Icon tile, label, hint, mono count. Active: raised graphite, yellow-tinted icon tile, a lit
6px lamp, yellow count badge.

### Coverage list and procedure
Mono case IDs, severity vial + label, coverage area in semi-condensed. Procedure steps are
numbered mono circles joined by a vertical rail.

## Do's and Don'ts

### Do:
- **Do** keep reading on daylight panels and put the product's moments in graphite windows.
- **Do** use yellow as paint: one run button per surface, or an engaged lamp on graphite.
- **Do** pair every severity hue with fill height.
- **Do** scale emphasis through Archivo's width axis before reaching for size.
- **Do** give any grid child containing a min-width instrument `min-w-0`.
- **Do** keep the metaphor mapped to real behaviour — every instrument shows real data.

### Don't:
- **Don't** set yellow text on a light ground.
- **Don't** invent progress: the run shows a real elapsed clock, not a percentage.
- **Don't** put a placard above a heading as a kicker.
- **Don't** use mono for prose.
- **Don't** add glass, neon glows, or gradient text.
- **Don't** reintroduce flat, borderless minimalism — that is the world this replaced.
