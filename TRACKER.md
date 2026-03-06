# Project Tracker — Sports Chatbot Portal

## Status Legend
`not started` · `in progress` · `done` · `blocked`

---

## Deployment Info
| Item | Value |
|---|---|
| GitHub | https://github.com/shuddhatma1/24-hr-jordy.git |
| Netlify URL | — (not yet connected) |
| Last deployed | — |

---

## Modules

| # | Module | Status | Branch | Deployed | Notes |
|---|---|---|---|---|---|
| M1 | Project Setup | not started | `feat/m1-setup` | No | |
| M2 | MongoDB + Models | not started | `feat/m2-mongodb` | No | |
| M3 | Auth | not started | `feat/m3-auth` | No | |
| M4 | Bot Registry | not started | `feat/m4-registry` | No | |
| M5 | Wizard + Bot API | not started | `feat/m5-wizard` | No | |
| M6 | Dashboard + Bot APIs | not started | `feat/m6-dashboard` | No | |
| M7 | Chat Proxy API | not started | `feat/m7-chat-api` | No | |
| M8 | Chat UI | not started | `feat/m8-chat-ui` | No | |
| M9 | Polish | not started | `feat/m9-polish` | No | |

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
- [ ] `lib/mongodb.ts` exports a singleton Mongoose connection (no multiple connections on hot reload)
- [ ] `User` model has: email (unique, required), passwordHash (required), createdAt
- [ ] `Bot` model has: owner_id, bot_name, sport, league, bot_endpoint_url, created_at
- [ ] Connecting with a valid `MONGODB_URI` succeeds without errors in dev
- [ ] Connecting with an invalid URI throws a clear error (not silent)
- [ ] `npm run type-check` exits 0

### M3 — Auth
- [ ] `POST /api/auth/signup` with valid email+password creates a user and returns 201
- [ ] `POST /api/auth/signup` with duplicate email returns 409
- [ ] `POST /api/auth/signup` with missing fields returns 400
- [ ] Passwords are stored hashed (bcrypt), never plaintext
- [ ] Login via NextAuth credentials succeeds and sets a session cookie
- [ ] Login with wrong password returns an error (not 500)
- [ ] `GET /dashboard` without session redirects to `/login`
- [ ] `GET /setup` without session redirects to `/login`
- [ ] Session persists across page refresh
- [ ] `npm run lint && npm run type-check && npm run test` all exit 0

### M4 — Bot Registry
- [ ] `lib/bot-registry.ts` exports a `getEndpointUrl(sport, league)` function
- [ ] Returns `MOCK_BOT_URL` for all valid entries in dev
- [ ] Returns `null` (not throws) for an unsupported `sport:league` combo
- [ ] All 6 supported leagues are present: EPL, La Liga, Bundesliga, NBA, NFL, MLB
- [ ] Unit tests cover: valid lookup, unsupported league returns null
- [ ] `npm run type-check` exits 0

### M5 — Wizard + Bot API
- [ ] 3-step wizard renders: Step 1 (name), Step 2 (sport), Step 3 (league)
- [ ] League options update when sport changes
- [ ] Selecting an unsupported league shows "This league isn't available yet"
- [ ] `POST /api/bots` with valid session + data creates bot and returns `bot_id`
- [ ] `POST /api/bots` with no session returns 401
- [ ] `POST /api/bots` when owner already has a bot returns 409
- [ ] `POST /api/bots` with missing fields returns 400
- [ ] After wizard completes, user is redirected to `/dashboard`
- [ ] `npm run lint && npm run type-check && npm run test` all exit 0

### M6 — Dashboard + Bot APIs
- [ ] `/dashboard` shows bot name, sport, league, and hosted URL
- [ ] Copy button copies the URL and shows "Copied!" confirmation
- [ ] "Preview Chatbot" opens `/chat/{bot_id}` in a new tab
- [ ] Log out button ends session and redirects to `/login`
- [ ] `GET /api/bots/me` with valid session returns bot data
- [ ] `GET /api/bots/me` with no session returns 401
- [ ] `GET /api/bots/me` when owner has no bot returns 404
- [ ] `GET /api/bots/[bot_id]` with valid ObjectId returns bot name + league (no sensitive fields)
- [ ] `GET /api/bots/[bot_id]` with invalid/unknown id returns 404
- [ ] `npm run lint && npm run type-check && npm run test` all exit 0

### M7 — Chat Proxy API
- [ ] `POST /api/chat` with valid `bot_id` + `messages` proxies to mock bot and streams response
- [ ] First token arrives within 3 seconds
- [ ] `Content-Type: text/event-stream` set on response
- [ ] Stream is piped directly — not buffered
- [ ] If bot endpoint is unreachable, returns 502 (not 500, not unhandled rejection)
- [ ] If `bot_id` not found in DB, returns 404
- [ ] Request body over 50kb is rejected with 413
- [ ] Bot endpoint URL always comes from DB — never from user input
- [ ] `npm run lint && npm run type-check && npm run test` all exit 0

### M8 — Chat UI
- [ ] `/chat/{bot_id}` loads without login and shows bot name
- [ ] Welcome message: "Hi! Ask me anything about {league}."
- [ ] User message appears immediately on send
- [ ] Bot response streams token by token with `▌` cursor
- [ ] Input and send button are disabled while streaming
- [ ] Chat history persists for the session (not across sessions)
- [ ] Invalid `bot_id` shows: "This chatbot doesn't exist or has been removed"
- [ ] Page is usable on mobile (no horizontal scroll)
- [ ] `npm run lint && npm run type-check && npm run test` all exit 0

### M9 — Polish
- [ ] Landing page (`/`) has Sign Up and Log In CTAs
- [ ] All error states have clear user-facing messages (no raw error objects shown)
- [ ] Loading states on all async actions (login, signup, wizard submit)
- [ ] All pages pass mobile layout check (no horizontal scroll at 375px)
- [ ] No `console.error` or unhandled promise rejections in browser console during happy path
- [ ] End-to-end demo flow works: signup → setup → dashboard → copy URL → fan chat → streaming response
- [ ] `npm run lint && npm run type-check && npm run test` all exit 0

---

## Deployment Log
| Date | Module | What shipped | Netlify build |
|---|---|---|---|
| — | — | — | — |

---

## Open Issues / Blockers
| # | Issue | Module | Status |
|---|---|---|---|
| 1 | Real bot endpoint URL format unknown | M7 | open |
| 2 | Mock bot not publicly reachable in production | M7 | open |
