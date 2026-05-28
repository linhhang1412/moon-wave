# @moon-wave/multi-agent

Multi-agent patterns for moon-wave — supervisor networks and agent-as-tool delegation.

## Installation

```bash
npm install @moon-wave/multi-agent @moon-wave/core
```

## Patterns

### AgentNetwork — Supervisor routing

A router agent automatically delegates user requests to the most appropriate specialist agent.

```typescript
import { AgentNetwork } from '@moon-wave/multi-agent';
import { Agent } from '@moon-wave/core';

const codeAgent = new Agent({
  name: 'code-expert',
  model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  systemPrompt: 'You are an expert software engineer.',
});

const writingAgent = new Agent({
  name: 'writing-expert',
  model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  systemPrompt: 'You are an expert technical writer.',
});

const network = new AgentNetwork({
  name: 'supervisor',
  routerModel: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  agents: [codeAgent, writingAgent],
  // optional custom system prompt for the router agent
  systemPrompt: 'You coordinate a team of specialists. Delegate to the right expert.',
});

const result = await network.run('Write a README for my TypeScript library', ctx);
```

The supervisor sees the list of available agents and calls them as tools. The conversation is transparent and each delegation is tracked in `result.toolCalls`.

### `agentAsTool` — Manual delegation

Wrap any agent as a tool so another agent can call it explicitly:

```typescript
import { agentAsTool } from '@moon-wave/multi-agent';

const researchTool = agentAsTool(researchAgent, {
  description: 'Search the web and return a summary of findings',
});

const mainAgent = new Agent({
  name: 'planner',
  model: { provider: 'openai', model: 'gpt-4o' },
}).use(researchTool);
```

## API

### `AgentNetwork`

```typescript
interface NetworkConfig {
  name: string;
  routerModel: ModelConfig;    // { provider, model }
  agents: Agent[];
  systemPrompt?: string;       // defaults to a sensible supervisor prompt
}

class AgentNetwork {
  constructor(config: NetworkConfig)
  run(input: string, ctx: AgentContext): Promise<AgentResult>
}
```

### `agentAsTool`

```typescript
function agentAsTool(
  agent: Agent,
  options?: { description?: string }
): ToolDefinition
```

The generated tool accepts `{ input: string, sessionId?: string }` and returns the agent's output string.

## License

MIT
