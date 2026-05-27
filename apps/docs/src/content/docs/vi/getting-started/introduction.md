---
title: Giới thiệu
description: moon-wave — AI agent framework cho Cloudflare Workers
---

**moon-wave** là framework TypeScript để build AI agent chạy native trên Cloudflare Workers.

## Tại sao chọn moon-wave?

- **Không cold start** — chạy trên edge network của Cloudflare, phủ sóng toàn cầu
- **Memory tích hợp** — KV cho session, D1 cho persistence, Vectorize cho semantic search
- **Đa provider** — Groq, Google Gemini, Cerebras, Workers AI qua một interface thống nhất
- **Composable** — tools, multi-agent networks, graph-based workflows
- **Observable** — distributed tracing kiểu OpenTelemetry tích hợp sẵn

## Các packages

| Package | Mô tả |
|---|---|
| `@moon-wave/core` | Agent class, tool registry, agent loop |
| `@moon-wave/types` | TypeScript interfaces dùng chung |
| `@moon-wave/providers` | LLM provider adapters (Groq, Google, Cerebras, Workers AI) |
| `@moon-wave/memory` | Memory adapters (KV, D1, Vectorize) |
| `@moon-wave/workflow` | Graph-based workflow engine |
| `@moon-wave/multi-agent` | Agent networks và handoff patterns |
| `@moon-wave/channels` | Telegram và Web Chat channel adapters |
| `@moon-wave/observability` | Distributed tracing |

## Bước tiếp theo

→ [Cài đặt](/vi/getting-started/installation)  
→ [Quick Start](/vi/getting-started/quick-start)
