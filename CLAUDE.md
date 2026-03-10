# Sports Chatbot Portal — CLAUDE.md

See @CONTEXT.md for full architecture details. PRD.md has full product requirements; TRACKER.md has module acceptance criteria — load on-demand if needed.

## Product Scope (read this first)
This portal is an **owner configuration tool** — its job is to help a league owner configure their chatbot as fast as possible. The fan experience and the AI bot are owned by a separate bot team. Do not engineer for fan UX or AI consumption. When in doubt: if the feature is about collecting or displaying owner inputs, it belongs here; if it's about how the bot responds to fans, it does not.

## Dev Commands
```bash
cd sports-portal && npm run dev              # Next.js on :3000
cd sports-portal/mock-bot && node server.js  # Mock bot on :3001
```
All app code lives in `sports-portal/`. Always `cd sports-portal` before running npm/next commands.

## Verification (run after every module)
```bash
cd sports-portal && npm run lint         # ESLint
cd sports-portal && npm run type-check   # tsc --noEmit
cd sports-portal && npm run test         # Vitest
```
IMPORTANT: Always run all three before committing. Fix every error — do not suppress or skip.

## Conventions
- TypeScript everywhere in the app (mock-bot is plain JS)
- Tailwind for all styling — no CSS modules or inline styles
- Server components by default; `'use client'` only when needed
- API routes return `{ error: string }` on failure with appropriate HTTP status
- Never commit `.env.local`

## Key Decisions
- **Bot registry:** `lib/bot-registry.ts` maps `"sport:league"` → streaming endpoint URL. In dev, all point to `MOCK_BOT_URL`.
- **Chat proxy:** `POST /api/chat` fetches bot from DB, fetches DataSources, calls Gemini with `system_context`, streams SSE back. Also logs `ChatEvent` fire-and-forget (never blocks chat).
- **1 bot per owner** — `POST /api/bots` returns 409 if one already exists.
- **`bot_id` = MongoDB ObjectId** — not guessable; chat page is intentionally public (no auth).
- **Embed widget:** `public/widget.js` — vanilla JS, reads `data-bot-id`, injects floating iframe to `/chat/[id]?embed=true`.
- **File storage:** parse on upload, store extracted text in DataSource.content — no binary storage, no S3.
- **Dashboard routing:** nested Next.js routes under `/dashboard/*`; `DashboardShell` (`'use client'`) handles sidebar + mobile; `dashboard/layout.tsx` (server) handles auth.

## UI/UX Overhaul
Plan is in `UI-OVERHAUL.md` — load on-demand when working on UI tasks. Do not inline here.

## When Compacting
Always preserve: current module name and status, list of files modified this session, last test/lint command output, and any unresolved errors.
