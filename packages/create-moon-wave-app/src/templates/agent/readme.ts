import type { ProjectConfig, Provider } from '../../types.js';

const providerEnvKey: Record<Provider, string> = {
  groq: 'GROQ_API_KEY',
  google: 'GOOGLE_AI_KEY',
  cerebras: 'CEREBRAS_API_KEY',
  workersai: '',
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
};

export function readme(config: ProjectConfig): string {
  const { name, provider, dashboard } = config;
  const envKey = providerEnvKey[provider];

  const dashboardSection = dashboard
    ? `
## Dashboard

A self-hosted dashboard is available at \`/dashboard\` when running locally or after deploy.

To protect it with a token in production:
\`\`\`bash
npx wrangler secret put DASHBOARD_TOKEN
\`\`\`
Then update \`src/index.ts\` and set \`auth: { token: env.DASHBOARD_TOKEN }\` in \`createDashboard()\`.
`
    : '';

  return `# ${name}

An AI agent built with [moon-wave](https://github.com/linhhang1412/moon-wave).

## Project structure

\`\`\`
src/
├── features/
│   └── chat/
│       ├── agent.ts    # Agent configuration
│       ├── handler.ts  # Request handler
│       └── tools.ts    # Feature tools
├── shared/
│   ├── env.ts          # Environment types
│   └── cors.ts         # CORS headers
└── index.ts            # Entry point
\`\`\`

## Setup

\`\`\`bash
npm install
\`\`\`

${envKey ? `Copy \`.env.example\` to \`.env\` and fill in your \`${envKey}\`.\n` : ''}
## Dev

\`\`\`bash
npm run dev
\`\`\`
${dashboardSection}
## Deploy

\`\`\`bash
npm run deploy
\`\`\`

## Adding tools

Open \`src/features/chat/tools.ts\` and uncomment the example tool, or add your own using \`tool()\` from \`@moon-wave/core\`.
`;
}
