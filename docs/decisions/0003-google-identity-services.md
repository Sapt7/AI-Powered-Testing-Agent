# 0003 — Google Identity Services with server-side token verification

**Status:** Accepted
**Date:** 2026-08-05

## Context

The product is going public with an API backed by a paid LLM. It needs a sign-in gate.
The requirement is specifically Google sign-in.

The binding constraint is [0001](0001-browser-scoped-persistence.md): **there is no
database.** Any auth approach that needs to store users or sessions server-side would
reintroduce exactly the infrastructure v1 just removed.

## Options considered

**A. Google Identity Services in the browser, ID token verified server-side.** **Chosen.**
The ID token is a self-contained signed JWT. The backend verifies it per request with
`google-auth-library` and reads identity from the claims. No user table, no session store.

**B. Firebase Authentication.** Generous free tier, handles token refresh, mature SDK.
Rejected as disproportionate: it adds a Google Cloud service and the `firebase-admin`
dependency to solve one provider's sign-in, and v1's whole thesis is removing services.

**C. Auth0 / Clerk.** Both have workable free tiers and better developer experience.
Rejected for the same reason as B, plus vendor lock on the identity layer.

**D. Auth.js / NextAuth.** Rejected: designed around a server session and typically a
database adapter, which is awkward for a static SPA talking to a separate stateless API.

**E. Session cookies issued by our own backend after a Google OAuth code exchange.**
Rejected: requires server-side session storage, and cross-origin cookies between Vercel and
Render bring `SameSite`, `Secure`, and credentialed-CORS complexity that bearer tokens avoid.

## Decision

Google Identity Services in the browser. The client obtains an ID token and sends it as
`Authorization: Bearer <id_token>`. The API verifies signature, `aud`, `iss`, and `exp` on
every protected request using `google-auth-library`, and derives user identity from the
`sub` claim.

Scopes: `openid`, `email`, `profile`. Nothing more.

**The OAuth consent screen must be published to Production.** These scopes are
non-sensitive, so Google requires **no verification review** — but leaving the app in
Testing mode caps it at 100 users *and* expires refresh tokens after 7 days, silently
logging users out weekly.

**Authorized JavaScript origins** must include the Vercel production domain and
`http://localhost:8080` for development. Vercel preview deployments receive unique URLs and
will not authenticate unless individually added — expect this to bite during review.

## Consequences

**This decision governs the storage layer.** IndexedDB and localStorage must be namespaced
by the Google `sub` claim, and cleared or locked on sign-out. Without it, two people signing
in on one machine would see each other's knowledge base and run history — a genuine privacy
leak, not a cosmetic bug.

This is why auth is built **before** the storage rewrite. Retrofitting namespacing is how
that bug ships.

**Other consequences**
- Bearer tokens mean no cookie handling and no credentialed CORS.
- ID tokens expire in roughly one hour; the client must refresh before long operations.
  Verification happens at request start, so a token expiring mid-generation is harmless.
- Identity is available without any user record: name, email, and picture arrive in the
  token claims.
- The backend stays fully stateless, preserving [0002](0002-hosting-topology.md).
- Auth alone does **not** cap spend — see [0004](0004-open-signup.md).

## Trade-off accepted

We accept a hand-rolled verification path — roughly 30 lines of middleware — instead of a
managed auth service, in exchange for adding zero infrastructure. The risk is that token
verification is security-sensitive code we own. Mitigation: use `google-auth-library`'s
`verifyIdToken`, never decode manually, and never trust any claim without checking `aud`.

## Revisit when

- A second identity provider is required (email/password, GitHub, SSO).
- The product needs organisations, roles, or team-shared knowledge bases — that needs a
  user store, at which point a managed provider becomes worth its weight.
- Enterprise customers require SAML or SCIM.
