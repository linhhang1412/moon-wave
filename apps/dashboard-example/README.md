# dashboard-example

A Cloudflare Worker demonstrating `@moon-wave/dashboard` and `@moon-wave/workspace/AgentRouter`.

## What's included

- **`/dashboard`** — Self-hosted UI: Playground to chat with agents, Agents list
- **`/agents`** — REST API: list agents, run agent by name
- Two agents: `support` (customer support) and `coding` (software engineering)

## Setup

```bash
npm install
npx wrangler secret put GROQ_API_KEY
```

Optional: protect the dashboard with a token:
```bash
npx wrangler secret put DASHBOARD_TOKEN
```
Then update `src/index.ts` to pass `auth: { token: env.DASHBOARD_TOKEN }` to `createDashboard`.

## Dev

```bash
npm run dev
```

Open http://localhost:8787/dashboard

## Deploy

```bash
npm run deploy
```

## API

### List agents
```bash
GET /agents
```

### Run an agent
```bash
POST /agents/support
Content-Type: application/json

{ "input": "How do I reset my password?" }
```

### Response
```json
{
  "output": "To reset your password...",
  "iterations": 1,
  "toolCalls": []
}
```
