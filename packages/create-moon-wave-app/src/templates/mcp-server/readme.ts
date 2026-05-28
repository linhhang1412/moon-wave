import type { ProjectConfig, Provider } from '../../types.js';

const providerEnvKey: Record<Provider, string> = {
  groq: 'GROQ_API_KEY',
  google: 'GOOGLE_AI_KEY',
  cerebras: 'CEREBRAS_API_KEY',
  workersai: '',
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
};

export function mcpReadme(config: ProjectConfig): string {
  const { name, provider } = config;
  const envKey = providerEnvKey[provider];

  return `# ${name}

An MCP server built with [moon-wave](https://github.com/linhhang1412/moon-wave).
Exposes your agents as tools in Claude Code and other MCP clients.

## Project structure

\`\`\`
src/
├── features/
│   └── agent/
│       └── handler.ts  # MCP agent handler
├── shared/
│   └── env.ts          # Environment types
└── index.ts            # Entry point
\`\`\`

## Deploy

\`\`\`bash
npm install
npx wrangler secret put MOON_WAVE_TOKEN   # your auth token (any string)
${envKey ? `npx wrangler secret put ${envKey}\n` : ''}\
npm run deploy
\`\`\`

## Connect to Claude Code

Add to \`~/.claude/settings.json\`:

\`\`\`json
{
  "mcpServers": {
    "${name}": {
      "type": "http",
      "url": "https://${name}.<subdomain>.workers.dev",
      "headers": {
        "Authorization": "Bearer <your-MOON_WAVE_TOKEN>"
      }
    }
  }
}
\`\`\`

Restart Claude Code. Your agent is now available as a tool.
`;
}
