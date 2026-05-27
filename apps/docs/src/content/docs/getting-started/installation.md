---
title: Installation
description: Install moon-wave and set up your Cloudflare Workers project
---

## Prerequisites

- Node.js 18+
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free)
- An API key for your chosen LLM provider ([Groq](https://console.groq.com), [Google AI Studio](https://aistudio.google.com), or [Cerebras](https://cloud.cerebras.ai))

## Option A — CLI (recommended)

The fastest way to start:

```bash
npx create-moon-wave-app my-agent
```

This runs an interactive wizard that generates a fully configured project.

## Option B — Manual setup

Install the packages you need:

```bash
npm install @moon-wave/core @moon-wave/providers
```

Add optional packages based on your use case:

```bash
# Memory
npm install @moon-wave/memory

# Multi-agent
npm install @moon-wave/multi-agent

# Telegram / Web Chat channels
npm install @moon-wave/channels
```

## Cloudflare setup

Install Wrangler (Cloudflare's CLI):

```bash
npm install -D wrangler
npx wrangler login
```

Create a `wrangler.toml`:

```toml
name = "my-agent"
main = "src/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]
```
