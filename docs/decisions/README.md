# Decision Records

Numbered, dated records of decisions that shaped this product. Each one states what was
decided, what else was considered, what it costs, and when it should be revisited.

The point is rebuildability: a future maintainer — including a future you — should be able
to reconstruct the reasoning without excavating git history or re-deriving trade-offs.

## Conventions

- Records are immutable once **Accepted**. To change a decision, add a new record that
  supersedes it and update the old one's status.
- Status values: `Proposed`, `Accepted`, `Superseded by NNNN`, `Deprecated`.
- Every record carries a **Revisit when** trigger. A decision with no trigger is a decision
  nobody will ever reconsider.

## Index

| # | Decision | Status | Date |
|---|---|---|---|
| [0001](0001-browser-scoped-persistence.md) | Browser-scoped persistence for v1 | Accepted | 2026-08-05 |
| [0002](0002-hosting-topology.md) | Vercel frontend + Render backend, no database | Accepted | 2026-08-05 |
| [0003](0003-google-identity-services.md) | Google Identity Services with server-side token verification | Accepted | 2026-08-05 |
| [0004](0004-open-signup.md) | Open signup, and how spend is controlled without an allowlist | Accepted | 2026-08-05 |
| [0005](0005-cold-start-warm-up.md) | Warm the backend with a health ping on landing | Accepted | 2026-08-05 |
| [0006](0006-gemini-swappable-provider.md) | Gemini is the implementation, not a commitment | Accepted | 2026-08-03 |
| [0007](0007-generation-prompt-contract.md) | The generation prompt contract | Accepted | 2026-08-03 |
| [0008](0008-visual-system.md) | Visual system — "The Specification Binder" | Superseded by 0011 | 2026-08-02 |
| [0009](0009-data-model-authority.md) | Which data model is authoritative | Accepted | 2026-08-05 |
| [0010](0010-v1-non-commercial-best-effort-limits.md) | v1 ships non-commercial with best-effort spend controls | Accepted | 2026-08-06 |
| [0011](0011-visual-system-test-section.md) | Visual system — "The Test Section" | Superseded by 0012 | 2026-10-22 |
| [0012](0012-visual-system-workbench.md) | Visual system — "The Workbench" | Accepted | 2026-10-22 |

## Related documents

- [../original-product.md](../original-product.md) — the product as originally ideated
- [../v1-scope.md](../v1-scope.md) — what v1 ships, what it cuts, how to restore each cut
- [../../PRODUCT.md](../../PRODUCT.md) — durable product truth
- [../../DESIGN.md](../../DESIGN.md) — the visual system
- [../../CHANGELOG.md](../../CHANGELOG.md) — dated record of changes
