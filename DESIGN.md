---
name: Test Case Generator
description: A filed specification — beige index stock, white spec sheets, one ink blue, set in Geist.
colors:
  stock: "#E9E4D8"
  stock-sunk: "#DFD9CD"
  stock-edge: "#C9C0B1"
  paper: "#FFFFFF"
  paper-sunk: "#FAF8F5"
  ink: "#14161A"
  ink-soft: "#42454D"
  ink-faint: "#5A5F68"
  rule: "#E3DFD9"
  rule-strong: "#C9C4BA"
  blue: "#1B46C5"
  blue-deep: "#13309A"
  blue-wash: "#EEF1FC"
  blue-line: "#C5CDE7"
  destructive: "#B22E24"
typography:
  title:
    fontFamily: "Geist, system-ui, -apple-system, sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.024em"
  heading:
    fontFamily: "Geist, system-ui, -apple-system, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.024em"
  subheading:
    fontFamily: "Geist, system-ui, -apple-system, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.014em"
  body:
    fontFamily: "Geist, system-ui, -apple-system, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "0em"
  bodySmall:
    fontFamily: "Geist, system-ui, -apple-system, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0em"
  label:
    fontFamily: "Geist, system-ui, -apple-system, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.075em"
rounded:
  none: "0px"
  sm: "2px"
  md: "3px"
  lg: "4px"
  xl: "5px"
  2xl: "6px"
  3xl: "8px"
  full: "9999px"
spacing:
  xs: "6px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0 14px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.blue-deep}"
  button-primary-disabled:
    backgroundColor: "{colors.stock-edge}"
    textColor: "{colors.ink-faint}"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
    height: "32px"
  sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "0px"
  section-rule:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-faint}"
    typography: "{typography.label}"
    padding: "12px 24px"
  title-block-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "14px 20px"
  register-row:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "16px 24px"
  register-row-active:
    backgroundColor: "{colors.blue-wash}"
    textColor: "{colors.ink}"
  tab-rest:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    padding: "12px 12px 12px 16px"
  tab-active:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "12px 12px 12px 16px"
---

# Design System: Test Case Generator

## Overview

**Creative North Star: "The Specification Binder"**

QA coverage is filed, not fed. The interface is a ring binder of technical specifications: beige index stock holds the tabs, white sheets hold the work, and a single ink blue does every job that ink blue does in a printed spec — rules a section, marks the pulled tab, numbers a procedure step, and flags what is critical. Nothing floats, nothing glows, nothing is translucent. A surface is either stock or sheet, and you always know which one you are looking at.

The register is **precise and instrumental**. Hierarchy comes from weight and rule placement rather than from size, color, or elevation: the largest type on any screen is 26px, and it earns its authority by being the only 600-weight thing above 17px. Secondary information is not made quiet by graying it into illegibility — every text color in this system was measured against the beige stock, not just against white, because stock is the darkest ground secondary text ever sits on.

This world deliberately refuses two neighbours. It is not the dark AI-tool dashboard with a neon accent and a sparkle icon, and it is not the warm-cream editorial calm it replaced — an aesthetic that put a 48px literary serif over a gradient field and asked a QA engineer under deadline to admire it. The binder answers the same content with flat value separation, hairlines, and tabular numerals.

**Key Characteristics:**
- Two grounds only: beige stock and white sheet, separated by value and a hairline
- One accent — ink blue — carrying rules, tabs, step numbers, and priority alike
- Weight and rule position carry hierarchy; size range is deliberately narrow
- Priority encoded by fill density, not hue, so it survives monochrome and colour-blind reading
- Radii of 2–8px, no translucency, no gradient, one near-invisible shadow

## Colors

Four materials: the beige stock a document is filed on, the white sheet it is printed on, the black it is set in, and the one blue the press adds.

### Primary
- **Ink Blue** (`#1B46C5`): The only accent. It rules a section, fills the pulled tab marker, numbers a procedure step, marks High priority, and fills the single primary action. Nothing else in the interface is chromatic.
- **Blue Deep** (`#13309A`): The pressed and hovered state of any blue surface.
- **Blue Wash** (`#EEF1FC`): The selected row. The palest possible tint that still reads as "this one", used on the active test case and hovered register rows.
- **Blue Line** (`#C5CDE7`): Blue at rule weight, for the rare divider that must read as part of the accent rather than as neutral structure.

### Neutral — stock
- **Stock** (`#E9E4D8`): The page ground. Every sheet is filed on this; it is never a content surface itself.
- **Stock Sunk** (`#DFD9CD`): The index rail. One step deeper than the page so the tabs read as a separate physical part.
- **Stock Edge** (`#C9C0B1`): Tab and rail edges, and the disabled fill of the primary action.

### Neutral — sheet
- **Paper** (`#FFFFFF`): The working surface. All content lives here.
- **Paper Sunk** (`#FAF8F5`): A recessed band inside a sheet — the footer that holds an action, the hovered list row, the drop target at rest.
- **Rule** (`#E3DFD9`): The hairline. Every division in this system is this colour at 1px.
- **Rule Strong** (`#C9C4BA`): The dashed drop edge and the outline button border.

### Neutral — ink
- **Ink** (`#14161A`): Headings, titles, and any value the eye must land on.
- **Ink Soft** (`#42454D`): Running body copy. 9.6:1 on paper, 6.8:1 on stock.
- **Ink Faint** (`#5A5F68`): Labels, meta, timestamps, counts. 6.4:1 on paper, 4.6:1 on stock — the floor, and the reason this value is not lighter.
- **Destructive** (`#B22E24`): Reserved for the destructive hover on a remove control. Never used for priority.

### Named Rules

**The Two Grounds Rule.** A surface is stock or it is sheet. There is no third ground, no translucency between them, and no gradient inside either. If you need a new level, recess to Paper Sunk — do not invent a tint.

**The One Ink Rule.** Blue is the only chromatic value in the interface. Priority, status, success, and warning must all be expressed in ink weight, fill density, or position. The moment a second hue appears, the blue stops meaning anything.

**The Measured-On-Stock Rule.** Every text colour is verified against Stock Sunk, not against white. Stock is the darkest ground secondary text sits on, so it sets the contrast floor for the whole system.

## Typography

**Face:** Geist (with system-ui, -apple-system, sans-serif) — variable, weights 100–900, loaded 100..900.

**Character:** One engineered grotesque doing every job. Geist has the neutral, slightly technical letterform of a modern specification document and enough weight range to carry hierarchy without changing size much. There is no second face: a spec binder is typeset in one family, and the discipline is the point.

### Hierarchy
- **Title** (600, 26px, 1.15, −0.024em): The name of the view — "New analysis", "Previous runs", "Knowledge base". One per sheet.
- **Heading** (600, 24px, 1.15, −0.024em): The generated feature name on a results sheet.
- **Subheading** (600, 17px, 1.35, −0.014em): The selected test case title in the detail pane.
- **Body** (400, 13px, 1.625): All running copy, rationales, procedure steps, list titles (at 500), and button labels. Measure capped at 68ch.
- **Body Small** (400, 12px, 1.55): Excerpts, secondary meta, back links.
- **Label** (500, 11px, 0.075em, uppercase): Section rules, title-block field names, priority marks, counts.

Numerals are tabular wherever they align in a column: title-block values, register counts and dates, case indices, step numbers.

### Named Rules

**The Narrow Range Rule.** The whole system lives between 11px and 26px. If something needs more emphasis, it gets more weight or a rule above it — never a larger size. A 48px display would break the binder immediately.

**The One Family Rule.** Geist sets everything, including numerals and labels. Do not introduce a mono face to signal "technical" — tabular numerals already do that job, and a second family would make this a different document.

**No Eyebrows.** A small tracked label never sits above a heading to introduce it. Labels mark *regions* — a section rule, a title-block field — and always stand alone with no heading beneath them. Headings carry their own weight.

## Layout

A two-part shell: the index rail on stock at the left, and the sheet canvas filling the rest. The canvas carries a 48px header bar on white holding the rail toggle and a single line of orientation copy; everything below is stock ground with sheets laid on it at 20px padding, stepping to 32px at the medium breakpoint.

Sheets are centred in wells sized to their density: 4xl (56rem) for the single-column analysis form and empty states, 5xl (64rem) for the register, the knowledge base, and results. Sheets stack with a 16px gap.

Inside a sheet, structure is horizontal bands separated by full-bleed hairlines: a header band, one or more ruled section bands, and sometimes a recessed footer band carrying the action. Bands are padded 24px horizontally and 16–20px vertically. This is the system's primary composition device — a sheet is a stack of ruled bands, not a grid of cards.

Two grids recur. The **title block** is a 4-across metadata strip (2-across below `sm`) with dividers on every edge. The **coverage split** is an asymmetric master–detail at `1fr / 1.15fr` from `lg`, weighted toward the detail pane; below `lg` it stacks, list first.

### Named Rules

**The Ruled Band Rule.** Sheets divide into full-bleed horizontal bands separated by 1px rules. Never nest a bordered box inside a sheet to group content — add a band and rule it.

**The Asymmetric Split Rule.** The master–detail split favours the detail side. Reading a case matters more than choosing one.

## Elevation & Depth

**This system is flat.** Depth is value separation plus a hairline: a white sheet on beige stock with a 1px rule around it is already unambiguously "above". There is no translucency, no backdrop blur, and no gradient anywhere in the interface.

One shadow exists, and it is close to invisible by design — a 1px offset with a 2–3px blur at 4–5% ink. Its only job is to keep the sheet's bottom edge from dissolving into the stock at low display gamma. It never grows, never stacks, and never signals state.

### Shadow Vocabulary
- **Sheet** (`0 1px 2px 0 rgb(20 22 26 / 0.05), 0 1px 3px 0 rgb(20 22 26 / 0.04)`): Every sheet. Unchanged, everywhere.

### Named Rules

**The Flat Rule.** State is signalled by fill and rule, never by elevation. Hover changes background; selection changes background; nothing lifts.

## Shapes

Tight and rectilinear. The radius scale runs 2 / 3 / 4 / 5 / 6 / 8px, and the working values are 4px for sheets, buttons, and the drop target, and 2px for the small priority mark. Nothing is a pill: badges were removed from this system entirely, and the fully-round value survives only for genuinely circular affordances.

The scale is declared end to end in the theme. The previous theme raised `sm`/`md`/`lg` above the framework's untouched `xl`, which made `rounded-xl` *smaller* than `rounded-lg`; every step is now explicit so the ordering cannot invert again.

Two recurring marks: a **3×10px blue tick** that opens a section rule and marks the pulled tab, and an **8px square** whose fill density encodes priority. Borders are 1px everywhere. The only dashed edge in the system is the PRD drop target.

### Named Rules

**The Dashed-Means-Drop Rule.** A dashed border appears on exactly one thing: a surface that accepts a file.

**The No-Pill Rule.** Status and metadata are set as type with a mark beside them, not as filled rounded capsules. A pill in this interface is a foreign object.

## Components

### Buttons
- **Primary:** Ink Blue fill, white label, 4px radius, 36px tall, 13px/500. Hover deepens to Blue Deep. Disabled takes a Stock Edge fill with Ink Faint text at full opacity — a deliberate flat state, never a faded blue.
- **Outline:** White fill, Rule Strong border, ink label, 32px at `sm`. Hover moves border and label to blue.
- **Ghost:** No fill at rest, Paper Sunk on hover. Used for the destructive Remove control, which moves to Destructive on hover.
- **Focus:** 2px blue ring at 2px offset on every variant.

### Sheet
The system's only container. White, 4px radius, 1px Rule border, the Sheet shadow. Contains ruled bands; never contains another bordered container.

### Section rule
A band header: a 3×10px blue tick, then an 11px uppercase label at 0.075em, on a 12px vertical band closed by a hairline. Marks a region. Never introduces a heading.

### Title block
A divided metadata strip at the head of a results sheet — field label above value, 4 across, dividers on all internal edges, values in tabular numerals and truncated with a title attribute. This is a record header, not a stats row: it carries identity fields (document, date) alongside counts, and no field is visually promoted above the others.

### Register row
The previous-runs list. A zero-padded index in a fixed 24px column, the document name at 13px/500, an excerpt beneath at 12px, and a right-aligned tabular group of counts and date that hides below `sm`. Rows divide with hairlines and wash blue on hover.

### Index tab
Rail navigation. Each tab is a band, not a card: a 3px blue marker that appears only when pulled, a 16px icon, a 13px label with a right-aligned count, and a 11px description. The active tab takes the white Paper fill and pulls a pixel to the right to sit over the rail's edge — the binder-tab gesture. Rest state is transparent on stock; hover is a light stock wash.

### Priority mark
An 8px square plus an 11px uppercase word. **High** is a solid blue square with blue text; **Medium** is a 40%-blue square with soft ink text; **Low** is a hollow square with a Rule Strong border and faint ink text. Fill density is the encoding, so the scale reads correctly in greyscale and to a colour-blind reader.

### Procedure list
Ordered steps as a blue tabular numeral in a fixed 24px column beside 13px body text capped at 68ch. No chips, no numeral circles, no row fills.

### Inputs
The product still has no visible text input; file entry runs through hidden native inputs behind the drop target and buttons. Design one deliberately when a real field is first needed rather than inheriting the unused library primitive.

## Do's and Don'ts

### Do:
- **Do** build a sheet as a stack of full-bleed ruled bands.
- **Do** keep every chromatic decision on the single Ink Blue.
- **Do** encode priority, status, and severity by fill density or weight.
- **Do** verify text colours against Stock Sunk, not only against white.
- **Do** use tabular numerals for anything that aligns in a column.
- **Do** hold the type range between 11px and 26px, and reach for weight when you need emphasis.
- **Do** keep radii at 4px for surfaces and controls.

### Don't:
- **Don't** introduce translucency, backdrop blur, or a gradient. The world is flat by construction.
- **Don't** put a small tracked label above a heading. Labels mark regions and stand alone.
- **Don't** add a second accent hue, or reintroduce hue-coded severity.
- **Don't** nest a bordered box inside a sheet — add a ruled band instead.
- **Don't** use pills or capsules for status or metadata.
- **Don't** signal state with elevation; change fill or rule.
- **Don't** add a monospace face to look technical. Tabular Geist already is.
- **Don't** let a display size above 26px into the interface.
- **Don't** reintroduce `--bullish`, `--bearish`, `--neutral`, or `--confidence` — inherited scaffold tokens with no consumer, removed with this world.
