---
title: Cài đặt
description: Cài đặt moon-wave và thiết lập project Cloudflare Workers
---

## Yêu cầu

- Node.js 18+
- Tài khoản [Cloudflare](https://dash.cloudflare.com/sign-up) (miễn phí)
- API key từ LLM provider: [Groq](https://console.groq.com), [Google AI Studio](https://aistudio.google.com), hoặc [Cerebras](https://cloud.cerebras.ai)

## Cách A — Dùng CLI (khuyến nghị)

Nhanh nhất:

```bash
npx create-moon-wave-app my-agent
```

Wizard tương tác sẽ tạo project đã config sẵn hoàn toàn.

## Cách B — Cài thủ công

```bash
npm install @moon-wave/core @moon-wave/providers
```

Thêm packages tuỳ nhu cầu:

```bash
# Memory
npm install @moon-wave/memory

# Multi-agent
npm install @moon-wave/multi-agent

# Kênh Telegram / Web Chat
npm install @moon-wave/channels
```

## Thiết lập Cloudflare

Cài Wrangler (CLI của Cloudflare):

```bash
npm install -D wrangler
npx wrangler login
```

Tạo `wrangler.toml`:

```toml
name = "my-agent"
main = "src/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]
```
