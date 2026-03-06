# Sports Chatbot Portal

A self-serve portal where sports league owners configure and deploy an AI stats chatbot. Fans get a hosted URL to chat with the bot — no login required.

## Dev

```bash
# Next.js app on :3000
npm run dev

# Mock bot on :3001 (required for chat proxy in dev)
cd mock-bot && node server.js
```

## Checks (run before every commit)

```bash
npm run lint
npm run type-check
npm run test
```

## Deployment

Deploys to Netlify via `@netlify/plugin-nextjs`. See `netlify.toml` at repo root.

Copy `.env.example` to `.env.local` and fill in values before running locally.
