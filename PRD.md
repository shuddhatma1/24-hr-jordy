# PRD: Sports Chatbot Portal

---

## 1. Overview

A self-serve portal where sports league operators and team owners create, configure, and deploy an AI-powered stats chatbot in under 5 minutes — no engineering required. The owner picks their sport and league, customizes their bot's personality and branding, adds team-specific knowledge, and gets both a hosted URL and an embeddable widget to share with fans.

**This portal is an owner configuration tool.** The AI bot is pre-built and managed by a separate bot team — the portal's job is to collect owner inputs as cleanly and quickly as possible, store them, and route chat traffic to the correct bot endpoint. Fan experience and AI behaviour are out of scope for the portal team.

---

## 2. Problem Statement

Sports leagues and teams want to offer fans instant access to stats without building custom tooling. Today, fans Google stats or dig through official sites — a fragmented, low-engagement experience. Leagues have no easy way to offer an interactive, conversational stats experience without significant engineering investment.

---

## 3. Goals & Success Metrics

| Goal | Metric |
|---|---|
| Fast owner onboarding | Owner goes from sign-up to live chatbot URL in under 5 minutes |
| Working chatbot | Bot correctly answers queries during demo testing via streaming responses |
| Accessible to fans | Hosted URL loads and works on desktop and mobile without login |
| Prototype validation | Full end-to-end demo flow works without errors on Vercel production URL |

---

## 4. Non-Goals (Scope Boundary)

- No custom branding beyond color (no logo, no custom fonts, no bot avatar)
- No analytics or query logging dashboard — analytics sidebar item is "Coming Soon" only (future module)
- No multiple bots per owner account — one bot per owner
- No billing or paid tiers
- No team/multi-user accounts
- No email verification — owners can use the product immediately after signup
- No live/real-time score updates — bot handles stats from its own knowledge
- No actual AI processing in the portal — bot is pre-built and external; portal proxies to it
- How the bot consumes owner knowledge (system_context format, AI processing) — entirely the bot team's responsibility; portal only stores and forwards

---

## 5. Users & Personas

**Primary — League Operator / Team Owner**
- Non-technical or semi-technical
- Wants something that "just works" and looks credible
- Cares about: speed of setup, reliability of answers, ease of sharing
- Fear: bot gives wrong answers and embarrasses the league

**Secondary — Fan (end user of the chatbot)**
- Wants quick answers: standings, top scorers, recent results
- Expects conversational, natural responses — not raw data
- May be on mobile

---

## 6. User Stories

**Owner flows:**
1. As a league operator, I want to sign up with email so I can create my chatbot without talking to anyone.
2. As a league operator, I want to pick my sport and league from a list so I don't have to configure anything technical.
3. As a league operator, I want to receive a hosted URL after setup so I can share it with fans immediately.
4. As a league operator, I want to preview my chatbot before sharing it so I can verify it works.
5. As a league operator, I want to copy my chatbot URL from the dashboard with one click.
6. As a league operator, I want to customize the welcome message so fans get a greeting relevant to my club.
7. As a league operator, I want to set a brand color so my chatbot feels on-brand for my club or league.
8. As a league operator, I want to add FAQ entries so my bot can answer club-specific questions.
9. As a league operator, I want to upload a player roster or fixture CSV so my bot knows our team data.
10. As a league operator, I want an embed code so I can put the chatbot on my existing website.

**Fan flows:**
11. As a fan, I want to type a question and get a streamed, natural-language answer so the experience feels fast and conversational.
12. As a fan, I want the chatbot to answer club-specific questions (captain, fixtures, rules) that the owner has configured.
13. As a fan, I want to chat via a widget on the club's website without navigating away.

---

## 7. Functional Requirements

**Auth**
1. Must — Owner can sign up with email + password
2. Must — Owner can log in and session persists across page refreshes
3. Must — Unauthenticated access to `/dashboard` or sub-pages redirects to `/login`

**Bot Creation (modal within dashboard)**
4. Must — 3-step modal: (1) name your bot, (2) pick sport, (3) pick league
5. Must — Sport options: Soccer, Basketball, NFL, Baseball
6. Must — League options populated per sport from the bot registry
7. Must — On completion, a `bot_id` (MongoDB ObjectId) is generated and stored
8. Must — Selecting an unsupported league shows a clear error: "This league isn't available yet"
9. Must — Re-submitting when a bot already exists returns an error (1 bot per owner)

**Dashboard — Overview**
10. Must — Sidebar navigation with 4 sections: Overview, Customize, Knowledge, Settings
11. Must — Overview shows bot name, sport, league, creation date
12. Must — Shareable link with copy button ("Copied!" 2s feedback) and preview button
13. Must — Embed widget code snippet with copy button
14. Must — Log out button ends session
15. Must — Empty state with "Create chatbot" CTA when owner has no bot

**Dashboard — Customize**
16. Must — Owner can update bot name (1–100 chars)
17. Must — Owner can set a welcome message (max 300 chars) — shown to fans as the first chat message
18. Must — Owner can set persona/tone: Friendly, Professional, Enthusiastic
19. Must — Owner can set a primary brand color (hex) — applied to chatbot header
20. Must — All changes save via one "Save" button and apply immediately to the fan chat page

**Dashboard — Knowledge**
21. Must — FAQ tab: owner can add text entries (title + content), view list, delete entries
22. Must — Files tab: owner can upload PDF, CSV, or TXT files (max 5MB each)
23. Must — Uploaded file text is extracted server-side and stored — no binary storage
24. Must — All knowledge entries (FAQ + files) are injected as context into every chat conversation
25. Must — File list shows filename, size, status ("Ready"); delete button per file

**Dashboard — Settings**
26. Must — Owner can change sport/league; bot endpoint URL updates automatically
27. Must — Owner can delete their bot (with confirmation); all knowledge entries cascade-deleted

**Fan Chat Page**
28. Must — Page loads by `bot_id` — no login required
29. Must — Shows owner's custom welcome message (fallback: "Hi! Ask me anything about {league}.")
30. Must — Header uses owner's brand color (fallback: default blue)
31. Must — User message sent to `/api/chat`, response streamed token by token
32. Must — Chat history persists in-memory for the session
33. Must — Send disabled while streaming; streaming cursor (`▌`) shown
34. Must — Invalid `bot_id` shows: "This chatbot doesn't exist or has been removed"
35. Must — Supports `?embed=true` mode: compact layout for iframe embedding

**Embed Widget**
36. Must — `public/widget.js` is a self-contained script with no dependencies
37. Must — Script reads `data-bot-id` attribute from the `<script>` tag
38. Must — Injects a floating chat button (bottom-right) on the host page
39. Must — Clicking button opens a floating iframe panel with the chatbot
40. Must — Works on any website that can load a `<script>` tag

---

## 8. Non-Functional Requirements

- **Latency:** First streamed token should appear within 3 seconds of sending a message
- **Mobile:** Chat page and all owner-facing pages must be usable on mobile browsers without horizontal scroll
- **Security:** `bot_id` is a MongoDB ObjectId — not guessable; chat page is intentionally public (shareable)
- **Deployment:** App deployed to Vercel; each module ships as a merge to `main` → auto-deploy

---

## 9. Design & UX Notes

**Bot creation flow (modal):**
```
[Step 1]              [Step 2]           [Step 3]
Name your bot    →    Pick sport    →    Pick league    →    [Dashboard]
"City FC Bot"         Soccer             Premier League
```

**Dashboard layout:**
```
┌──────────┬──────────────────────────────────────────┐
│  ⚡ Bot   │  City FC Bot                             │
│          │  Soccer · English Premier League         │
│ Overview │                                          │
│ Customize│  ┌──────────────────┐ ┌────────────────┐ │
│ Knowledge│  │ Shareable Link   │ │ Embed Widget   │ │
│ Settings │  │ [url...]  [Copy] │ │ [<script>][Copy│ │
│          │  │ [Preview ↗]      │ │ Paste on site  │ │
│──────────│  └──────────────────┘ └────────────────┘ │
│ user@... │                                          │
│ Log out  │  [Customize →]  [Add Knowledge →]        │
└──────────┴──────────────────────────────────────────┘
```

**Customize panel:**
```
Bot name:        [City FC Bot              ]
Welcome message: [Welcome! Ask me anything...]  (300 char max)
Persona:         [Friendly ▼]
Brand color:     [●] [#3B82F6]  ← synced color picker + hex input
                 [Save changes]
```

**Knowledge panel:**
```
[FAQ / Text]  [Files]
─────────────────────────────────
Title:   [Who is the captain?      ]
Content: [Marcus Rashford since... ]
         [Add entry]

─────────────────────────────────
• Who is the captain?              [Delete]
  Marcus Rashford has been...
• Home game times                  [Delete]
  Home games at 7:30 PM...
```

**Fan chat page:**
```
┌─────────────────────────────────────┐
│  City FC Bot              [■ #3B82F6 header color]
├─────────────────────────────────────┤
│  Bot: Welcome! Ask me anything      │
│  about City FC.                     │
│                                     │
│              You: Who is captain?   │
│                                     │
│  Bot: Marcus Rashford has been ▌    │
├─────────────────────────────────────┤
│  [Type a question...      ] [Send]  │
└─────────────────────────────────────┘
```

---

## 10. Technical Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (app router) | Full-stack, single repo, deploys to Vercel |
| Auth | NextAuth.js v5 + credentials | Email/password, simplest for prototype |
| DB | MongoDB Atlas (free tier) | No SQL, no migrations, fast to prototype with |
| ORM | Mongoose | Schema validation + easy querying |
| Streaming | Native `fetch` + `ReadableStream` | Proxy bot stream directly — no extra library |
| Styling | Tailwind CSS | Fast, utility-first |
| Deployment | Vercel | Git push → auto-deploy |
| Dev bot | Express mock server (`:3001`) | Enables FE/BE dev without real bot |

**Bot integration model:**
The portal does NOT build or run the AI agent. A pre-built bot service exposes one streaming HTTP endpoint per league. The portal stores the mapping (`sport:league` → endpoint URL) in a hardcoded registry (`lib/bot-registry.ts`) and proxies chat messages to the correct endpoint.

**Required environment variables:**
```
MONGODB_URI=mongodb+srv://...
NEXTAUTH_SECRET=<random string>
NEXTAUTH_URL=http://localhost:3000      # production: https://yourapp.vercel.app
MOCK_BOT_URL=http://localhost:3001/chat # replaced with real bot URLs in production
```

---

## 11. API Surface

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/signup` | None | Create owner account |
| POST | `/api/auth/[...nextauth]` | — | NextAuth signin/signout/session |
| POST | `/api/bots` | Session | Create bot config for owner |
| GET | `/api/bots/me` | Session | Get owner's bot (dashboard) |
| PUT | `/api/bots/me` | Session | Update bot settings (name, welcome msg, persona, color, sport/league) |
| DELETE | `/api/bots/me` | Session | Delete bot + cascade data sources |
| GET | `/api/bots/[bot_id]` | None | Bot info including welcome_message + primary_color (fan chat page) |
| POST | `/api/chat` | None | Proxy message to bot with data source context, stream response |
| GET | `/api/data-sources` | Session | List owner's knowledge entries |
| POST | `/api/data-sources` | Session | Create FAQ text entry |
| POST | `/api/data-sources/upload` | Session | Upload + parse PDF/CSV/TXT file |
| DELETE | `/api/data-sources/[id]` | Session | Delete knowledge entry |

---

## 12. Build Approach

Built module by module. Each module is developed, reviewed, tested, committed, and deployed before moving to the next.

| Module | What ships |
|---|---|
| M1 — Project Setup | Next.js app + mock bot + GitHub repo + Netlify live URL |
| M2 — MongoDB + Models | DB connection + User + Bot schemas |
| M3 — Auth | Signup, login, session, route protection |
| M4 — Bot Registry | Sport/league → endpoint mapping |
| M5 — Wizard + Bot API | 3-step setup + `POST /api/bots` |
| M6 — Dashboard + Bot APIs | Dashboard UI + `GET /api/bots/me` + `GET /api/bots/[id]` |
| M7 — Chat Proxy API | `POST /api/chat` streaming proxy |
| M8 — Chat UI | Fan-facing chat page with streaming |
| M9 — Polish | Error states, mobile, loading, landing page |
| **M10 — Dashboard Overhaul** | **Sidebar layout, Overview panel, bot creation modal** |
| **M11 — Customize** | **Welcome message, persona, brand color — wired to fan chat** |
| **M12 — Knowledge Base** | **FAQ entries + file upload (PDF/CSV/TXT), injected into chat** |
| **M13 — Settings + Embed Widget** | **Change league, delete bot, `widget.js` embed script** |
| **M14 — Landing Page** | **Full landing page with hero, how-it-works, feature highlights** |

**Per-module workflow:** Develop → Code review (`/simplify`) → Test locally → Commit to feature branch → Push → Merge to `main` → Vercel auto-deploys → Verify on production.

---

## 13. Open Questions

| Question | Status |
|---|---|
| What does the real bot endpoint URL look like? | Pending — using mock for now |
| Will the bot be reachable publicly (not just localhost) for production? | Pending — may need ngrok or hosted bot |

---

## 14. Out of Scope / Future Work

- Custom branding beyond color (logo, fonts, bot avatar)
- Multiple chatbots per owner
- Usage analytics and query logs
- Live match / real-time score updates
- Paid tiers and billing
- Email verification on signup
- Team/multi-user accounts
- Embeddable widget with custom styling options
