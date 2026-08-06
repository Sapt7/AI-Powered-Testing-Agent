# 0007 — The generation prompt contract

**Status:** Accepted
**Date:** 2026-08-03 *(recorded retrospectively 2026-08-05)*

## Context

The original prompt asked for "at least 5 test cases" with "at least 3 steps," concatenated
into a single `contents` string alongside the documents. It produced thin, generic suites:
happy-path heavy, with steps like "verify the API response" that a tester cannot execute.

A rewritten prompt was authored to fix this. Adopting it surfaced conflicts with the output
schema that would have broken generation outright.

## Decision

Adopt the rewritten prompt, restructured as a **system instruction** separate from the
**user message** carrying the documents.

**Quality targets**
- 18–28 test cases, sized to the PRD's actual surface area; prune duplicates rather than pad
- 4–7 steps per case, 3 as an absolute floor
- No more than 25% on the happy path; at least four negative or failure-mode cases
- Expected results embedded in step text, because the schema has no expected-result field
- Concrete test data, never placeholders
- An explicit criticality rubric, with High capped near 30%
- A reasoning procedure — requirement inventory, knowledge-base reconciliation,
  first-principles derivation, blast-radius analysis, gap identification — before any JSON

**`coverageArea` is a closed enum of twelve values**, enforced in the provider response
schema and re-checked by Zod.

## Conflicts resolved during adoption

The rewritten prompt was written against an assumed schema, not the real one. Four fields
diverged:

| Issue | Resolution |
|---|---|
| Named `featureSummary`; schema has `shortSummary` | Renamed in the prompt |
| Never mentioned `featureName` (required) | Added to the prompt |
| Never mentioned `risks` (required, `.min(2)`) | Added a "Remaining schema fields" section |
| Never mentioned `sourceHighlights` (required, `.min(2)`) | Same |

`risks` and `sourceHighlights` were the dangerous pair: both are required with a minimum of
two entries **and** render as two of the three evidence columns on the results sheet. Had
they been omitted, validation would have failed, the retry would have failed identically,
and every generation would have hard-errored. This is the clearest example of why the
prompt and the schema must be reviewed together.

## Enforcement is layered deliberately

1. **Provider response schema** — types, required keys, enums, `minItems`. Structural
   guarantees the model cannot violate.
2. **Zod parse** — the provider-independent contract, and the authority.
3. **The prompt** — everything a schema cannot express: distribution, rubric, step quality,
   grounding discipline.

**The 18–28 range is deliberately not machine-enforced.** Setting `minItems: 18` would force
the model to pad, which the prompt explicitly forbids. A thin PRD should legitimately yield
fewer cases. The floor stays at 5; the range is a target.

## Retry policy

- **Schema failure** → one retry with the specific validation issues fed back. Second
  failure returns a clean error to the user.
- **Quality failure** (placeholder phrases, duplicate titles, mostly-thin cases) → one
  retry. These checks are **advisory**: if the retry does not improve matters, the
  schema-valid suite still ships. A regex false positive must never cost a user a good
  generation.

Each retry is a fresh single-turn call. The model never sees its own failed output — only
a description of what was wrong with it.

## Consequences

- Document limits were raised from 18,000 to 200,000 characters per document and 600,000
  combined. The old cap silently truncated real PRDs at roughly 4,500 tokens.
- **The PRD is never truncated to make room for knowledge-base context**; only the knowledge
  base is trimmed, and any truncation is declared to the model so it can flag under-coverage
  in `assumptions`.
- Cost per generation rose substantially with context size. See [0004](0004-open-signup.md).
- Suites generated before this change contain free-text `coverageArea` values and would fail
  a fresh Zod parse. History rendering does not re-validate, so they display correctly.

## Trade-off accepted

Longer, more expensive requests in exchange for suites a tester can actually execute. The
prompt is now large enough to be a maintenance object in its own right — it lives in
`server/services/geminiTestCaseService.ts` as `SYSTEM_PROMPT`.

## Revisit when

- Output quality regresses or the model changes.
- Cost per generation becomes the binding constraint → lower `maxCombinedChars` first.
- A prompt-versioning field is added to run records, making quality measurable across
  changes. See [../v1-scope.md §3.5](../v1-scope.md).
