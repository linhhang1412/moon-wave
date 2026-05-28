import type { ProjectConfig } from '../../types.js';
import { providerEnvKey } from '../constants.js';

export function multiAgentReadme(config: ProjectConfig): string {
  const { name, provider, channel, dashboard } = config;
  const envKey = providerEnvKey[provider];

  const sharedFiles =
    channel === 'none'
      ? '│   ├── env.ts              # Environment types\n│   └── cors.ts             # CORS headers'
      : '│   └── env.ts              # Environment types';

  const dashboardSection = dashboard
    ? `
## Dashboard

A self-hosted dashboard is available at \`/dashboard\` when running locally or after deploy.

To protect it with a token in production:
\`\`\`bash
npx wrangler secret put DASHBOARD_TOKEN
\`\`\`
`
    : '';

  return `# ${name}

A multi-agent system built with [moon-wave](https://github.com/linhhang1412/moon-wave).
Uses \`AgentNetwork\` to route requests to specialist agents via a supervisor.

## How it works

\`\`\`
User request
    │
    ▼
supervisor (router)
    ├─▶ research agent  ─ facts, data, summaries
    └─▶ writer agent    ─ content, formatting
\`\`\`

The supervisor analyses each request and delegates to the most appropriate specialist.
Add more agents in \`src/features/chat/agents/\` and register them in \`network.ts\`.

## Project structure

\`\`\`
src/
├── features/
│   └── chat/
│       ├── agents/
│       │   ├── research.ts     # Research specialist
│       │   └── writer.ts       # Writer specialist
│       ├── network.ts          # AgentNetwork (supervisor)
│       ├── handler.ts          # Request handler
│       └── tools.ts            # Shared tools
├── shared/
${sharedFiles}
└── index.ts                    # Entry point
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

## Adding agents

1. Create \`src/features/chat/agents/<name>.ts\` with a \`create<Name>Agent()\` factory
2. Import and add it to the \`agents\` array in \`src/features/chat/network.ts\`
`;
}
