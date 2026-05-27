---
title: Introduction
description: moon-wave — AI agent framework for Cloudflare Workers
---

**moon-wave** is a TypeScript framework for building AI agents that run natively on Cloudflare Workers.

## Why moon-wave?

- **Zero cold starts** — runs on Cloudflare's edge network worldwide
- **Built-in memory** — KV for sessions, D1 for persistence, Vectorize for semantic search
- **Multi-provider** — Groq, Google Gemini, Cerebras, Workers AI via a unified interface
- **Composable** — tools, multi-agent networks, graph-based workflows
- **Observable** — OpenTelemetry-style distributed tracing built in

## Packages

| Package | Description |
|---|---|
| `@moon-wave/core` | Agent class, tool registry, agent loop |
| `@moon-wave/types` | TypeScript interfaces shared across packages |
| `@moon-wave/providers` | LLM provider adapters (Groq, Google, Cerebras, Workers AI) |
| `@moon-wave/memory` | Memory adapters (KV, D1, Vectorize) |
| `@moon-wave/workflow` | Graph-based workflow engine |
| `@moon-wave/multi-agent` | Agent networks and handoff patterns |
| `@moon-wave/channels` | Telegram and Web Chat channel adapters |
| `@moon-wave/observability` | Distributed tracing |

## Next steps

→ [Installation](/getting-started/installation)  
→ [Quick Start](/getting-started/quick-start)
