---
title: Multi-Agent Systems
description: Build agent networks and handoff patterns
---

moon-wave supports two multi-agent patterns: using an agent as a tool inside another agent, and supervisor networks where a coordinator routes tasks.

## Agent as Tool

Wrap an agent so it can be called as a tool by another agent:

```typescript
import { Agent } from '@moon-wave/core';
import { agentAsTool } from '@moon-wave/multi-agent';

const researchAgent = new Agent({
  name: 'researcher',
  model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  systemPrompt: 'You are a research specialist. Find factual information.',
});

const writerAgent = new Agent({
  name: 'writer',
  model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  systemPrompt: 'You are a writer. Use the researcher tool to gather facts, then write.',
});

writerAgent.use(agentAsTool(researchAgent));

const result = await writerAgent.run(
  'Write a short article about the James Webb telescope.',
  { sessionId: 'session-1', env }
);
```

## AgentNetwork (Supervisor)

A supervisor routes tasks to specialist agents:

```typescript
import { AgentNetwork } from '@moon-wave/multi-agent';

const network = new AgentNetwork({
  supervisor: supervisorAgent,
  agents: [researchAgent, writerAgent, codeAgent],
});

const result = await network.run(
  'Research quantum computing and summarize it in Python code comments.',
  { sessionId: 'session-1', env }
);
```

The supervisor decides which agent handles each sub-task and synthesizes the final result.
