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
| M4 — Bot Registry | Not started | `feat/m4-registry` |
| M5 — Wizard + Bot API | Not started | `feat/m5-wizard` |
| M6 — Dashboard + Bot APIs | Not started | `feat/m6-dashboard` |
| M7 — Chat Proxy API | Not started | `feat/m7-chat-api` |
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
6. **Post-login redirect** — both login and signup push to `/setup`. TODO(m6): redirect to `/dashboard` if user already has a bot.

**Tests:** 25 passing — 4 mongodb, 13 models, 4 signup API, 4 auth-helpers.

---

## Key Files to Reference

- Full PRD: `PRD.md`
- This file: `CONTEXT.md`
- Next module: M4 — Bot Registry (`feat/m4-registry`)
