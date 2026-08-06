# 0009 — Which data model is authoritative

**Status:** Accepted
**Date:** 2026-08-05

## Context

Three data models exist in this project's history, and `PRODUCT.md` recorded the conflict
between them as an unresolved open decision. This record closes it.

**1. The ideated model** — five normalised tables (`features`, `documents`,
`generation_runs`, `generated_test_cases`, `generated_test_steps`) specified in the original
technical specification for "when the system graduates to durable storage." Never built.
Recorded in full at [../original-product.md §8](../original-product.md#8-the-intended-durable-data-model).

**2. The implemented model** — two tables, `knowledge_base_documents` and `test_runs`, the
latter storing the entire suite as a JSON blob. Built during the SQLite phase. Being
deleted in v1.

**3. The v1 model** — no server tables. IndexedDB for knowledge-base documents, localStorage
for run history, both namespaced by Google `sub`.

## Decision

**The runtime contract is authoritative, not any storage schema.**

`GeneratedSuite` in `src/lib/testCaseTypes.ts` — shared by client and server — is the
stable object. Storage schemas are serialisation choices beneath it and may change per
version without changing the product.

Concretely:
- **v1 storage authority:** the browser layer (model 3).
- **Restore-path authority:** the ideated five-table model (model 1), *not* the two-table
  implementation.

## Why the ideated model wins the restore path

The two-table implementation stored each suite as an opaque JSON blob. That is fine for
"render it back" and useless for anything else: you cannot query for all High-criticality
cases across runs, count coverage-area distribution, measure whether a prompt change
improved output, or diff two runs of the same PRD.

The five-table model decomposes cases and steps into rows and carries `model_name` and
`prompt_version` on `generation_runs` — the traceability fields the implementation lacked
entirely. Without them a suite cannot be attributed to the prompt that produced it, which
makes prompt quality unmeasurable.

## Consequences

- The two-table schema is **not** carried forward. It is recorded in git history and in
  [../v1-scope.md](../v1-scope.md) for reference only.
- v1 browser records should carry `modelName` and `promptVersion` now, even though nothing
  reads them yet. They are cheap to add and impossible to backfill.
- Any future server persistence builds the five-table model, keyed by Google `sub`.
- `coverageArea` is now a closed enum ([0007](0007-generation-prompt-contract.md)), so the
  ideated `coverage_area VARCHAR(128)` should become a constrained type or lookup table.
- Suites generated before the enum contain free-text values and would fail a fresh Zod
  parse. Any future import must tolerate or normalise them.

## Trade-off accepted

We accept that v1's storage is a dead end architecturally — browser records will need
transforming, not migrating, if server persistence returns. That is acceptable because the
volume is small and the restore path includes a one-time per-user import
([../v1-scope.md §3.1](../v1-scope.md)).

## Revisit when

Server-side persistence is reinstated. At that point this record should be superseded by
one that documents the schema as actually built.
