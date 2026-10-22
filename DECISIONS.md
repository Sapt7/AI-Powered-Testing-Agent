# Decisions

Every architectural decision that shaped this product, with the trade-off each one accepted.

This file is the index. Full records — including the options considered and rejected — live
in [docs/decisions/](docs/decisions/). Each record states its context, the alternatives, the
decision, its consequences, the trade-off accepted, and a **revisit-when** trigger.

**Records are immutable once accepted.** A changed decision gets a new record that
supersedes or amends the old one; the old one is annotated, never rewritten. That is what
makes the reasoning auditable a year from now.

---

## The twelve decisions

| # | Decision | Trade-off accepted | Status |
|---|---|---|---|
| [0001](docs/decisions/0001-browser-scoped-persistence.md) | Browser-scoped persistence for v1 | Lost cross-device sync and durability; gained zero cost and zero operations | Accepted |
| [0002](docs/decisions/0002-hosting-topology.md) | Vercel frontend + Render backend, no database | Slow first request after idle, in exchange for $0 hosting | Accepted |
| [0003](docs/decisions/0003-google-identity-services.md) | Google Identity Services, verified server-side | ~30 lines of security-sensitive code we own, instead of a managed auth service | Accepted |
| [0004](docs/decisions/0004-open-signup.md) | Open signup, no allowlist | Unbounded users with a bounded spend ceiling — the product stays shareable | Accepted, amended by 0010 |
| [0005](docs/decisions/0005-cold-start-warm-up.md) | Warm the backend with a health ping on landing | Some users still wait; we declined the keep-alive cron that would hide it | Accepted |
| [0006](docs/decisions/0006-gemini-swappable-provider.md) | Gemini is the implementation, not a commitment | A provider swap means rewriting one file, not flipping a config value | Accepted |
| [0007](docs/decisions/0007-generation-prompt-contract.md) | The generation prompt contract | Longer, costlier requests in exchange for suites a tester can actually execute | Accepted |
| [0008](docs/decisions/0008-visual-system.md) | Visual system: "The Specification Binder" | Traded a memorable, atmospheric look for a legible, information-dense one | Superseded by 0011 |
| [0009](docs/decisions/0009-data-model-authority.md) | The runtime contract is authoritative, not any storage schema | v1's browser storage is a dead end architecturally; transforming beats migrating | Accepted |
| [0010](docs/decisions/0010-v1-non-commercial-best-effort-limits.md) | v1 ships non-commercial with best-effort spend controls | Enforcement strength traded for shipping speed, covered by a billing alert | Accepted |
| [0011](docs/decisions/0011-visual-system-test-section.md) | Visual system: "The Test Section" (wind tunnel) | Restraint traded for a world with a point of view — spent only on instruments carrying real data | Superseded by 0012 |
| [0012](docs/decisions/0012-visual-system-workbench.md) | Visual system: "The Workbench" (native app, brief-pinned to lineaprompt.com) | A memorable metaphor traded for an interface that reads as familiar on first sight | Accepted |

---

## The decisions that shape everything else

Four of these constrain almost every future change.

### 0001 — There is no database

Render's free tier has an ephemeral filesystem, so a SQLite file there would be destroyed on
every deploy and restart — silently deleting the retained knowledge base that `PRODUCT.md`
names as the product's differentiator. Storage moved to the browser instead.

**This is why** the backend is stateless, why rate-limit counters cannot survive a restart,
why data does not sync across devices, and why `POST /api/parse` exists at all.

**Restore path:** [docs/v1-scope.md §3.1](docs/v1-scope.md).

### 0003 + 0004 — Authenticated, but open to anyone

Google sign-in with server-side token verification, and no allowlist. Authentication
supplies *identity*, not a spend ceiling — anyone can create a Google account.

**This is why** every stored record is namespaced by the Google `sub` claim (two people on
one laptop must not see each other's data), and why auth was built *before* the storage
layer rather than after.

### 0009 — The runtime contract outranks storage

`GeneratedSuite` is the stable object. Storage schemas are serialisation choices beneath it.

**This is why** runs record `modelName` and `promptVersion` even though nothing reads them
yet — they are impossible to backfill, and without them a suite cannot be attributed to the
prompt that produced it.

### 0010 — v1 is non-commercial

This is what makes free-tier hosting legitimate and lets best-effort spend controls suffice.

**This is why** the Gemini billing budget alert is the *primary* spend protection rather
than a backstop, and why the Cloudflare Pages fallback in 0002 should not be built.

---

## What is still undecided

Recorded so silence is not mistaken for a decision:

- **Multi-tenancy.** No organisations, roles, or billing model. Google sign-in gives
  identity, not tenancy.
- **The export target.** Export to test-management tooling is a *binding constraint* in
  `PRODUCT.md`, but Jira, TestRail, and Xray remain candidates only.
- **Whether human approval is mandatory** before a generated suite is used. The project's
  own PRD says the tool does not replace human judgment; that was never made binding.
- **Post-generation editing.** Suites are read-only.

---

## Writing a new record

Copy the shape of an existing one. Required sections: Context · Options considered ·
Decision · Consequences · Trade-off accepted · Revisit when.

A record with no revisit trigger is a decision nobody will ever reconsider — always write
one. Then add a row to the table above and to
[docs/decisions/README.md](docs/decisions/README.md).
