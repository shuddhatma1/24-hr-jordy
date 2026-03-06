# PRD: Sports Chatbot Portal — Prototype

---

## 1. Overview

A self-serve web portal where sports league operators and team owners configure and deploy an AI-powered stats chatbot in under 5 minutes — no engineering required. The owner picks their sport and league, gets a hosted URL to share with fans. The AI chatbot is pre-built and runs as an independent service — the portal is purely a configuration, routing, and UI layer on top of it.

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

## 4. Non-Goals (Prototype Scope Boundary)

- No custom branding (colors, logo, bot avatar)
- No analytics or query logging dashboard
- No multiple bots per owner account
- No custom stats data source configuration — bot instances are pre-assigned
- No billing or paid tiers
- No embeddable `<script>` widget — hosted URL only
- No team/multi-user accounts
- No email verification — owners can use the product immediately after signup

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

**Fan flows:**
6. As a fan, I want to type a question and get a streamed, natural-language answer so the experience feels fast and conversational.
7. As a fan, I want the chatbot to tell me when it doesn't know something so I'm not misled.

---

## 7. Functional Requirements

**Auth**
1. Must — Owner can sign up with email + password
2. Must — Owner can log in and session persists across page refreshes
3. Must — Unauthenticated access to `/dashboard` or `/setup` redirects to `/login`

**Chatbot Configuration Wizard**
4. Must — 3-step wizard: (1) name your bot, (2) pick sport, (3) pick league
5. Must — Sport options: Soccer, Basketball, NFL, Baseball
6. Must — League options populated per sport from the bot registry (hardcoded for prototype)
7. Must — On completion, a `bot_id` (MongoDB ObjectId) is generated and stored
8. Must — Owner is shown their hosted chatbot URL: `yourapp.com/chat/{bot_id}`
9. Must — Selecting an unsupported league shows a clear error: "This league isn't available yet"
10. Must — Re-submitting wizard when a bot already exists returns an error (1 bot per owner)

**Owner Dashboard**
11. Must — After login, owner sees bot name, sport, league, and hosted URL
12. Must — Copy button copies URL to clipboard and shows "Copied!" confirmation
13. Must — "Preview Chatbot" opens `/chat/{bot_id}` in a new tab
14. Must — Log out button ends session

**Hosted Chat Page (Fan-facing)**
15. Must — Page loads bot name from DB by `bot_id` — no login required
16. Must — Shows welcome message: "Hi! Ask me anything about {league}."
17. Must — User message sent to `/api/chat`, response streamed token by token
18. Must — Chat history persists in-memory for the session (not across sessions)
19. Must — Send button disabled and input locked while bot is streaming
20. Must — Invalid `bot_id` shows: "This chatbot doesn't exist or has been removed"
21. Should — Streaming cursor (`▌`) shown on last bot message while response is arriving

---

## 8. Non-Functional Requirements

- **Latency:** First streamed token should appear within 3 seconds of sending a message
- **Mobile:** Chat page and all owner-facing pages must be usable on mobile browsers without horizontal scroll
- **Security:** `bot_id` is a MongoDB ObjectId — not guessable; chat page is intentionally public (shareable)
- **Deployment:** App deployed to Vercel; each module ships as a merge to `main` → auto-deploy

---

## 9. Design & UX Notes

**Owner wizard flow:**
```
[Step 1]              [Step 2]           [Step 3]
Name your bot    →    Pick sport    →    Pick league    →    [Bot is live!]
"City FC Bot"         Soccer             Premier League       yourapp.com/chat/abc123
```

**Owner dashboard:**
```
┌─────────────────────────────────────────────────┐
│  Welcome back, [email]              [Log out]   │
├─────────────────────────────────────────────────┤
│  Your Chatbot                                   │
│    Name:    City FC Bot                         │
│    Sport:   Soccer                              │
│    League:  English Premier League              │
│                                                 │
│  Your URL:                                      │
│  [ yourapp.com/chat/abc-123 ]  [Copy URL]       │
│                                                 │
│              [Preview Chatbot ↗]                │
└─────────────────────────────────────────────────┘
```

**Fan chat page:**
```
┌─────────────────────────────────────┐
│  City FC Bot                        │
├─────────────────────────────────────┤
│  Bot: Hi! Ask me anything about     │
│  the English Premier League.        │
│                                     │
│                    You: Who top     │
│                    scored last      │
│                    season?          │
│                                     │
│  Bot: ▌ (streaming...)              │
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
| GET | `/api/bots/me` | Session | Get owner's bot (for dashboard) |
| GET | `/api/bots/[bot_id]` | None | Get bot info (for chat page) |
| POST | `/api/chat` | None | Proxy message to bot, stream response |

---

## 12. Build Approach

Built module by module. Each module is developed, reviewed, tested, committed, and deployed before moving to the next.

| Module | What ships |
|---|---|
| M1 — Project Setup | Next.js app + mock bot + GitHub repo + Vercel live URL |
| M2 — MongoDB + Models | DB connection + User + Bot schemas |
| M3 — Auth | Signup, login, session, route protection |
| M4 — Bot Registry | Sport/league → endpoint mapping |
| M5 — Wizard + Bot API | 3-step setup + `POST /api/bots` |
| M6 — Dashboard + Bot APIs | Dashboard UI + `GET /api/bots/me` + `GET /api/bots/[id]` |
| M7 — Chat Proxy API | `POST /api/chat` streaming proxy |
| M8 — Chat UI | Fan-facing chat page with streaming |
| M9 — Polish | Error states, mobile, loading, landing page |

**Per-module workflow:** Develop → Code review (`/simplify`) → Test locally → Commit to feature branch → Push → Merge to `main` → Vercel auto-deploys → Verify on production.

---

## 13. Open Questions

| Question | Status |
|---|---|
| What does the real bot endpoint URL look like? | Pending — using mock for now |
| Will the bot be reachable publicly (not just localhost) for production? | Pending — may need ngrok or hosted bot |

---

## 14. Out of Scope / Future Work

- Custom branding per chatbot (colors, logo)
- `<script>` embed widget for third-party sites
- Multiple chatbots per owner
- Usage analytics and query logs
- Custom stats data source (CSV upload, custom API)
- Live match / real-time score updates
- Bot personality selection
- Paid tiers and billing
- Email verification on signup
