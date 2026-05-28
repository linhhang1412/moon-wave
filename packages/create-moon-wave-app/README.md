# create-moon-wave-app

CLI scaffolding tool for moon-wave — bootstrap a Cloudflare Workers agent project in seconds.

## Usage

```bash
npm create moon-wave-app@latest
# or
npx create-moon-wave-app my-agent
```

## Interactive Prompts

The CLI walks you through:

1. **Project name** — directory and package name
2. **Template**
   - `agent` — Cloudflare Worker with HTTP endpoint
   - `mcp-server` — Expose agents as tools in Claude Code
3. **LLM Provider**
   - `groq` — Fast inference, free tier (requires `GROQ_API_KEY`)
   - `google` — Gemini models, generous free tier (requires `GOOGLE_API_KEY`)
   - `cerebras` — Ultra-fast inference (requires `CEREBRAS_API_KEY`)
   - `workersai` — Cloudflare-native, no API key needed
4. **Memory** *(agent template only)*
   - `none` — stateless
   - `kv` — session history via Cloudflare KV
   - `d1` — persistent history via Cloudflare D1
5. **Channel** *(agent template only)*
   - `none` — HTTP endpoint only
   - `telegram` — Telegram bot webhook
   - `webchat` — SSE streaming web chat
6. **Dashboard** *(agent template only)* — include self-hosted playground UI
7. **Install dependencies** — run `npm install` automatically

## Generated Structure

```
my-agent/
├── src/
│   └── index.ts       # Main Worker entry point
├── wrangler.toml      # Cloudflare deployment config
├── tsconfig.json
└── package.json
```

## Getting Started After Scaffolding

```bash
cd my-agent
npm install             # if you skipped auto-install
npm run dev             # start local dev server with wrangler

# Set secrets
wrangler secret put GROQ_API_KEY

# Deploy
npm run deploy
```

## License

MIT
