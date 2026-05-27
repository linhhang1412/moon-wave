import type { ProjectConfig, Provider } from './types.js';

const providerEnvKey: Record<Provider, string> = {
  groq: 'GROQ_API_KEY',
  google: 'GOOGLE_AI_KEY',
  cerebras: 'CEREBRAS_API_KEY',
  workersai: '',
};

const providerModel: Record<Provider, string> = {
  groq: 'llama-3.3-70b-versatile',
  google: 'gemini-2.0-flash',
  cerebras: 'llama3.3-70b',
  workersai: '@cf/meta/llama-3.1-8b-instruct',
};

const providerSetup: Record<Provider, string> = {
  groq: `new GroqProvider({ apiKey: env.GROQ_API_KEY })`,
  google: `new GoogleProvider({ apiKey: env.GOOGLE_AI_KEY })`,
  cerebras: `new CerebrasProvider({ apiKey: env.CEREBRAS_API_KEY })`,
  workersai: `new WorkersAIProvider({ ai: env.AI })`,
};

const providerImport: Record<Provider, string> = {
  groq: `import { GroqProvider } from '@moon-wave/providers';`,
  google: `import { GoogleProvider } from '@moon-wave/providers';`,
  cerebras: `import { CerebrasProvider } from '@moon-wave/providers';`,
  workersai: `import { WorkersAIProvider } from '@moon-wave/providers';`,
};

export function indexTs(config: ProjectConfig): string {
  const { provider, memory, channel } = config;
  const envKey = providerEnvKey[provider];
  const model = providerModel[provider];
  const setup = providerSetup[provider];
  const provImport = providerImport[provider];

  const memoryImport = memory !== 'none'
    ? `import { ${memory === 'kv' ? 'KVMemoryAdapter' : 'D1MemoryAdapter'} } from '@moon-wave/memory';`
    : '';

  const channelImport = channel !== 'none'
    ? `import { ${channel === 'telegram' ? 'TelegramChannel' : 'WebChatChannel'}, ChannelRunner } from '@moon-wave/channels';`
    : '';

  const memoryConfig = memory === 'kv'
    ? `\n  memory: { type: 'kv', adapter: new KVMemoryAdapter(env.SESSIONS) },`
    : memory === 'd1'
    ? `\n  memory: { type: 'd1', adapter: new D1MemoryAdapter(env.DB) },`
    : `\n  memory: 'none',`;

  const envType = provider === 'workersai'
    ? `  AI: Ai;`
    : `  ${envKey}: string;`;

  const memoryEnvType = memory === 'kv'
    ? `\n  SESSIONS: KVNamespace;`
    : memory === 'd1'
    ? `\n  DB: D1Database;`
    : '';

  const handlerCode = channel === 'telegram'
    ? `
  const channelRunner = new ChannelRunner(agent);
  const telegram = new TelegramChannel(env.TELEGRAM_TOKEN);
  return telegram.handle(request, channelRunner, { sessionId: 'default', env });`
    : channel === 'webchat'
    ? `
  const channelRunner = new ChannelRunner(agent);
  const webchat = new WebChatChannel();
  return webchat.handle(request, channelRunner, { sessionId: 'default', env });`
    : `
  const url = new URL(request.url);
  const input = url.searchParams.get('q') ?? 'Hello!';

  const result = await agent.run(input, { sessionId: 'default', env });
  return new Response(result.output);`;

  return `#!/usr/bin/env node
${provImport}
${memoryImport}
${channelImport}

interface Env {
${envType}${memoryEnvType}
}

const agent = new Agent({
  name: '${config.name}',
  model: { provider: '${provider}', model: '${model}' },
  systemPrompt: 'You are a helpful assistant.',${memoryConfig}
});

export default {
  async fetch(request: Request, env: Env): Promise<Response> {${handlerCode}
  },
};
`.trimStart();
}

export function packageJson(config: ProjectConfig): string {
  const { name, provider, memory, channel } = config;
  const deps: Record<string, string> = {
    '@moon-wave/core': '^0.1.0',
    '@moon-wave/providers': '^0.1.0',
  };
  if (memory !== 'none') deps['@moon-wave/memory'] = '^0.1.0';
  if (channel !== 'none') deps['@moon-wave/channels'] = '^0.1.0';

  return JSON.stringify({
    name,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'wrangler dev',
      deploy: 'wrangler deploy',
    },
    dependencies: deps,
    devDependencies: {
      wrangler: '^3.0.0',
      typescript: '^5.5.0',
    },
  }, null, 2);
}

export function wranglerToml(config: ProjectConfig): string {
  const { name, provider, memory } = config;

  const kvBinding = memory === 'kv' ? `
[[kv_namespaces]]
binding = "SESSIONS"
id = "YOUR_KV_NAMESPACE_ID"
` : '';

  const d1Binding = memory === 'd1' ? `
[[d1_databases]]
binding = "DB"
database_name = "${name}-db"
database_id = "YOUR_D1_DATABASE_ID"
` : '';

  const aiBinding = provider === 'workersai' ? `
[ai]
binding = "AI"
` : '';

  return `name = "${name}"
main = "src/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]
${kvBinding}${d1Binding}${aiBinding}`.trim();
}

export function tsconfigJson(): string {
  return JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      lib: ['ES2022'],
      strict: true,
      skipLibCheck: true,
    },
    include: ['src'],
  }, null, 2);
}

export function envExample(config: ProjectConfig): string {
  const { provider, channel } = config;
  const envKey = providerEnvKey[provider];
  const lines: string[] = [];

  if (envKey) lines.push(`${envKey}=`);
  if (channel === 'telegram') lines.push('TELEGRAM_TOKEN=');

  return lines.join('\n') + '\n';
}

export function gitignore(): string {
  return `node_modules
dist
.wrangler
.env
`;
}

export function readme(config: ProjectConfig): string {
  const { name, provider } = config;
  const envKey = providerEnvKey[provider];

  return `# ${name}

An AI agent built with [moon-wave](https://github.com/linhhang1412/moon-wave).

## Setup

\`\`\`bash
npm install
\`\`\`

${envKey ? `Copy \`.env.example\` to \`.env\` and fill in your \`${envKey}\`.\n` : ''}
## Dev

\`\`\`bash
npm run dev
\`\`\`

## Deploy

\`\`\`bash
npm run deploy
\`\`\`
`;
}

// ─── MCP Server template ───────────────────────────────────────────────────

export function mcpIndexTs(config: ProjectConfig): string {
  const { name, provider } = config;
  const model = providerModel[provider];
  const envKey = providerEnvKey[provider];

  const envField = provider === 'workersai'
    ? `  AI: Ai;`
    : `  ${envKey}: string;`;

  return `import { Agent } from '@moon-wave/core';
import { MCPAgentServer } from '@moon-wave/mcp';

export interface Env {
  MOON_WAVE_TOKEN: string;
${envField}
}

const agent = new Agent({
  name: '${name}',
  model: { provider: '${provider}', model: '${model}' },
  systemPrompt: 'You are a helpful assistant.',
});

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const server = new MCPAgentServer({ bearerToken: env.MOON_WAVE_TOKEN });
    server.register('${name}', agent, 'Helpful assistant agent');
    return server.handle(req, env as unknown as Record<string, unknown>);
  },
};
`;
}

export function mcpPackageJson(config: ProjectConfig): string {
  const { name } = config;
  return JSON.stringify({
    name,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'wrangler dev',
      deploy: 'wrangler deploy',
    },
    dependencies: {
      '@moon-wave/core': '^0.1.0',
      '@moon-wave/mcp': '^0.1.0',
    },
    devDependencies: {
      '@cloudflare/workers-types': '^4.0.0',
      wrangler: '^3.0.0',
      typescript: '^5.5.0',
    },
  }, null, 2);
}

export function mcpWranglerToml(config: ProjectConfig): string {
  const { name, provider } = config;
  const aiBinding = provider === 'workersai' ? `\n[ai]\nbinding = "AI"\n` : '';
  return `name = "${name}"
main = "src/index.ts"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]
${aiBinding}`.trim();
}

export function mcpEnvExample(config: ProjectConfig): string {
  const envKey = providerEnvKey[config.provider];
  const lines = ['MOON_WAVE_TOKEN='];
  if (envKey) lines.push(`${envKey}=`);
  return lines.join('\n') + '\n';
}

export function mcpReadme(config: ProjectConfig): string {
  const { name, provider } = config;
  const envKey = providerEnvKey[provider];

  return `# ${name}

An MCP server built with [moon-wave](https://github.com/linhhang1412/moon-wave).
Exposes your agents as tools in Claude Code and other MCP clients.

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
