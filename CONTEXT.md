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

**This portal owns stages 1–4 from the owner's perspective only.** The fan experience and the AI bot are handled by a separate bot team — do not design or engineer for those concerns here.

Concretely:
- **Fan UX** (chat page behaviour, response quality, session persistence) — bot team's domain
- **How the bot consumes knowledge** (system_context format, AI processing) — bot team's domain
- **Portal's job on knowledge**: collect owner inputs cleanly (FAQ text, uploaded files), store them, and make them available. How the bot uses them is not our concern.
- **Analytics**: sidebar item is present as "Coming Soon" — signals roadmap investment to owners. Full analytics dashboard is a future module.

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
| Streaming | Native `fetch` + `ReadableStream` | Proxy bot stream directly, no extra library |
| Styling | Tailwind CSS | Fast utility-first styling |
| Package manager | npm | Standard |
| Bot integration | Pre-built bot per league, portal proxies | Bot team builds agents independently |
| Dev bot | Express mock server on `:3001` | Develop portal without real bot |
| Stats source | NOT the portal's concern | Bot handles this internally |
| Dashboard routing (M10+) | Next.js nested routes `/dashboard/*` | Bookmarkable, middleware-protected, `usePathname()` drives sidebar |
| Embed widget (M13) | `public/widget.js` iframe to `/chat/[id]?embed=true` | Reuses chat page; no duplication; no external deps |
| Knowledge injection (M12) | `/api/chat` prepends DataSources as `system_context` | Mock bot ignores it; real bot uses it; no AI in portal |
| File storage (M12) | Parse on upload, store text in MongoDB only | No S3/Blob needed; binary discarded after extraction |
| Bot creation UX (M10) | Modal in dashboard, not separate `/setup` page | Owners stay in context; `/setup` becomes a redirect |

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
| M10 — Dashboard Overhaul | done | `feat/m10-dashboard` | #11 merged 2026-03-10 |
| M11 — Customize | not started | `feat/m11-customize` | — |
| M12 — Knowledge Base | not started | `feat/m12-knowledge` | — |
| M13 — Settings + Embed Widget | not started | `feat/m13-settings-embed` | — |
| M14 — Landing Page | not started | `feat/m14-landing` | — |

**M1–M9 complete and deployed. M10–M14 are the next phase — full dashboard overhaul.**

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
│   │   │   └── page.tsx            # [M11 NEW] Customize panel — name, welcome msg, persona, color
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
│       ├── chat/route.ts           # [M12] Fetch + inject DataSources as system_context
│       └── data-sources/
│           ├── route.ts            # [M12 NEW] GET + POST (FAQ entries)
│           ├── upload/route.ts     # [M12 NEW] POST multipart — parse PDF/CSV/TXT
│           └── [id]/route.ts       # [M12 NEW] DELETE
├── lib/
│   ├── mongodb.ts
│   ├── auth-helpers.ts
│   ├── bot-registry.ts
│   └── models/
│       ├── User.ts
│       ├── Bot.ts                  # [M11] +welcome_message, +persona, +primary_color (optional)
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
| DELETE | `/api/bots/me` | Session | Delete bot + cascade DataSources |
| GET | `/api/bots/[bot_id]` | None | Bot info — includes welcome_message + primary_color (fan chat page) |
| POST | `/api/chat` | None | Proxy to bot with DataSource context injected, stream response |
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
| `/dashboard/settings` | Required | Change league, delete bot |
| `/chat/[bot_id]` | None | Fan-facing chat UI — full page or embed mode (`?embed=true`) |

---

## MongoDB Schema

**`bots` collection** (`lib/models/Bot.ts`):
```ts
{
  owner_id: String,          // NextAuth user id; unique: true — enforces 1 bot per owner
  bot_name: String,          // required
  sport: String,             // e.g. "soccer"
  league: String,            // e.g. "english-premier-league"
  bot_endpoint_url: String,  // pre-built bot endpoint (never returned in API responses)
  welcome_message?: String,  // optional — custom first message shown to fans
  persona?: String,          // optional — 'friendly' | 'professional' | 'enthusiastic'
  primary_color?: String,    // optional — hex e.g. "#3B82F6", applied to chat header
  created_at: Date           // default: () => new Date()
}
```

**`data_sources` collection** (`lib/models/DataSource.ts`) — NEW:
```ts
{
  owner_id: String,          // session user id
  bot_id: String,            // owner's bot ObjectId string
  type: String,              // 'faq' | 'file'
  title: String,             // required, max 200 chars
  content: String,           // required — FAQ text OR extracted file text
  file_size?: Number,        // original file bytes (display only)
  original_filename?: String,// display name for file entries
  created_at: Date           // default: () => new Date()
}
// Index: { bot_id: 1 }
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
| Real bot endpoint URL format | Pending — mock used for now |
| Mock bot not publicly reachable in production | Pending — may need ngrok or hosted bot |

---

## Key Architectural Decisions (M10–M14)

| Decision | Choice | Reason |
|---|---|---|
| Dashboard routing | Next.js nested routes (`/dashboard/*`) | Bookmarkable URLs, middleware protection inherited, `usePathname()` drives active nav |
| Embed widget | `public/widget.js` injects iframe pointing to `/chat/[id]?embed=true` | Reuses existing chat page; zero duplication; no external dependencies |
| Knowledge injection | `/api/chat` fetches DataSources and sends `system_context` to bot endpoint | Mock bot ignores it; real bot can use it; no AI processing in portal |
| File storage | Parse on upload, store extracted text in MongoDB only | No S3/Blob service needed; binary discarded after extraction |
| Bot creation | Modal in dashboard, not a separate page | Better UX; owners stay in context; `/setup` becomes a redirect |
| Sidebar navigation | `DashboardShell` (`'use client'`) + `dashboard/layout.tsx` (server) | Server layout calls `auth()`; client shell handles `usePathname` + mobile state |

## Key Files to Reference

- Full PRD: `PRD.md`
- Module tracker: `TRACKER.md`
- Implementation plan: `.claude/plans/humble-wobbling-hippo.md`
- This file: `CONTEXT.md`
