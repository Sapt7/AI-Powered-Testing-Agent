# Deployment

Vercel hosts the static SPA; Render runs the stateless API. There is no database.
Reasoning and rejected alternatives: [decisions/0002-hosting-topology.md](decisions/0002-hosting-topology.md).

Both platforms are used on their free tiers. The only variable cost is Gemini usage.

---

## Before you start

You need:

- A Google Cloud project with an **OAuth 2.0 Client ID** (Web application)
- A **Gemini API key**
- The repository pushed to GitHub

## 1. Deploy the API to Render

Render reads [`../render.yaml`](../render.yaml) if you use a Blueprint, or configure manually:

| Setting | Value |
|---|---|
| Runtime | Node |
| Plan | Free |
| Build command | `npm ci && npm run build:server` |
| Start command | `npm start` |
| Health check path | `/api/health` |

**Use `build:server`, not `build`.** The full build also compiles the SPA, which Render
does not serve — wasted minutes on every deploy.

Environment variables:

| Variable | Value |
|---|---|
| `GEMINI_API_KEY` | your key — secret |
| `GEMINI_MODEL` | `gemini-2.5-flash` |
| `GOOGLE_CLIENT_ID` | your OAuth client ID |
| `CORS_ORIGIN` | set after step 2, once the Vercel domain exists |
| `NODE_VERSION` | `20` |
| `GENERATIONS_PER_USER_PER_HOUR` | `5` |
| `GENERATIONS_GLOBAL_PER_DAY` | `100` |
| `PARSES_PER_USER_PER_HOUR` | `40` |

**Do not set `PORT`.** Render injects it, and `server/config.ts` already reads it.

Verify: `curl https://<service>.onrender.com/api/health` returns `{"status":"ok"}`, and
`curl -X POST https://<service>.onrender.com/api/parse` returns `401`.

## 2. Deploy the frontend to Vercel

Edit [`../vercel.json`](../vercel.json) and replace the placeholder in the rewrite
destination with your Render URL:

```json
"destination": "https://your-service.onrender.com/api/:path*"
```

Vercel does not interpolate environment variables into `vercel.json` rewrites, so this must
be a literal URL.

| Setting | Value |
|---|---|
| Framework | Vite |
| Build command | `npm run build:client` |
| Output directory | `dist` |

Environment variable:

| Variable | Value |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | your OAuth client ID |

Leave `VITE_API_BASE_URL` unset. Empty means same-origin, which is what makes the rewrite
work and avoids CORS entirely. Set it only if you deliberately want the browser calling
Render directly.

## 3. Close the loop

Set `CORS_ORIGIN` on Render to your Vercel production origin
(`https://your-app.vercel.app`) and redeploy.

## 4. Configure the OAuth client

In Google Cloud Console → Credentials → your OAuth client:

**Authorized JavaScript origins**
- `https://your-app.vercel.app`
- `http://localhost:8080` (development)

Vercel preview deployments get unique URLs and **will not authenticate** unless you add
each one. Expect this during review.

**Publish the consent screen to Production.** The scopes used (`openid`, `email`,
`profile`) are non-sensitive, so Google requires no verification review — but leaving the
app in Testing mode caps you at 100 users *and* expires refresh tokens after 7 days,
silently signing users out weekly.

## 5. Set a billing budget

On the Google Cloud project holding the Gemini key, create a **budget with an alert**.

Signup is open ([decisions/0004-open-signup.md](decisions/0004-open-signup.md)), so
authentication supplies identity, not a spend ceiling. And because the in-app counters reset
whenever the free instance restarts
([ADR-0010](decisions/0010-v1-non-commercial-best-effort-limits.md)), **this alert is the
primary protection against a runaway bill, not a backstop.** Do not skip it.

---

## Spend controls

| Control | Default | Env var |
|---|---|---|
| Generations per user per hour | 5 | `GENERATIONS_PER_USER_PER_HOUR` |
| Generations across all users per day | 100 | `GENERATIONS_GLOBAL_PER_DAY` |
| Document parses per user per hour | 40 | `PARSES_PER_USER_PER_HOUR` |

Exceeding a limit returns `429` with a `Retry-After` header and an honest message.

**Counters live in process memory** and reset on restart or spin-down, which on a free
instance happens often. They are a speed bump, not a wall. Durable counters need the
datastore v1 deliberately does not have — see
[decisions/0001-browser-scoped-persistence.md](decisions/0001-browser-scoped-persistence.md).

Every limit is env-overridable so you can loosen one on a running deployment the moment a
legitimate user hits it, without a code change.

## Cold starts

Render free instances spin down after roughly 15 minutes idle; the next request waits tens
of seconds. The client pings `/api/health` before React mounts so the wake overlaps with
Google sign-in — see [decisions/0005-cold-start-warm-up.md](decisions/0005-cold-start-warm-up.md).

This overlaps the wait; it does not remove it. A user who is already signed in with a file
ready can still outrun the wake. The fix, when the product has real users, is a paid
always-on instance (~$7/month) — not a keep-alive cron, which defeats a constraint the free
tier is designed around.

## Things that will bite you

**Version 1 is non-commercial by decision**
([ADR-0010](decisions/0010-v1-non-commercial-best-effort-limits.md)), which is what makes
Vercel's Hobby plan a legitimate choice. If the product ever takes payment, Vercel requires
Pro and the durable rate limiting deferred in the same decision both come back — together.

**512 MB RAM on Render free.** Multer buffers uploads in memory and `pdf-parse` spikes on
large files. A 15 MB PDF plus extraction is a genuine OOM risk — load-test with your
largest realistic PRD before announcing the URL.

**CORS is not a security control.** It is enforced by browsers and does nothing against a
non-browser client. Authentication is what protects the API; `CORS_ORIGIN` is defence in
depth.

**Data is per-browser.** Users signing in on a second device see an empty workspace. This
is expected in v1 and stated in the UI, but it will generate questions.

## Local development

```bash
npm install
cp .env.example .env   # then fill in the values
npm run dev
```

Frontend on `http://localhost:8080`, API on `http://localhost:8787`, with `/api` proxied by
Vite. `http://localhost:8080` must be an authorized JavaScript origin on the OAuth client
or the Google button will not render.
