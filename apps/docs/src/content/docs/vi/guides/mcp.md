---
title: MCP Server
description: Deploy agent của bạn như tools trong Claude Code qua Model Context Protocol
---

`@moon-wave/mcp` đóng gói bất kỳ moon-wave agent nào thành [MCP](https://modelcontextprotocol.io) tool, có thể gọi trực tiếp từ Claude Code và các MCP clients khác.

## Cài đặt

```bash
npm install @moon-wave/mcp
```

## Deploy server

Tạo Cloudflare Worker:

```typescript
// src/index.ts
import { Agent } from '@moon-wave/core';
import { MCPAgentServer } from '@moon-wave/mcp';

export interface Env {
  MOON_WAVE_TOKEN: string;
  GROQ_API_KEY: string;
}

const supportAgent = new Agent({
  name: 'support',
  model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  systemPrompt: 'Bạn là trợ lý hỗ trợ khách hàng.',
});

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const server = new MCPAgentServer({
      bearerToken: env.MOON_WAVE_TOKEN,
    });
    server.register('support', supportAgent, 'Agent hỗ trợ khách hàng');
    return server.handle(req, env as unknown as Record<string, unknown>);
  },
};
```

```toml
# wrangler.toml
name = "my-mcp-server"
main = "src/index.ts"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]
```

```bash
npx wrangler secret put MOON_WAVE_TOKEN   # token xác thực (chuỗi bất kỳ)
npx wrangler secret put GROQ_API_KEY
npx wrangler deploy
```

## Kết nối với Claude Code

Thêm vào `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "my-agents": {
      "type": "http",
      "url": "https://my-mcp-server.<subdomain>.workers.dev",
      "headers": {
        "Authorization": "Bearer <your-MOON_WAVE_TOKEN>"
      }
    }
  }
}
```

Restart Claude Code. Agents của bạn giờ có thể dùng như tools.

## Tools có sẵn

| Tool | Mô tả |
|------|-------|
| `list_agents` | Liệt kê tất cả agents đã đăng ký |
| `run_agent` | Chạy agent với input |
| `create_session` | Tạo session ID cho memory continuity |
| `get_trace` | Lấy execution trace để debug |

## Auth

Server dùng **Bearer token** authentication (MCP OAuth 2.1 spec, static token mode):

- Set `bearerToken` → yêu cầu header `Authorization: Bearer <token>`
- Bỏ `bearerToken` → public mode (chỉ dùng khi develop)

Server cũng expose `/.well-known/oauth-protected-resource` để MCP clients tự discover auth.

## API reference

### `MCPAgentServer`

```typescript
const server = new MCPAgentServer({
  bearerToken?: string,  // token xác thực (tùy chọn)
  name?: string,         // tên server (mặc định: "moon-wave")
  version?: string,      // version (mặc định: "0.1.0")
});
```

### `server.register(name, agent, description)`

Đăng ký agent như MCP tool.

### `server.handle(req, env)`

Xử lý `Request` đến và trả về `Response`. Dùng làm `fetch` handler của Worker.
