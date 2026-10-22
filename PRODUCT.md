# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: QA engineers and SDETs** drafting and owning the coverage plan for a feature. Their workflow wins when it conflicts with other audiences. They arrive with a PRD handed to them late in the release cycle, under time pressure, and must turn it into a defensible set of test cases.

Secondary audiences confirmed in the project PRD, but not the design tiebreaker: product analysts and engineering managers reviewing feature readiness, and release management.

## Product Purpose

Turn a product requirements document into a structured, review-ready QA coverage draft in minutes instead of hours.

The problem it addresses: QA teams receive feature PRDs late, translate them into coverage plans by hand, and the result is inconsistent across reviewers because it depends on each person's domain memory to remember validation, regression, permission, integration, and observability scenarios.

Success means a QA engineer gets a first draft that is (a) fast enough to beat starting from a blank page, (b) grounded enough in real product context to be trusted, and (c) structured enough to carry into their real test workflow. The project PRD states the goal is to shorten first-draft creation and reduce missed coverage, not to replace human QA judgment.

Explicitly out of scope for now: full test management, execution tracking, and defect lifecycle workflows.

## Positioning

The **retained knowledge base** is the mechanism a neighboring tool could not truthfully copy without building the same thing: supporting documents (process docs, config guides, policy documents, integration notes) persist across runs and automatically ground every future generation. Coverage quality compounds as a team feeds the workspace, rather than resetting to zero with each PRD upload.

Supporting this: generation is schema-validated rather than free-text, with an automatic repair retry when the model returns a structurally incomplete suite — so the output is a predictable data structure, not prose a human must reformat.

## Operating Context

- QA receives a PRD near the end of the feature lifecycle and works under release time pressure.
- Source artifacts arrive as PDFs and DOCX from product teams, plus requirement notes, process documents, configuration guides, policy documents, and integration notes.
- Observed real usage is regulated fintech — the one stored run analyzes a credit-card bill-payment integration against India's BBPS/NBBL standards. Domain material is dense, compliance-bearing, and acronym-heavy; generated coverage includes security and regulatory-compliance areas.
- Desktop browser is the working environment. Local development runs the client and API together under one command.
- The intended path is a product sold to other companies, so the single-user local deployment is a current stage rather than the target operating model.

## Capabilities and Constraints

**Built and working:**
- Single-PRD upload per run; the knowledge base is applied server-side automatically rather than re-attached each time.
- Document parsing for PDF, DOCX, TXT, MD, CSV, JSON, and RTF.
- Gemini-backed generation returning feature summary, risks, assumptions, source highlights, and prioritized test cases with title, criticality (Low/Medium/High), rationale, coverage area, and ordered steps.
- Structural validation with one automatic repair retry, then a clean user-facing error rather than raw schema output.
- Persisted run history and persisted knowledge-base documents, both reloadable across sessions.
- Three-section workspace: generate, previous runs, knowledge base.

**Binding constraints future work must preserve:**
- The retained knowledge base is core differentiating mechanism, not a convenience feature.
- Generated cases must eventually leave the app into external test management tooling (Jira / TestRail / Xray or similar). The output data model should stay export-shaped.

**Explicitly changeable — do not treat as commitments:**
- **The model provider.** Gemini is the current implementation, not a committed choice; keep it swappable.
- **Mandatory human review.** Not confirmed as binding, so the product is not obligated to require human approval before cases are used or filed.

**Technical constraints in force today:**
- Per-document text cap of 18,000 characters; combined knowledge-base budget of 60,000 characters per generation.
- 15 MB per upload; up to 10 knowledge-base files per upload action; exactly one PRD per run.
- Persistence is browser-scoped: IndexedDB for knowledge-base text, localStorage for run history, both keyed per Google account. The server stores nothing.

**Decided for version 1** (see [docs/v1-scope.md](docs/v1-scope.md) and [docs/decisions/](docs/decisions/)):
- **Version 1 is non-commercial.** It ships free and unpriced. The commercial destination below is unchanged, but it is not v1's problem — this is what makes free-tier hosting legitimate and lets best-effort spend controls suffice.
- **Authentication:** Google sign-in, ID token verified server-side, no user store. Signup is open to anyone with a Google account.
- **Hosting:** Vercel (frontend) + Render free (stateless API), no database.
- **Persistence is deferred, not abandoned.** For v1 the retained knowledge base and run history live in the browser, namespaced per Google account. The mechanism is preserved; its durability is reduced. Restore path is documented.
- **Data model authority:** the runtime `GeneratedSuite` contract is authoritative, not any storage schema. If server persistence returns, it builds the five-table model from the original technical specification — not the two-table implementation, which stored suites as opaque JSON and made prompt quality unmeasurable.

**Open decisions — undecided, not to be assumed:**
- Multi-tenancy — organisations, roles, shared knowledge bases, and billing — is not built. Google sign-in provides identity only, not tenancy.
- The specific export target tool has not been chosen.
- Editing or curating generated cases after generation does not exist.
- Whether human approval is required before a generated suite is used remains unconfirmed.

## Brand Commitments

**Name: AI Powered Testing Agent** — set by the product owner on 2026-10-22, replacing the earlier inconsistent "Test Case Generator" / "QA Test Generator". Used in the browser title, sign-in, and the instrument rail.

The visual identity is "The Test Section" (a wind-tunnel facility) — see DESIGN.md. The brand mark is three streamlines parting around a body on safety yellow.

## Evidence on Hand

- `docs/test-case-generator-prd.docx` — a full PRD for this product covering business context, benefits, concept note, proposed data model, and screen-by-screen flows with error and edge-state expectations.
- `docs/test-case-generator-technical-specification.docx` — companion technical specification.
- `scripts/generate_product_docs.py` — generates both documents; the prose source of the above.
- One real generated run persisted locally (BBPS credit-card payment integration): 6 test cases, 4 high criticality, with populated risk scan, source context, and assumptions. Usable as realistic demonstration content.

**Absences future work must not fabricate:** there are no customers, testimonials, case studies, press mentions, usage metrics, benchmarks, pricing, or licensing terms. No logo or brand assets exist. Time-saving claims ("hours to minutes") originate in the project's own PRD as a goal, not as measured results.

## Product Principles

1. **The QA engineer's workflow is the tiebreaker.** When a reading experience for managers conflicts with dense, scannable working density for the person drafting coverage, the drafter wins.
2. **Context compounds.** Every design and product decision should make the retained knowledge base more valuable over time, never treat a run as an isolated transaction.
3. **Output is a working artifact, not a destination.** Generated cases are meant to leave the app for real test tooling; anything that traps them is a regression.
4. **Trust is earned by showing the basis.** Risks, assumptions, and source context are shown alongside results so a reviewer can judge whether the draft is credible before acting on it.
5. **Local and single-user is a stage, not the target.** The product is headed to other companies, so avoid decisions that assume one user, one machine, or one tenant. Version 1 is browser-scoped by deliberate choice, with a documented restore path — that is a staging decision, not a change of destination.
