# Project Tracker — Sports Chatbot Portal

## Status Legend
`not started` · `in progress` · `done` · `blocked`

---

## Deployment Info
| Item | Value |
|---|---|
| GitHub | https://github.com/shuddhatma1/24-hr-jordy.git |
| Netlify URL | https://jordy-self-serviceable.netlify.app |
| Last deployed | 2026-03-11 (M14 landing page, PR #15 merged) |

---

## Modules

| # | Module | Status | Branch | Deployed | Notes |
|---|---|---|---|---|---|
| M1 | Project Setup | done | `feat/m1-setup` | No | |
| M2 | MongoDB + Models | done | `feat/m2-mongodb` | Yes | PR #2 merged |
| M3 | Auth | done | `feat/m3-auth` | Yes | PR #3 + #4 merged |
| M4 | Bot Registry | done | `feat/m4-registry` | Yes | PR #5 merged |
| M5 | Wizard + Bot API | done | `feat/m5-wizard` | Yes | PR #6 merged |
| M6 | Dashboard + Bot APIs | done | `feat/m6-dashboard` | Yes | PR #7 merged |
| M7 | Chat Proxy API | done | `feat/m7-chat-api` | Yes | PR #8 merged |
| M8 | Chat UI | done | `feat/m8-chat-ui` | Yes | PR #9 merged 2026-03-09 |
| M9 | Polish | done | `feat/m9-polish` | Yes | PR #10 merged 2026-03-09 |
| M10 | Dashboard Overhaul | done | `feat/m10-dashboard` | Yes | PR #11 merged 2026-03-10 |
| M11 | Customize | done | `feat/m11-customize` | Yes | PR #12 merged 2026-03-10 |
| M12 | Knowledge Base | done | `feat/m12-knowledge` | Yes | PR #13 merged; FAQ + file upload (PDF/CSV/TXT) |
| M13 | Settings + Embed Widget | done | `feat/m13-settings-embed` | Yes | PR #14 merged 2026-03-10; 249 tests |
| Gemini | Real Bot Integration | **done** | `main` | Yes | Gemini 2.0 Flash + Google Search; direct SDK call in `/api/chat`; `@google/generative-ai` |
| M14 | Landing Page | done | `feat/m14-landing` | Yes | PR #15 merged 2026-03-11; hero, how-it-works, features, accessibility fixes; 249 tests |
| M15 | Analytics Dashboard | not started | `feat/m15-analytics` | No | Owner usage analytics — sidebar "Coming Soon" item added in M10 — **NEXT** |

---

## Acceptance Criteria

### M1 — Project Setup
- [ ] `cd sports-portal && npm run dev` starts Next.js on `:3000` with no errors
- [ ] `cd sports-portal/mock-bot && node server.js` starts mock bot on `:3001`
- [ ] `POST http://localhost:3001/chat` returns a streaming SSE response
- [ ] `npm run lint` exits 0
- [ ] `npm run type-check` exits 0
- [ ] `npm run test` exits 0 (even if no tests yet)
- [ ] `netlify.toml` present with `@netlify/plugin-nextjs`
- [ ] `.env.example` committed with all required var names (no values)
- [ ] `.env.local` is gitignored and not committed

### M2 — MongoDB + Models
- [x] `lib/mongodb.ts` exports a singleton Mongoose connection (no multiple connections on hot reload)
- [x] `User` model has: email (unique, required), passwordHash (required), createdAt
- [x] `Bot` model has: owner_id, bot_name, sport, league, bot_endpoint_url, created_at
- [x] Connecting with a valid `MONGODB_URI` succeeds without errors in dev
- [x] Connecting with an invalid URI throws a clear error (not silent)
- [x] `npm run type-check` exits 0

### M3 — Auth
- [x] `POST /api/auth/signup` with valid email+password creates a user and returns 201
- [x] `POST /api/auth/signup` with duplicate email returns 409
- [x] `POST /api/auth/signup` with missing fields returns 400
- [x] Passwords are stored hashed (bcrypt), never plaintext
- [x] Login via NextAuth credentials succeeds and sets a session cookie
- [x] Login with wrong password returns an error (not 500)
- [x] `GET /dashboard` without session redirects to `/login`
- [x] `GET /setup` without session redirects to `/login`
- [x] Session persists across page refresh
- [x] `npm run lint && npm run type-check && npm run test` all exit 0

### M4 — Bot Registry
- [x] `lib/bot-registry.ts` exports a `getEndpointUrl(sport, league)` function
- [x] Returns `MOCK_BOT_URL` for all valid entries in dev
- [x] Returns `null` (not throws) for an unsupported `sport:league` combo
- [x] All 6 supported leagues are present: EPL, La Liga, Bundesliga, NBA, NFL, MLB
- [x] Unit tests cover: valid lookup, unsupported league returns null
- [x] `npm run type-check` exits 0

### M5 — Wizard + Bot API
- [x] 3-step wizard renders: Step 1 (name), Step 2 (sport), Step 3 (league)
- [x] League options update when sport changes
- [x] Selecting an unsupported league shows "This league isn't available yet"
- [x] `POST /api/bots` with valid session + data creates bot and returns `bot_id`
- [x] `POST /api/bots` with no session returns 401
- [x] `POST /api/bots` when owner already has a bot returns 409
- [x] `POST /api/bots` with missing fields returns 400
- [x] After wizard completes, user is redirected to `/dashboard`
- [x] `npm run lint && npm run type-check && npm run test` all exit 0

### M6 — Dashboard + Bot APIs
- [x] `/dashboard` shows bot name, sport, league, and hosted URL
- [x] Copy button copies the URL and shows "Copied!" confirmation
- [x] "Preview Chatbot" opens `/chat/{bot_id}` in a new tab
- [x] Log out button ends session and redirects to `/login`
- [x] `GET /api/bots/me` with valid session returns bot data
- [x] `GET /api/bots/me` with no session returns 401
- [x] `GET /api/bots/me` when owner has no bot returns 404
- [x] `GET /api/bots/[bot_id]` with valid ObjectId returns bot name + league (no sensitive fields)
- [x] `GET /api/bots/[bot_id]` with invalid/unknown id returns 404
- [x] `npm run lint && npm run type-check && npm run test` all exit 0

### M7 — Chat Proxy API
- [x] `POST /api/chat` with valid `bot_id` + `messages` proxies to mock bot and streams response
- [x] First token arrives within 3 seconds
- [x] `Content-Type: text/event-stream` set on response
- [x] Stream is piped directly — not buffered
- [x] If bot endpoint is unreachable, returns 502 (not 500, not unhandled rejection)
- [x] If `bot_id` not found in DB, returns 404
- [x] Request body over 50kb is rejected with 413
- [x] Bot endpoint URL always comes from DB — never from user input
- [x] `npm run lint && npm run type-check && npm run test` all exit 0

### M8 — Chat UI
- [x] `/chat/{bot_id}` loads without login and shows bot name
- [x] Welcome message: "Hi! Ask me anything about {league}."
- [x] User message appears immediately on send
- [x] Bot response streams token by token with `▌` cursor
- [x] Input and send button are disabled while streaming
- [x] Chat history persists for the session (not across sessions)
- [x] Invalid `bot_id` shows: "This chatbot doesn't exist or has been removed"
- [x] Page is usable on mobile (no horizontal scroll)
- [x] `npm run lint && npm run type-check && npm run test` all exit 0

### M9 — Polish
- [x] Landing page (`/`) has Sign Up and Log In CTAs
- [x] All error states have clear user-facing messages (no raw error objects shown)
- [x] Loading states on all async actions (login, signup, wizard submit)
- [x] All pages pass mobile layout check (no horizontal scroll at 375px)
- [x] No `console.error` or unhandled promise rejections in browser console during happy path
- [x] End-to-end demo flow works: signup → setup → dashboard → copy URL → fan chat → streaming response
- [x] `npm run lint && npm run type-check && npm run test` all exit 0

---

## Deployment Log
| Date | Module | What shipped | Netlify build |
|---|---|---|---|
| 2026-03-06 | M2 | MongoDB connection + User/Bot models | triggered |
| 2026-03-06 | M3 | Auth — NextAuth v5, signup, route protection | triggered |
| 2026-03-06 | M3 hotfix | auth.config.ts split (Edge Runtime), trustHost, AUTH_SECRET | triggered |
| 2026-03-07 | M4 | Bot registry — sport/league → endpoint map, 14 tests | triggered |
| 2026-03-08 | M5 | Wizard UI + POST /api/bots — 3-step setup, 6 tests | triggered |
| 2026-03-09 | M5 post-review | connectDB fix, 401 redirect, text visibility, 49 tests | triggered |
| 2026-03-09 | M6 | Dashboard + GET /api/bots/me + GET /api/bots/[bot_id], setup redirect fix, post-review fixes (URL fallback, error escape, loading state, findById), 59 tests | triggered |
| 2026-03-09 | M7 | POST /api/chat streaming proxy — 50kb limit, 502 on unreachable endpoint, direct stream pipe, 66 tests | triggered |
| 2026-03-09 | M7 post-review | null body guard (400 not 500), parseInt→Number, botRes.body null check, X-Accel-Buffering header, fetch timeout TODO, 2 new tests, 68 tests total | triggered |
| 2026-03-09 | M8 | Chat UI — fan-facing chat page, SSE streaming, ChatWindow/MessageBubble/ChatInput/StreamingCursor, post-review fixes (useCallback, stable keys, scroll fix, AbortError guard, React.cache, loading.tsx), 111/112 tests passing | triggered |
| 2026-03-09 | M9 | Polish — hero landing page with CTAs, setup blank-flash fix, loading.tsx for /setup + /dashboard, PR review fixes (main landmark, focus rings, metadata), 115 tests | triggered |
| 2026-03-10 | M10 | Dashboard overhaul — sidebar layout, DashboardShell, overview panel, bot creation modal, empty state, /setup redirect, 136 tests | triggered |
| 2026-03-10 | M11 | Customize — welcome_message + persona + primary_color; PUT /api/bots/me with full validation; ChatWindow brand color + contrast; customize page + tests; 156 tests | triggered |
| 2026-03-10 | M12 | Knowledge Base — DataSource model; GET/POST /api/data-sources; POST /api/data-sources/upload (PDF/CSV/TXT); DELETE /api/data-sources/[id]; chat system_context injection; Toast component; knowledge page; 225 tests | pending |
| 2026-03-10 | M13 | Settings + Embed — change league, delete bot, widget.js embed script, ?embed=true chat mode; 249 tests | triggered |
| 2026-03-11 | M14 | Landing Page — hero, how-it-works, feature highlights, bottom CTA, footer; accessibility (skip-to-content, aria-labelledby, landmark tests); 249 tests | triggered |

---

---

### M10 — Dashboard Overhaul
- [x] Sidebar navigation visible and functional on all `/dashboard/*` routes
- [x] Active nav item highlighted based on current route
- [x] Sidebar collapses to hamburger menu on mobile
- [x] Analytics sidebar item visible as "Coming Soon" (non-clickable, badged)
- [x] Overview panel shows bot name, sport, league, creation date
- [x] Shareable link card: URL + copy button + preview button
- [x] Embed widget card: `<script>` snippet + copy code button
- [x] Empty state shown when owner has no bot (no redirect to /setup)
- [x] "Create chatbot" button opens modal with 3-step flow
- [x] Modal closes and overview updates on successful bot creation
- [x] `/setup` redirects to `/dashboard`
- [x] `npm run lint && npm run type-check && npm run test` all exit 0

### M11 — Customize
- [x] Customize page pre-populates from `GET /api/bots/me`
- [x] Owner can update bot name, welcome message, persona, brand color
- [x] `PUT /api/bots/me` saves all fields; validates persona and hex color
- [x] "Changes saved" feedback on success; error message on failure
- [x] Fan chat page uses owner's welcome_message (fallback: default)
- [x] Fan chat page applies owner's primary_color to header (fallback: default blue)
- [x] `GET /api/bots/[bot_id]` returns welcome_message + primary_color
- [x] `npm run lint && npm run type-check && npm run test` all exit 0

### M12 — Knowledge Base
- [x] FAQ tab: owner can add title + content entry
- [x] FAQ tab: entries listed with title, preview, delete button
- [x] Files tab: owner can upload PDF, CSV, or TXT (max 5MB)
- [x] Uploaded file text is extracted server-side and stored in DataSource
- [x] File list shows filename, size, "Ready" status, delete button
- [x] `GET /api/data-sources` returns all entries for owner
- [x] `DELETE /api/data-sources/[id]` removes entry (owner-scoped)
- [x] `/api/chat` injects all DataSource entries as `system_context` before proxying
- [x] Toast notifications for add/delete success and errors
- [x] `npm run lint && npm run type-check && npm run test` all exit 0

### M13 — Settings + Embed Widget
- [x] Settings panel shows current sport + league with change selects
- [x] Saving new sport/league calls `PUT /api/bots/me` and re-resolves endpoint URL
- [x] Danger zone: "Delete bot" shows inline confirmation before proceeding
- [x] `DELETE /api/bots/me` deletes bot + all DataSources; redirects to empty dashboard
- [x] `public/widget.js` loads on any page with `data-bot-id` attribute
- [x] Widget script injects floating button bottom-right
- [x] Clicking button opens iframe panel pointing to `/chat/[id]?embed=true`
- [x] Chat page supports `?embed=true`: compact layout, no full-page chrome
- [x] `npm run lint && npm run type-check && npm run test` all exit 0

### M14 — Landing Page
- [x] Hero section: headline, subtext, two CTAs (Get started free / Log in)
- [x] How it works: 3-step explanation
- [x] Feature highlights: 3 cards (instant answers, custom knowledge, embed anywhere)
- [x] Mobile-responsive at 375px width
- [x] Accessibility: skip-to-content link, aria-labelledby on sections, aria-label on nav
- [x] Tests use `within()` scoped to landmarks (not fragile index selectors)
- [x] `npm run lint && npm run type-check && npm run test` all exit 0

### M15 — Analytics Dashboard
- [ ] `ChatEvent` model: `bot_id` (indexed), `owner_id` (indexed), `event_type` (`conversation_start` | `message`), `message_role` (`user`), `created_at`
- [ ] `POST /api/chat` logs a ChatEvent on every user message (fire-and-forget, non-fatal — never breaks chat)
- [ ] `conversation_start` detected when `messages.length === 1` (first message in a conversation)
- [ ] `GET /api/analytics` returns: `total_conversations`, `total_messages`, `avg_messages_per_conversation`, `daily_messages[]`, `daily_conversations[]`
- [ ] `GET /api/analytics` supports `?period=7d|30d|all` query param (default `7d`)
- [ ] `GET /api/analytics` requires auth; scoped to owner's bot
- [ ] `GET /api/analytics` returns 404 if owner has no bot
- [ ] Analytics dashboard page at `/dashboard/analytics` — stat cards + daily bar chart
- [ ] Period toggle (7d / 30d / All) re-fetches data
- [ ] Empty state: "No chat activity yet" with link to Overview
- [ ] Sidebar: Analytics moves from "Coming Soon" to active nav item with `/dashboard/analytics` href
- [ ] `DELETE /api/bots/me` cascades `ChatEvent.deleteMany({ bot_id })` alongside DataSource cascade
- [ ] No new dependencies — bar chart is pure CSS/Tailwind
- [ ] No fan message content stored — only event counts (privacy-friendly)
- [ ] TTL index on `created_at` (90-day auto-expiry) as a safety net for free-tier storage
- [ ] `npm run lint && npm run type-check && npm run test` all exit 0

---

## Open Issues / Blockers
| # | Issue | Module | Status |
|---|---|---|---|
| 1 | Real bot endpoint URL format unknown | M7 | **Resolved** — Gemini 2.0 Flash called directly in `/api/chat`; no external bot endpoint |
| 2 | Mock bot not publicly reachable in production | M7 | **Resolved** — production uses Gemini; mock bot kept for local dev only |
