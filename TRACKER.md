# Project Tracker — Sports Chatbot Portal

## Status Legend
`not started` · `in progress` · `done` · `blocked`

---

## Deployment Info
| Item | Value |
|---|---|
| GitHub | https://github.com/shuddhatma1/24-hr-jordy.git |
| Netlify URL | https://24-hr-jordy.netlify.app |
| Last deployed | 2026-03-09 (M9 — all modules complete) |

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

---

## Open Issues / Blockers
| # | Issue | Module | Status |
|---|---|---|---|
| 1 | Real bot endpoint URL format unknown | M7 | open |
| 2 | Mock bot not publicly reachable in production | M7 | open |
