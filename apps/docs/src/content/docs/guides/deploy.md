---
title: Deploy to Cloudflare
description: Deploy your moon-wave agent to Cloudflare Workers
---

## Prerequisites

- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) installed
- A Cloudflare account (free tier works)
- Logged in: `npx wrangler login`

## Deploy

```bash
npx wrangler deploy
```

Your agent goes live at `https://<name>.<subdomain>.workers.dev`.

## Set secrets

Never put API keys in `wrangler.toml`. Use secrets instead:

```bash
npx wrangler secret put GROQ_API_KEY
npx wrangler secret put GOOGLE_AI_KEY
npx wrangler secret put CEREBRAS_API_KEY
```

For local dev, use `.dev.vars` (gitignored):

```bash
# .dev.vars
GROQ_API_KEY=gsk_...
```

## Provision KV

```bash
# Create namespace
npx wrangler kv namespace create SESSIONS

# Add the returned ID to wrangler.toml
```

```toml
[[kv_namespaces]]
binding = "SESSIONS"
id = "abc123..."
```

## Provision D1

```bash
npx wrangler d1 create my-agent-db
npx wrangler d1 execute my-agent-db \
  --file=node_modules/@moon-wave/memory/migrations/001_init.sql
```

```toml
[[d1_databases]]
binding = "DB"
database_name = "my-agent-db"
database_id = "abc123..."
```

## Custom domain

In Cloudflare Dashboard → Workers → your worker → Settings → Domains & Routes → Add custom domain.

## CI/CD

Add to `.github/workflows/deploy.yml`:

```yaml
- name: Deploy
  run: npx wrangler deploy
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```
