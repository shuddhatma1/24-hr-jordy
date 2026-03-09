# Project Context — Sports Chatbot Portal

> Pull this file at the start of any new conversation to restore full project context.
> Also read: PRD.md (full product requirements)

---

## What We're Building

A self-serve portal where sports league owners sign up, configure an AI stats chatbot (pick sport + league) in a 3-step wizard, and get a hosted URL to share with fans. The AI bot is **pre-built and external** — the portal is purely a configuration, routing, and UI layer. It proxies fan chat messages to the correct pre-built bot streaming endpoint and renders the response.

---

## Key Decisions Made

| Decision | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (app router) | Full-stack, single repo |
| Database | MongoDB Atlas (free tier) | No SQL, no migrations, fast prototype |
| Auth | NextAuth.js v5 + credentials | Email/password, simplest for prototype |
| Deployment | Netlify + `@netlify/plugin-nextjs` | User preference; plugin handles SSR/streaming |
| Auth config split | `auth.config.ts` (edge) + `auth.ts` (server) | Mongoose uses `eval` — banned in Edge Runtime. Middleware must never import `auth.ts` |
| Streaming | Native `fetch` + `ReadableStream` | Proxy bot stream directly, no extra library |
| Styling | Tailwind CSS | Fast utility-first styling |
| Package manager | npm | Standard |
| Bot integration | Pre-built bot per league, portal proxies | Bot team builds agents independently |
| Dev bot | Express mock server on `:3001` | Develop portal without real bot |
| Stats source | NOT the portal's concern | Bot handles this internally |

---

## Infrastructure

| Item | Value |
|---|---|
| GitHub repo | `https://github.com/shuddhatma1/24-hr-jordy.git` |
| MongoDB cluster | `cluster0.fuhufq5.mongodb.net` |
| MongoDB user | `shuddhatma` |
| MongoDB DB name | `sports-portal` |
| MongoDB URI format | `mongodb+srv://shuddhatma:<pass>@cluster0.fuhufq5.mongodb.net/sports-portal?appName=Cluster0` |
| Netlify | Connected — auto-deploys from `main` |
| MongoDB Atlas IP Access List | `0.0.0.0/0` — required for Netlify functions (dynamic AWS IPs) |

> Note: MongoDB password is stored only in `.env.local` (never committed).

---

## Module Status

| Module | Status | Branch |
|---|---|---|
| M1 — Project Setup | done | `feat/m1-setup` |
| M2 — MongoDB + Models | done | `feat/m2-mongodb` |
| M3 — Auth | done | `feat/m3-auth` |
| M4 — Bot Registry | done | `feat/m4-registry` |
| M5 — Wizard + Bot API | done | `feat/m5-wizard` | PR #6 open; post-review fixes applied 2026-03-09 |
| M6 — Dashboard + Bot APIs | done | `feat/m6-dashboard` | PR #7 open; post-review fixes applied 2026-03-09 |
| M7 — Chat Proxy API | done | `feat/m7-chat-api` | PR #8 pending |
| M8 — Chat UI | Not started | `feat/m8-chat-ui` |
| M9 — Polish | Not started | `feat/m9-polish` |

> Update module status here as work progresses.

---

## Per-Module Workflow

```
DEVELOP → REVIEW (/simplify) → TEST → COMMIT → PUSH branch → MERGE to main → Netlify deploys → VERIFY
```

Branch strategy: `main` always deployable. One feature branch per module.

---

## File Structure (planned)

```
/
├── mock-bot/server.js              # Express SSE mock bot on :3001
├── netlify.toml                    # Netlify Next.js plugin config
├── .env.local                      # Local secrets (never committed)
├── .env.example                    # Committed env var template
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (auth)/signup/page.tsx
│   ├── dashboard/page.tsx
│   ├── setup/page.tsx
│   ├── chat/[bot_id]/page.tsx
│   └── api/
│       ├── auth/signup/route.ts
│       ├── auth/[...nextauth]/route.ts
│       ├── bots/route.ts           # POST /api/bots
│       ├── bots/me/route.ts        # GET /api/bots/me
│       ├── bots/[bot_id]/route.ts  # GET /api/bots/[bot_id]
│       └── chat/route.ts           # POST /api/chat (streaming proxy)
├── lib/
│   ├── mongodb.ts                  # Singleton connection (global ?? cache pattern)
│   ├── models/User.ts
│   ├── models/Bot.ts
│   ├── models/__tests__/models.test.ts
│   ├── __tests__/mongodb.test.ts
│   └── bot-registry.ts            # sport:league → endpoint URL map
├── types/
│   └── global.d.ts                # Global type for _mongoose hot-reload cache
├── components/
│   ├── wizard/StepName.tsx
│   ├── wizard/StepSport.tsx
│   ├── wizard/StepLeague.tsx
│   ├── wizard/ProgressBar.tsx
│   ├── chat/ChatWindow.tsx
│   ├── chat/MessageBubble.tsx
│   ├── chat/ChatInput.tsx
│   └── chat/StreamingCursor.tsx
└── middleware.ts                   # Protects /dashboard, /setup
```

---

## API Surface

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/signup` | None | Create owner account |
| POST/GET | `/api/auth/[...nextauth]` | — | NextAuth signin/signout/session |
| POST | `/api/bots` | Session | Create bot config |
| GET | `/api/bots/me` | Session | Owner's bot (dashboard) |
| GET | `/api/bots/[bot_id]` | None | Bot info (chat page) |
| POST | `/api/chat` | None | Proxy to bot, stream response |

---

## User Flows

**Owner:** `/` → signup → `/setup` (3-step wizard) → `/dashboard` (see URL + preview)

**Fan:** receives link → `/chat/{bot_id}` → chats with bot (no login needed)

---

## Pages & Key Components

| Page | Auth | Purpose |
|---|---|---|
| `/` | None | Landing — Sign Up / Log In CTAs |
| `/signup` | None | Owner registration |
| `/login` | None | Owner login |
| `/setup` | Required | 3-step wizard to configure bot |
| `/dashboard` | Required | Show bot info + hosted URL + copy |
| `/chat/[bot_id]` | None | Fan-facing chat UI |

---

## MongoDB Schema

**`bots` collection** (`lib/models/Bot.ts`):
```ts
{
  owner_id: String,        // NextAuth user id; unique: true — enforces 1 bot per owner at DB level
  bot_name: String,
  sport: String,           // e.g. "soccer"
  league: String,          // e.g. "english-premier-league"
  bot_endpoint_url: String,// pre-built bot streaming endpoint
  created_at: Date         // snake_case; default: () => new Date()
}
```

**`users` collection** (`lib/models/User.ts`):
```ts
{
  email: String,           // unique, lowercase, trim, match regex /^\S+@\S+\.\S+$/
  passwordHash: String,
  createdAt: Date          // camelCase; default: () => new Date()
}
```
Note: `createdAt` (User) vs `created_at` (Bot) — intentional, both match their spec definitions.

---

## Bot Registry (hardcoded for prototype)

Maps `"sport:league"` → bot streaming endpoint URL.
In dev, all entries point to `process.env.MOCK_BOT_URL` (`http://localhost:3001/chat`).
In production, replace with real bot URLs via Netlify env vars.

Sports covered: Soccer (EPL, La Liga, Bundesliga), Basketball (NBA), NFL, Baseball (MLB).

---

## Open Questions

| Question | Status |
|---|---|
| Real bot endpoint URL format | Pending — mock used for now |
| Bot publicly reachable on production? | Pending — may need ngrok or hosted bot |

---

---

## M3 — Auth Implementation Notes

**New files in `sports-portal/`:**
- `auth.config.ts` — edge-safe config only: `trustHost`, `secret`, `pages`, `session: {strategy:'jwt'}`, `authorized` callback. No DB imports.
- `auth.ts` — extends `authConfig`, adds Credentials provider + `jwt`/`session` callbacks. Imports mongoose chain — server-only.
- `middleware.ts` — `export const { auth: middleware } = NextAuth(authConfig)` — imports `auth.config.ts` only, never `auth.ts`
- `lib/auth-helpers.ts` — `validateCredentials(email, password)`: DB lookup + bcrypt compare. Timing oracle via valid DUMMY_HASH.
- `types/next-auth.d.ts` — extends `Session` + `JWT` with `user.id: string`
- `app/api/auth/[...nextauth]/route.ts` — one-liner: `export const { GET, POST } = handlers`
- `app/api/auth/signup/route.ts` — POST: validates → bcrypt hash (work factor 12) → `User.create` → catches `code 11000` for 409
- `components/providers.tsx` — `'use client'` `SessionProvider` wrapper
- `app/(auth)/layout.tsx` — centered card layout
- `app/(auth)/login/page.tsx` — `signIn('credentials', { redirect: false })` → push `/setup`
- `app/(auth)/signup/page.tsx` — POST signup → auto signIn → push `/setup`. Includes confirm password field.

**Critical deployment gotchas (learned in production):**
1. **Edge Runtime crash** — `middleware.ts` must NEVER import `auth.ts`. Mongoose uses `eval`, banned in Edge Runtime. Always import `auth.config.ts` instead.
2. **`trustHost: true`** — required in `authConfig` for NextAuth v5 behind Netlify/any proxy. Without it: "server configuration" 500 on all auth endpoints.
3. **`AUTH_SECRET` vs `NEXTAUTH_SECRET`** — NextAuth v5 beta uses `AUTH_SECRET` as primary. Set `secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET` in `authConfig` to handle both.
4. **MongoDB Atlas IP allowlist** — must add `0.0.0.0/0` for Netlify functions. Without it: signup/login times out (504) because Netlify uses dynamic AWS IPs.
5. **DUMMY_HASH** — must be a real `bcrypt.hash()` output (60 chars). Invalid hash causes bcryptjs to skip the full computation, defeating timing oracle protection.
6. **Post-login redirect** — login and signup push to `/setup`. If the owner already has a bot, `/setup` redirects to `/dashboard` on mount (resolved in M6).

**Tests:** 25 passing — 4 mongodb, 13 models, 4 signup API, 4 auth-helpers.

---

## M4 — Bot Registry Implementation Notes

**New files in `sports-portal/`:**
- `lib/bot-registry.ts` — exports `getEndpointUrl(sport, league): string | null`, `LEAGUES_BY_SPORT`, `SPORT_LABELS`, `SUPPORTED_SPORTS`
- `lib/__tests__/bot-registry.test.ts` — 14 unit tests

**Key design decisions:**
- Registry values are **thunk functions** (not static strings) so `process.env.MOCK_BOT_URL` is read at call-time, not module load time. This lets tests override the env var with `beforeEach`/`afterEach` without module reloading.
- `LEAGUES_BY_SPORT` and `SPORT_LABELS` are typed as `Record<Sport, ...>` — TypeScript enforces exhaustiveness when new sports are added to `SUPPORTED_SPORTS`.
- `nfl:nfl` key is intentional — NFL has no sub-leagues. Sport = `"nfl"`, league value = `"nfl"`. Wizard in M5 will show both steps but "NFL" is the only option under sport NFL.
- `getEndpointUrl` returns `null` (never throws) for unsupported combos or unset env var.
- In production: replace `MOCK_BOT_URL` with per-league env vars (e.g. `EPL_BOT_URL`). Each registry entry would read its own var.

**6 supported entries:** EPL, La Liga, Bundesliga, NBA, NFL, MLB

**Tests:** 36 total (25 existing + 11 new) — all passing. `npm run lint`, `type-check`, `test` all exit 0.

**PR review gaps identified (from session 2026-03-07):**
- No GitHub Actions CI — "no checks reported" on PR. Linting/tests only verified locally.
- `REGISTRY` and `LEAGUES_BY_SPORT` have no compile-time sync enforcement — test `every league value resolves to a non-null endpoint URL` acts as the guard.

---

## M5 — Wizard + Bot API Implementation Notes

**New files in `sports-portal/`:**
- `app/api/bots/route.ts` — `POST /api/bots`: auth check → validate body → `getEndpointUrl` → `Bot.create` → return `{ bot_id }`
- `app/setup/page.tsx` — 3-step wizard (`'use client'`): name → sport → league, submits to `/api/bots`, redirects to `/dashboard`
- `app/api/bots/__tests__/bots.test.ts` — 10 unit tests (6 original + 2 from fix commit + 2 from post-PR-review)

**Key design decisions:**
- Auth check (`await auth()`) comes before body parsing — fail fast before any DB work
- `connectDB()` called inside the same `try/catch` as `Bot.create` — DB connection failure returns a clean error, not an unhandled rejection
- Sport/league validated against `SUPPORTED_SPORTS`/`LEAGUES_BY_SPORT`, then `getEndpointUrl` as a second gate (defence-in-depth; distinct error messages at each layer)
- `Bot.create` catches `code 11000` (unique `owner_id`) → 409; all other DB errors rethrow
- Wizard initializes sport/league to first valid options — select is always in a valid state, no "Pick one" blank option
- `handleBack` uses `Math.max(1, step - 1)` — concise and safe against step underflow
- `handleSubmit` redirects to `/login` on 401 (session expired mid-wizard), not inline error
- League `<select>` is `disabled` during API submission — prevents UI state diverging from submitted values

**Post-PR-review fixes applied (2026-03-09):**
1. `connectDB()` moved inside `try/catch` with `Bot.create` — prevents unhandled rejection on DB failure
2. `res.status === 401` → `router.push('/login')` in `handleSubmit` — session expiry redirects properly
3. League `<select>` gets `disabled={loading}` during submission
4. 2 new tests: `MOCK_BOT_URL` unset → 400 "This league isn't available yet"; invalid JSON body → 400 "Invalid JSON"

**Tests:** 49 total (45 after M5 initial + 4 added across fix commit and post-review) — all passing. Lint, type-check, test all exit 0.

**Input text visibility fix (2026-03-09):**
- Added `text-gray-900` to all form inputs on `/setup`, `/login`, and `/signup`
- Root cause: Tailwind CSS variable inheritance rendered input text as invisible light grey
- Files touched: `app/setup/page.tsx`, `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`

**PR #6 final state:** 7 files changed (471 additions, 26 deletions), deploy preview live and passing at `deploy-preview-6--24-hr-jordy.netlify.app`.

**Known flaky test:** "returns 409 when owner already has a bot" can fail on cold start — Mongoose creates unique indexes asynchronously; index may not exist for the very first duplicate write. Passes consistently on re-run. Pre-existing, not introduced by fixes.

**Known gap deferred to M6:** CLOSED — `/setup` now redirects to `/dashboard` on mount if owner already has a bot.

---

## M6 — Dashboard + Bot APIs Implementation Notes

**New files in `sports-portal/`:**
- `app/api/bots/me/route.ts` — `GET /api/bots/me`: session check → `Bot.findOne({ owner_id })` → returns `{ bot_id, bot_name, sport, league }`; 401/404/500
- `app/api/bots/[bot_id]/route.ts` — `GET /api/bots/[bot_id]` (public): `mongoose.Types.ObjectId.isValid()` check → `Bot.findById(bot_id)` → returns `{ bot_name, sport, league }` only; 404/500
- `app/dashboard/page.tsx` — `'use client'`: fetches `/api/bots/me` on mount; shows bot details, copy URL ("Copied!" feedback), Preview Chatbot link, logout via `signOut({ callbackUrl: '/login' })`; uses `SPORT_LABELS`/`LEAGUES_BY_SPORT` for human-readable labels
- `app/setup/page.tsx` — added `useEffect` on mount: if `/api/bots/me` returns 200 → `router.push('/dashboard')`; shows "Loading..." during check

**Key patterns:**
- `GET /api/bots/[bot_id]` uses `Bot.findById(bot_id)` — idiomatic Mongoose; ObjectId validated with `mongoose.Types.ObjectId.isValid()` before DB query
- `bot_endpoint_url` and `owner_id` are NEVER returned in API responses (internal fields)
- `getChatUrl` uses `process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin` — safe fallback if env var is unset at build time
- Dashboard error state includes a "Log out" button — prevents user being trapped with no escape
- `AbortController` used in both dashboard and setup effects — prevents stale state updates on unmount
- `copyTimer` stored in `useRef` — cleared on unmount and on re-click
- All `useState` declarations grouped above `useEffect` in setup page
- Synchronous params in Next.js 14: `{ params }: { params: { bot_id: string } }` — NOT async (that's Next.js 15+)

**Tests:** 59 total (49 existing + 10 new: 5 for `/api/bots/me`, 5 for `/api/bots/[bot_id]`)

**CI:** `.github/workflows/ci.yml` added — runs lint + type-check + test on every push and PR to `main`.

---

## M7 — Chat Proxy API Implementation Notes

**New files in `sports-portal/`:**
- `app/api/chat/route.ts` — `POST /api/chat` (public): 50kb body limit → JSON parse → validate `bot_id`/`messages` → `Bot.findById` → `fetch(bot.bot_endpoint_url, { messages })` → pipe `ReadableStream` response back with `Content-Type: text/event-stream`; 400/404/413/502/500
- `app/api/chat/__tests__/chat.test.ts` — 7 unit tests

**Key patterns:**
- Body size enforced in two passes: `Content-Length` header fast-path, then `TextEncoder().encode(raw).byteLength` definitive check
- `fetch` to bot endpoint wrapped in inner try/catch — throws → 502; non-ok response → 502
- `botRes.body` (`ReadableStream<Uint8Array>`) passed directly as `new Response(botRes.body, ...)` — zero buffering
- `bot_endpoint_url` sourced exclusively from DB — never from user input
- No auth required — `/api/chat` is public (fan-facing)
- Default Node.js runtime (no `export const runtime = 'edge'`) — consistent with all other routes; `@netlify/plugin-nextjs` v5 handles streaming
- Invalid ObjectId → 404 (consistent with `GET /api/bots/[bot_id]` pattern)

**Tests:** 66 total (59 existing + 7 new) — all passing. Lint, type-check, test all exit 0.

---

## Key Files to Reference

- Full PRD: `PRD.md`
- This file: `CONTEXT.md`
- Next module: M8 — Chat UI (`feat/m8-chat-ui`)
