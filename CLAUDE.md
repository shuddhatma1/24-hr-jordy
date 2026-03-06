# Sports Chatbot Portal — CLAUDE.md

See @CONTEXT.md for full architecture details, @PRD.md for product requirements, and @TRACKER.md for module status.

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
- **Chat proxy:** `POST /api/chat` fetches `bot_endpoint_url` from DB, forwards `{ messages }`, pipes stream back — no processing.
- **1 bot per owner** — `POST /api/bots` returns 409 if one already exists.
- **`bot_id` = MongoDB ObjectId** — not guessable; chat page is intentionally public (no auth).

## When Compacting
Always preserve: current module name and status, list of files modified this session, last test/lint command output, and any unresolved errors.
