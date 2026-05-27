---
title: Deploy lên Cloudflare
description: Deploy moon-wave agent lên Cloudflare Workers
---

## Deploy

```bash
npx wrangler deploy
```

Agent sẽ live tại `https://<name>.<subdomain>.workers.dev`.

## Đặt secrets

Không bao giờ đặt API key trong `wrangler.toml`. Dùng secrets:

```bash
npx wrangler secret put GROQ_API_KEY
npx wrangler secret put GOOGLE_AI_KEY
```

Cho local dev, dùng `.dev.vars` (đã gitignore):

```bash
# .dev.vars
GROQ_API_KEY=gsk_...
```

## Tạo KV Namespace

```bash
npx wrangler kv namespace create SESSIONS
# Copy ID trả về vào wrangler.toml
```

```toml
[[kv_namespaces]]
binding = "SESSIONS"
id = "abc123..."
```

## Tạo D1 Database

```bash
npx wrangler d1 create my-agent-db
npx wrangler d1 execute my-agent-db \
  --file=node_modules/@moon-wave/memory/migrations/001_init.sql
```

## Custom domain

Cloudflare Dashboard → Workers → worker của bạn → Settings → Domains & Routes → Add custom domain.

## CI/CD

```yaml
# .github/workflows/deploy.yml
- name: Deploy
  run: npx wrangler deploy
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```
