# @moon-wave/workspace

R2-backed filesystem and HTTP router for moon-wave agents — give agents persistent file access and expose them via REST API.

## Installation

```bash
npm install @moon-wave/workspace @moon-wave/core
```

## FileSystem

Give agents a workspace backed by Cloudflare R2:

```typescript
import { FileSystem } from '@moon-wave/workspace';
import { tool } from '@moon-wave/core';

const fs = new FileSystem(env.R2, 'workspace-id');

const writeFile = tool({
  schema: {
    name: 'write_file',
    description: 'Write content to a file',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        content: { type: 'string' },
      },
      required: ['path', 'content'],
    },
  },
  execute: async ({ path, content }) => {
    await fs.write(path as string, content as string);
    return `Written to ${path}`;
  },
});

const agent = new Agent({ ... }).use(writeFile);
```

### FileSystem API

```typescript
class FileSystem {
  constructor(r2: R2Binding, workspaceId: string)

  write(path: string, content: ArrayBuffer | string, contentType?: string): Promise<FileEntry>
  read(path: string): Promise<ArrayBuffer | null>
  readText(path: string): Promise<string | null>
  list(prefix?: string): Promise<FileEntry[]>
  delete(path: string): Promise<void>
  grep(pattern: string, prefix?: string): Promise<Array<{ path: string; matches: string[] }>>
}
```

**Security:** Path traversal (`../`) is automatically stripped.

## AgentRouter

Expose multiple agents as a REST API with a single router:

```typescript
import { AgentRouter } from '@moon-wave/workspace';

const router = new AgentRouter();
router.register('assistant', assistantAgent, 'General assistant');
router.register('coder', coderAgent, 'Code generation specialist');

export default {
  async fetch(request: Request, env: Env) {
    return router.handle(request, env);
  },
};
```

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/agents` | List all registered agents |
| `POST` | `/agents/:name` | Run an agent |

**POST body:**
```json
{ "input": "Your message", "sessionId": "optional-session-id" }
```

**Response:**
```json
{
  "output": "Agent response",
  "iterations": 2,
  "toolCalls": [{ "name": "...", "args": {}, "result": {} }]
}
```

All endpoints include CORS headers for browser access.

## wrangler.toml

```toml
[[r2_buckets]]
binding = "R2"
bucket_name = "my-agent-workspace"
```

## License

MIT
