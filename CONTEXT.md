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
| Netlify | Connect to GitHub repo after M1 push |

> Note: MongoDB password is stored only in `.env.local` (never committed).

---

## Module Status

| Module | Status | Branch |
|---|---|---|
| M1 — Project Setup | in progress | `feat/m1-setup` |
| M2 — MongoDB + Models | Not started | `feat/m2-mongodb` |
| M3 — Auth | Not started | `feat/m3-auth` |
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
│   ├── mongodb.ts                  # Singleton connection
│   ├── models/User.ts
│   ├── models/Bot.ts
│   └── bot-registry.ts            # sport:league → endpoint URL map
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

**`bots` collection:**
```ts
{
  owner_id: String,        // NextAuth user id
  bot_name: String,
  sport: String,           // e.g. "soccer"
  league: String,          // e.g. "english-premier-league"
  bot_endpoint_url: String,// pre-built bot streaming endpoint
  created_at: Date
}
```

**`users` collection:** managed automatically by NextAuth MongoDB adapter.

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

## Key Files to Reference

- Full PRD: `PRD.md`
- This file: `CONTEXT.md`
