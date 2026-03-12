# Project Context — Sports Chatbot Portal

> Pull this file at the start of any new conversation to restore full project context.
> Also read: PRD.md (full product requirements)

---

## Product Scope & Philosophy — Read This First

**The portal has one job: help a league owner go from "I signed up" to "I have a fully configured chatbot" as fast as possible.**

The owner's journey has four stages:
```
Sign up → Create bot → Configure it → Share it
```

**This portal owns stages 1–4 from the owner's perspective only.** The portal also owns the fan-facing chat experience and the AI bot (Gemini 2.0 Flash) — all in one codebase.

Concretely:
- **Fan UX** (chat page, streaming response) — owned here: `app/chat/[bot_id]/page.tsx` + `ChatWindow.tsx`
- **AI bot** — owned here: `app/api/chat/route.ts` calls Gemini 2.0 Flash with Google Search grounding directly
- **Portal's job on knowledge**: collect owner inputs cleanly (FAQ text, uploaded files), store them, inject as `system_context` into Gemini system instruction
- **Analytics**: `/dashboard/analytics` — stat cards (conversations, messages, avg), daily bar chart, period toggle (7d/30d/all). `ChatEvent` model logs events fire-and-forget from `/api/chat`.

**Dashboard principle:** every page should guide the owner to their next action. The dashboard is not just a data display — it is a configuration journey. Show progress, surface what's missing, celebrate what's done.

---

## What We're Building

A self-serve portal where sports league owners sign up, configure an AI stats chatbot, customize it, add their own knowledge (FAQ text + uploaded files), and deploy it via a shareable link or an embeddable widget. The AI bot is **pre-built and external** — the portal handles configuration, knowledge management, routing, and UI. It stores owner-provided knowledge and makes it available for the bot team to consume.

---

## Key Decisions Made

| Decision | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (app router) | Full-stack, single repo |
| Database | MongoDB Atlas (free tier) | No SQL, no migrations, fast prototype |
| Auth | NextAuth.js v5 + credentials | Email/password, simplest for prototype |
| Deployment | Netlify + `@netlify/plugin-nextjs` | User preference; plugin handles SSR/streaming |
| **Netlify production branch** | **`main`** | **Pushes to other branches trigger cancelled previews, not production deploys** |
| Auth config split | `auth.config.ts` (edge) + `auth.ts` (server) | Mongoose uses `eval` — banned in Edge Runtime. Middleware must never import `auth.ts` |
| Streaming | `TransformStream` + Gemini SDK `sendMessageStream` | Direct Gemini stream → SSE; no external bot proxy |
| Styling | Tailwind CSS | Fast utility-first styling |
| Package manager | npm | Standard |
| Bot integration | **Gemini 2.0 Flash + Google Search grounding** called directly from `/api/chat` | Single codebase; no separate bot service; `@google/generative-ai` SDK |
| Dev bot | Express mock server on `:3001` (still usable via `MOCK_BOT_URL`) | Local dev without burning API credits |
| Stats source | Google Search grounding via Gemini `tools: [{ googleSearch: {} }]` | Automatic real-time search; no manual data pipeline |
| Dashboard routing (M10+) | Next.js nested routes `/dashboard/*` | Bookmarkable, middleware-protected, `usePathname()` drives sidebar |
| Embed widget (M13) | `public/widget.js` iframe to `/chat/[id]?embed=true` | Reuses chat page; no duplication; no external deps |
| Knowledge injection (M12) | `/api/chat` prepends DataSources as `system_context` in Gemini system instruction | Owner knowledge + Gemini grounding; bounded at 100K chars |
| File storage (M12) | Parse on upload, store text in MongoDB only | No S3/Blob needed; binary discarded after extraction |
| Bot creation UX (M10) | Modal in dashboard, not separate `/setup` page | Owners stay in context; `/setup` becomes a redirect |
| `bot_endpoint_url` | Optional field in `Bot` schema (vestigial) | Gemini called directly; field kept to avoid migration on existing records |

---

## Infrastructure

| Item | Value |
|---|---|
| GitHub repo | `https://github.com/shuddhatma1/24-hr-jordy.git` |
| MongoDB cluster | `cluster0.fuhufq5.mongodb.net` |
| MongoDB user | `shuddhatma` |
| MongoDB DB name | `sports-portal` |
| MongoDB URI format | `mongodb+srv://shuddhatma:<pass>@cluster0.fuhufq5.mongodb.net/sports-portal?appName=Cluster0` |
| Netlify | Connected — auto-deploys from `main` (production branch) |
| Netlify URL | `https://jordy-self-serviceable.netlify.app` |
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
| M10 — Dashboard Overhaul | done | `feat/m10-dashboard` | #11 merged 2026-03-10 |
| M11 — Customize | done | `feat/m11-customize` | #12 |
| M12 — Knowledge Base | done | `feat/m12-knowledge` | #13 merged |
| M13 — Settings + Embed Widget | done | `feat/m13-settings-embed` | #14 merged 2026-03-10 |
| M14 — Landing Page | done | `feat/m14-landing` | #15 merged 2026-03-11 |
| M15 — Analytics Dashboard | done | `feat/m15-analytics` | #16 merged 2026-03-11 |
| UI Overhaul (Phases 2–4) | done | `feat/ui-overhaul-phases-2-3-4` | #18 merged 2026-03-11 |
| Embed Widget UX Fix | done | `fix/embed-widget-ux` | #19 merged 2026-03-12 |

**M1–M15 + UI Overhaul + Embed Fix complete.**

---

## Per-Module Workflow

```
DEVELOP → REVIEW (/simplify) → TEST → COMMIT → PUSH branch → MERGE → Netlify deploys → VERIFY
```

Branch strategy: each feature branch is pushed and merged into `main`. **Netlify production branch is `main`** — pushing to any other branch only triggers cancelled preview deploys, not production deploys. Always merge to `main` to deploy.

---

## File Structure (actual + planned)

```
sports-portal/
├── mock-bot/server.js              # Express SSE mock bot on :3001
├── netlify.toml                    # base=sports-portal, @netlify/plugin-nextjs
├── .env.local                      # Local secrets (never committed)
├── .env.example                    # Committed env var template
├── public/
│   └── widget.js                   # [M13 NEW] Embed widget script — vanilla JS, no deps
├── app/
│   ├── page.tsx                    # Landing page — [M14] full hero + how-it-works rewrite
│   ├── layout.tsx                  # Root layout with Providers, Geist fonts
│   ├── globals.css
│   ├── __tests__/page.test.tsx
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── setup/
│   │   ├── page.tsx                # [M10] Simplified to redirect('/dashboard')
│   │   └── loading.tsx             # Per-route loading state (exists)
│   ├── dashboard/
│   │   ├── layout.tsx              # [M10 NEW] Server component — wraps all dashboard in DashboardShell
│   │   ├── page.tsx                # [M10] Rewrite — Overview panel (share link + embed code)
│   │   ├── loading.tsx
│   │   ├── customize/
│   │   │   ├── page.tsx            # [M11 NEW] Customize panel — name, welcome msg, persona, color
│   │   │   └── __tests__/customize-page.test.tsx  # [M11 NEW] 8 tests — load, 404, 500, save/error, persona
│   │   ├── analytics/
│   │   │   ├── page.tsx            # [M15 NEW] Analytics panel — stat cards + bar chart + period toggle
│   │   │   ├── loading.tsx         # [M15 NEW] Per-route loading state
│   │   │   └── __tests__/analytics-page.test.tsx  # [M15 NEW] 8 tests
│   │   ├── data-sources/
│   │   │   └── page.tsx            # [M12 NEW] Knowledge panel — FAQ + file upload
│   │   └── settings/
│   │       └── page.tsx            # [M13 NEW] Settings panel — change league, delete bot
│   ├── chat/[bot_id]/
│   │   ├── page.tsx                # [M11] Pass welcomeMessage + primaryColor + isEmbed to ChatWindow
│   │   └── loading.tsx
│   └── api/
│       ├── auth/signup/route.ts
│       ├── auth/[...nextauth]/route.ts
│       ├── bots/route.ts           # POST /api/bots (unchanged)
│       ├── bots/me/route.ts        # [M11] +PUT, +DELETE; extend GET response
│       ├── bots/[bot_id]/route.ts  # [M11] Return welcome_message + primary_color
│       ├── analytics/route.ts      # [M15 NEW] GET — owner analytics (totals + daily breakdown)
│       ├── chat/route.ts           # [M15] +fire-and-forget ChatEvent logging; [M12] DataSource injection
│       └── data-sources/
│           ├── route.ts            # [M12 NEW] GET + POST (FAQ entries)
│           ├── upload/route.ts     # [M12 NEW] POST multipart — parse PDF/CSV/TXT
│           └── [id]/route.ts       # [M12 NEW] DELETE
├── lib/
│   ├── mongodb.ts
│   ├── auth-helpers.ts
│   ├── bot-registry.ts
│   ├── color-utils.ts              # [UI] isLightColor() — shared by ChatWindow + ChatPreview
│   └── models/
│       ├── User.ts
│       ├── Bot.ts                  # [M11] +welcome_message, +persona, +primary_color (optional)
│       ├── ChatEvent.ts            # [M15 NEW] Analytics event model — TTL 90d, no content stored
│       └── DataSource.ts           # [M12 NEW] Knowledge entries model
├── components/
│   ├── providers.tsx
│   ├── dashboard/
│   │   ├── DashboardShell.tsx      # [M10 NEW] 'use client' — sidebar + layout
│   │   └── CreateBotModal.tsx      # [M10 NEW] 3-step modal for bot creation
│   ├── ui/
│   │   └── Toast.tsx               # [M12 NEW] 'use client' — fixed-position toast
│   └── chat/
│       ├── ChatWindow.tsx          # [M11] +welcomeMessage, +primaryColor, +isEmbed props
│       ├── MessageBubble.tsx
│       ├── ChatInput.tsx
│       └── StreamingCursor.tsx
├── types/
│   ├── global.d.ts
│   └── next-auth.d.ts
├── auth.config.ts
├── auth.ts
└── middleware.ts
```

Legend: `[Mx]` = modified in module x · `[Mx NEW]` = new file in module x

---

## API Surface

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/signup` | None | Create owner account |
| POST/GET | `/api/auth/[...nextauth]` | — | NextAuth signin/signout/session |
| POST | `/api/bots` | Session | Create bot config |
| GET | `/api/bots/me` | Session | Owner's bot — includes welcome_message, persona, primary_color, created_at |
| PUT | `/api/bots/me` | Session | Update bot settings (name, welcome msg, persona, color, sport/league) |
| DELETE | `/api/bots/me` | Session | Delete bot + cascade DataSources + ChatEvents |
| GET | `/api/bots/[bot_id]` | None | Bot info — includes welcome_message + primary_color (fan chat page) |
| POST | `/api/chat` | None | Call Gemini 2.0 Flash directly; inject DataSource `system_context` + persona into system instruction; stream SSE response; log ChatEvent (fire-and-forget) |
| GET | `/api/analytics` | Session | Owner analytics — totals + daily breakdown; `?period=7d\|30d\|all` |
| GET | `/api/data-sources` | Session | List owner's knowledge entries; `?type=faq\|file` filter |
| POST | `/api/data-sources` | Session | Create FAQ text entry |
| POST | `/api/data-sources/upload` | Session | Upload + parse PDF/CSV/TXT — stores extracted text |
| DELETE | `/api/data-sources/[id]` | Session | Delete knowledge entry (scoped to owner) |

---

## User Flows

**Owner (first time):** `/` → signup → `/dashboard` (empty state) → "Create chatbot" modal → Overview (share link + embed code) → Customize → Knowledge → share link with fans

**Owner (returning):** `/login` → `/dashboard` (Overview) → any sidebar section

**Fan via link:** receives `yourapp.com/chat/{bot_id}` → full-page chat UI (no login)

**Fan via embed:** visits owner's website → floating chat bubble → clicks → iframe chat panel

---

## Pages & Key Components

| Page | Auth | Purpose |
|---|---|---|
| `/` | None | Landing — hero, how-it-works, feature highlights, CTAs |
| `/signup` | None | Owner registration |
| `/login` | None | Owner login |
| `/setup` | Required | Redirects to `/dashboard` (setup now in modal) |
| `/dashboard` | Required | Overview — bot info, shareable link, embed widget code |
| `/dashboard/customize` | Required | Edit name, welcome message, persona, brand color |
| `/dashboard/data-sources` | Required | Knowledge base — FAQ entries + file uploads |
| `/dashboard/analytics` | Required | Analytics — conversations, messages, avg msgs/conv, daily chart, period toggle |
| `/dashboard/settings` | Required | Change league, delete bot |
| `/chat/[bot_id]` | None | Fan-facing chat UI — full page or embed mode (`?embed=true`) |

---

## MongoDB Schema

**`bots` collection** (`lib/models/Bot.ts`):
```ts
{
  owner_id: String,          // NextAuth user id; unique: true — enforces 1 bot per owner
  bot_name: String,          // required, maxlength: 100
  sport: String,             // e.g. "soccer"
  league: String,            // e.g. "english-premier-league"
  bot_endpoint_url?: String, // vestigial — Gemini called directly; optional; never returned in API responses
  welcome_message?: String,  // optional — maxlength: 300; custom first message shown to fans
  persona?: String,          // optional — enum: 'friendly' | 'professional' | 'enthusiastic'
  primary_color?: String,    // optional — match: /^#[0-9A-Fa-f]{6}$/; applied to chat header
  created_at: Date           // default: () => new Date()
}
```

**`data_sources` collection** (`lib/models/DataSource.ts`) — NEW:
```ts
{
  owner_id: String,          // session user id; indexed
  bot_id: String,            // owner's bot ObjectId string; indexed
  type: String,              // 'faq' | 'file'
  title: String,             // required, max 200 chars
  content: String,           // required, max 50000 chars — FAQ text OR extracted file text
  file_size?: Number,        // original file bytes (display only)
  original_filename?: String,// display name for file entries (sanitized, max 200 chars)
  created_at: Date           // default: () => new Date()
}
// Indexes: { owner_id: 1 }, { bot_id: 1 }
```

**`chat_events` collection** (`lib/models/ChatEvent.ts`) — NEW:
```ts
{
  bot_id: String,            // required; indexed with created_at
  owner_id: String,          // required; indexed with created_at
  event_type: String,        // required — 'conversation_start' | 'message'
  conversation_id?: String,  // optional — client-generated UUID per chat session
  created_at: Date           // default: () => new Date(); TTL: 90 days auto-expiry
}
// Indexes: { bot_id: 1, created_at: -1 }, { owner_id: 1, created_at: -1 }
// No message content stored — privacy-friendly event counts only
```

**`users` collection** (`lib/models/User.ts`) — unchanged:
```ts
{
  email: String,             // unique, lowercase, trim, match regex /^\S+@\S+\.\S+$/
  passwordHash: String,
  createdAt: Date            // camelCase; default: () => new Date()
}
```
Note: `createdAt` (User) vs `created_at` (Bot/DataSource) — intentional.

---

## Bot Registry

Maps `"sport:league"` → bot streaming endpoint URL. In dev, all entries point to `process.env.MOCK_BOT_URL`. Registry values are **thunk functions** — env var read at call-time, not module load, enabling test overrides without module reloading.

**6 supported entries:** EPL, La Liga, Bundesliga, NBA, NFL, MLB

In production: replace `MOCK_BOT_URL` with per-league env vars (e.g. `EPL_BOT_URL`).

---

## Open Questions

| Question | Status |
|---|---|
| Real bot endpoint URL format | **Resolved** — Gemini 2.0 Flash called directly; no external bot endpoint needed |
| Mock bot not publicly reachable in production | **Resolved** — mock bot only used for local dev (set `MOCK_BOT_URL`); production uses Gemini |

---

## Key Architectural Decisions (M10–M14)

| Decision | Choice | Reason |
|---|---|---|
| Dashboard routing | Next.js nested routes (`/dashboard/*`) | Bookmarkable URLs, middleware protection inherited, `usePathname()` drives active nav |
| Embed widget | `public/widget.js` injects iframe pointing to `/chat/[id]?embed=true` | Reuses existing chat page; zero duplication; no external dependencies |
| Knowledge injection | `/api/chat` fetches DataSources, builds Gemini system instruction with `system_context` + persona + bot identity | Owner knowledge + Google Search grounding; bounded at 100K chars |
| File storage | Parse on upload, truncate to 50K chars, store in MongoDB only | No S3/Blob service needed; binary discarded after extraction; content capped |
| Gemini integration | `@google/generative-ai` SDK, `gemini-2.0-flash`, `tools: [{ googleSearch: {} }]` | Real-time sports answers via Google Search grounding; single-codebase, no separate bot service |
| Gemini streaming | `chat.sendMessageStream()` → `TransformStream` → SSE `data: {"token":"..."}` | Direct stream from Gemini to browser; `[DONE]` sentinel; citation markers stripped |
| Role mapping | `assistant` → `model` before Gemini `startChat({ history })` | Gemini uses `user`/`model`; portal uses `user`/`assistant` — converted at API boundary |
| System instruction | Bot name + league + persona + DataSources assembled per-request | Every bot gets customized personality and owner knowledge injected |
| Gemini timeout | `AbortController` with 20s timeout (Netlify free functions: 10s, Pro: 26s) | Leaves buffer for function overhead |
| Message validation | Messages must alternate `user`/`assistant`; strip system-role; last must be `user` | Gemini requires strict alternation; sanitized before `startChat()` |
| Bot creation | Modal in dashboard, not a separate page | Better UX; owners stay in context; `/setup` becomes a redirect |
| Sidebar navigation | `DashboardShell` (`'use client'`) + `dashboard/layout.tsx` (server) | Server layout calls `auth()`; client shell handles `usePathname` + mobile state |
| Analytics event model (M15) | `ChatEvent` — `event_type`, `conversation_id`, no content; 90-day TTL | Privacy-friendly; free-tier storage safety; fire-and-forget from `/api/chat` |
| Message counting (M15) | `total_messages` excludes `conversation_start` events | Accurate "Messages" stat — only counts actual user messages, not session starts |
| Conversation tracking (M15) | Client-generated `conversation_id` UUID per chat session | Reliable session identification independent of message history length |
| Analytics bar chart (M15) | Capped to last 14 entries; `reduce` for max calculation | Readable at all period lengths; avoids call-stack overflow on large arrays |

## Key Files to Reference

- Full PRD: `PRD.md`
- Module tracker: `TRACKER.md`
- Implementation plan: `.claude/plans/humble-wobbling-hippo.md`
- This file: `CONTEXT.md`
