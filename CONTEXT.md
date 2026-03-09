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
| Netlify | Connected — auto-deploys from `feat/m8-chat-ui` (production branch) |
| Netlify URL | `https://24-hr-jordy.netlify.app` |
| MongoDB Atlas IP Access List | `0.0.0.0/0` — required for Netlify functions (dynamic AWS IPs) |

> Note: MongoDB password is stored only in `.env.local` (never committed).

---

## Module Status

| Module | Status | Branch | PR |
|---|---|---|---|
| M1 — Project Setup | done | `feat/m1-setup` | — |
| M2 — MongoDB + Models | done | `feat/m2-mongodb` | #2 |
| M3 — Auth | done | `feat/m3-auth` | #3 + #4 |
| M4 — Bot Registry | done | `feat/m4-registry` | #5 |
| M5 — Wizard + Bot API | done | `feat/m5-wizard` | #6 |
| M6 — Dashboard + Bot APIs | done | `feat/m6-dashboard` | #7 |
| M7 — Chat Proxy API | done | `feat/m7-chat-api` | #8 |
| M8 — Chat UI | done | `feat/m8-chat-ui` | #9 merged 2026-03-09 |
| M9 — Polish | done | `feat/m9-polish` | #10 merged 2026-03-09 |

**All modules complete. App is live and fully functional.**

---

## Per-Module Workflow

```
DEVELOP → REVIEW (/simplify) → TEST → COMMIT → PUSH branch → MERGE → Netlify deploys → VERIFY
```

Branch strategy: each feature branch builds on the previous (M9 branches from M8, etc.). `feat/m8-chat-ui` is the Netlify production branch.

---

## File Structure (actual)

```
sports-portal/
├── mock-bot/server.js              # Express SSE mock bot on :3001
├── netlify.toml                    # base=sports-portal, @netlify/plugin-nextjs
├── .env.local                      # Local secrets (never committed)
├── .env.example                    # Committed env var template
├── app/
│   ├── page.tsx                    # Landing page — hero + CTAs
│   ├── layout.tsx                  # Root layout with Providers, Geist fonts
│   ├── globals.css
│   ├── __tests__/page.test.tsx     # 3 tests: headline, /signup link, /login link
│   ├── (auth)/
│   │   ├── layout.tsx              # Centered card layout
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── setup/
│   │   ├── page.tsx                # 3-step wizard (client component)
│   │   └── loading.tsx             # Per-route loading state
│   ├── dashboard/
│   │   ├── page.tsx                # Owner dashboard (client component)
│   │   └── loading.tsx             # Per-route loading state
│   ├── chat/[bot_id]/
│   │   ├── page.tsx                # Server component; React.cache; generateMetadata
│   │   └── loading.tsx             # Per-route loading state
│   └── api/
│       ├── auth/signup/route.ts
│       ├── auth/[...nextauth]/route.ts
│       ├── bots/route.ts           # POST /api/bots
│       ├── bots/me/route.ts        # GET /api/bots/me
│       ├── bots/[bot_id]/route.ts  # GET /api/bots/[bot_id]
│       └── chat/route.ts           # POST /api/chat (streaming proxy)
├── lib/
│   ├── mongodb.ts                  # Singleton connection (global ?? cache pattern)
│   ├── auth-helpers.ts             # validateCredentials + timing-safe DUMMY_HASH
│   ├── bot-registry.ts             # sport:league → endpoint URL map (thunk pattern)
│   └── models/
│       ├── User.ts
│       └── Bot.ts
├── components/
│   ├── providers.tsx               # SessionProvider wrapper
│   └── chat/
│       ├── ChatWindow.tsx
│       ├── MessageBubble.tsx
│       ├── ChatInput.tsx
│       └── StreamingCursor.tsx
├── types/
│   ├── global.d.ts                 # _mongoose hot-reload cache type
│   └── next-auth.d.ts              # Session + JWT extended with user.id
├── auth.config.ts                  # Edge-safe NextAuth config (no DB imports)
├── auth.ts                         # Full NextAuth config (server only)
└── middleware.ts                   # Protects /dashboard, /setup — imports auth.config only
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
| `/` | None | Landing — hero, "Get started free" → `/signup`, "Log in" → `/login` |
| `/signup` | None | Owner registration |
| `/login` | None | Owner login |
| `/setup` | Required | 3-step wizard: name → sport → league |
| `/dashboard` | Required | Bot info + hosted URL + copy + preview |
| `/chat/[bot_id]` | None | Fan-facing chat UI with SSE streaming |

---

## MongoDB Schema

**`bots` collection** (`lib/models/Bot.ts`):
```ts
{
  owner_id: String,        // NextAuth user id; unique: true — enforces 1 bot per owner at DB level
  bot_name: String,
  sport: String,           // e.g. "soccer"
  league: String,          // e.g. "english-premier-league"
  bot_endpoint_url: String,// pre-built bot streaming endpoint (never returned in API responses)
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

## Bot Registry

Maps `"sport:league"` → bot streaming endpoint URL. In dev, all entries point to `process.env.MOCK_BOT_URL`. Registry values are **thunk functions** — env var read at call-time, not module load, enabling test overrides without module reloading.

**6 supported entries:** EPL, La Liga, Bundesliga, NBA, NFL, MLB

In production: replace `MOCK_BOT_URL` with per-league env vars (e.g. `EPL_BOT_URL`).

---

## Open Questions

| Question | Status |
|---|---|
| Real bot endpoint URL format | Pending — mock used for now |
| Mock bot not publicly reachable in production | Pending — may need ngrok or hosted bot |

---

## M3 — Auth Implementation Notes

**Key files:**
- `auth.config.ts` — edge-safe: `trustHost`, `secret`, `pages`, `session: {strategy:'jwt'}`, `authorized` callback. No DB imports.
- `auth.ts` — extends `authConfig`, adds Credentials provider + `jwt`/`session` callbacks. Server-only.
- `middleware.ts` — imports `auth.config.ts` ONLY, never `auth.ts`
- `lib/auth-helpers.ts` — `validateCredentials`: DB lookup + bcrypt compare. Timing-safe via real DUMMY_HASH (60 chars).

**Critical deployment gotchas:**
1. **Edge Runtime** — `middleware.ts` must NEVER import `auth.ts`. Mongoose uses `eval`, banned in Edge Runtime.
2. **`trustHost: true`** — required in `authConfig` for NextAuth v5 behind Netlify proxy. Without it: 500 on all auth endpoints.
3. **`AUTH_SECRET`** — `secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET` — v5 beta uses `AUTH_SECRET`.
4. **MongoDB Atlas IP** — `0.0.0.0/0` required. Netlify uses dynamic AWS IPs.
5. **DUMMY_HASH** — must be a real `bcrypt.hash()` output (60 chars) or timing oracle protection is defeated.

---

## M4 — Bot Registry Implementation Notes

- `getEndpointUrl` returns `null` (never throws) for unsupported combos or unset env var.
- `LEAGUES_BY_SPORT` typed as `Record<Sport, ...>` — TypeScript enforces exhaustiveness on new sports.
- `nfl:nfl` is intentional — NFL has no sub-leagues.

---

## M5 — Wizard + Bot API Implementation Notes

- Auth check before body parsing — fail fast before DB work.
- `connectDB()` inside the same `try/catch` as `Bot.create` — prevents unhandled rejections on DB failure.
- Sport/league validated at two layers: `SUPPORTED_SPORTS`/`LEAGUES_BY_SPORT` then `getEndpointUrl` (defence-in-depth).
- `Bot.create` catches `code 11000` → 409; all other DB errors rethrow.
- `handleBack` uses `Math.max(1, step - 1)` — safe against step underflow.
- All form inputs have `text-gray-900` — without it, Tailwind CSS variable inheritance renders text invisible.

---

## M6 — Dashboard + Bot APIs Implementation Notes

- `GET /api/bots/[bot_id]`: `mongoose.Types.ObjectId.isValid()` before `findById` — invalid ObjectId → 404.
- `bot_endpoint_url` and `owner_id` NEVER returned in any API response.
- `getChatUrl` uses `process.env.NEXT_PUBLIC_APP_URL` — must be set in Netlify env vars for production URLs to be correct.
- Dashboard error state has a "Log out" button — prevents user being trapped.
- `copyTimer` stored in `useRef` — cleared on unmount and on re-click.
- Next.js 14 params are synchronous: `{ params }: { params: { bot_id: string } }` — NOT async (that's Next.js 15+).

---

## M7 — Chat Proxy API Implementation Notes

- Body size: `Content-Length` header fast-path + `TextEncoder().encode(raw).byteLength` definitive check (50kb limit).
- `Number()` not `parseInt()` for header values — `parseInt` returns silent NaN on malformed headers.
- `botRes.body` is `ReadableStream | null` — null check required before passing to `new Response()`.
- `X-Accel-Buffering: no` on SSE responses — nginx/Netlify proxy buffers SSE by default without it.
- `bot_endpoint_url` sourced exclusively from DB — never from user input.

---

## M8 — Chat UI Implementation Notes

- `app/chat/[bot_id]/page.tsx` — server component, `force-dynamic`, `React.cache` on `fetchBotData` so `generateMetadata` and page share one DB round-trip.
- SSE parsing: `buffer += decode(chunk,{stream:true})`, split on `\n`, lines starting with `data: `, `[DONE]` terminates.
- `messagesRef` pattern: ref kept in sync with state so async `handleSend` reads current history without being a `useCallback` dependency.
- `handleSend` wrapped in `useCallback([botId, isStreaming])` — `ChatInput` does not re-render per token.
- Stable keys: `crypto.randomUUID()` on message creation — never array index.
- Scroll: `prevLengthRef` tracks message count; smooth on new message, instant on token append (no jank).
- AbortError guard: `err instanceof DOMException && err.name === 'AbortError'`.
- Bot history to API: skip index 0 (welcome message), map `role: 'bot'` → `role: 'assistant'`.

---

## M9 — Polish Implementation Notes

**Files changed:**
- `app/page.tsx` — hero landing: `<main>` landmark, `metadata` export, headline, 3 feature bullets, "Get started free" → `/signup` + "Log in" → `/login` (both with `focus:ring-2`), mobile-safe (`flex-col sm:flex-row`).
- `app/setup/page.tsx` — replaced `return null` with loading UI while mount-time bot-check fetch is in flight.
- `app/setup/loading.tsx` + `app/dashboard/loading.tsx` — per-route loading states (cover code-split latency on first navigation).
- `app/__tests__/page.test.tsx` — 3 tests: headline, `/signup` link, `/login` link.

**PR review gaps found and fixed:**
1. `<div>` → `<main>` on landing page (semantic HTML regression from placeholder)
2. `focus:ring` classes added to both CTA links (consistent with rest of app)
3. `metadata` export added to landing page (page-specific title + description)

**Tests:** 115 passing. Lint, type-check, test all exit 0.

---

## Key Files to Reference

- Full PRD: `PRD.md`
- Module tracker: `TRACKER.md`
- This file: `CONTEXT.md`
