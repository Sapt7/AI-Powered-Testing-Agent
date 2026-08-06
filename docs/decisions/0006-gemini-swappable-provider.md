# 0006 — Gemini is the implementation, not a commitment

**Status:** Accepted
**Date:** 2026-08-03 *(recorded retrospectively 2026-08-05)*

## Context

The product generates test cases with Google's Gemini API (`gemini-2.5-flash`). During the
product interview that produced `PRODUCT.md`, the question was put explicitly: is the model
provider a committed choice, or an implementation detail?

## Decision

**Gemini is the current implementation and is not a commitment.** The provider must remain
swappable.

`PRODUCT.md` records this under "Explicitly changeable — do not treat as commitments."

## Consequences

- Provider-specific concepts must not leak beyond the inference layer. Today they are
  confined to `server/services/geminiTestCaseService.ts`, which owns the client, the
  system instruction, the response schema, and the retry policy.
- The rest of the system speaks only `GeneratedSuite`, a provider-neutral type shared by
  client and server. Nothing outside the inference layer knows an LLM exists.
- Two schemas are maintained in parallel inside that file: the provider's response schema
  and a Zod schema for validation. They are hand-maintained and **can drift**. This is
  accepted cost — the Zod parse is the provider-independent contract and must remain the
  authority.
- A provider swap means rewriting one file. Structured-output support and the ability to
  express enums and `minItems` in a response schema are the features to check first.

## Trade-off accepted

We keep provider-specific tuning (temperature, response schema format, thinking behaviour)
in exchange for accepting that a swap means rewriting the inference layer rather than
changing a config value. A full provider abstraction was not built because there is exactly
one provider today, and speculative abstraction would obscure the prompt — which is the
part that actually determines quality.

## Related cost note

The provider decision and the spend decision are separate. See
[0004](0004-open-signup.md) for how usage cost is bounded.

## Revisit when

- Gemini pricing, rate limits, or availability change materially.
- Output quality plateaus and a different model is worth evaluating.
- A customer requires a specific provider, or requires that no data reach Google.
