import { Agent } from '@moon-wave/core';
import { MCPAgentServer } from '@moon-wave/mcp';

export interface Env {
  MOON_WAVE_TOKEN: string;
  GROQ_API_KEY: string;
  CEREBRAS_API_KEY?: string;
}

const supportAgent = new Agent({
  name: 'support',
  model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  systemPrompt: 'You are a helpful customer support agent. Be concise and friendly.',
});

const codingAgent = new Agent({
  name: 'coding',
  model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  systemPrompt:
    'You are an expert software engineer. Help with code review, debugging, and architecture questions. Provide concise, actionable answers.',
});

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const server = new MCPAgentServer({
      bearerToken: env.MOON_WAVE_TOKEN,
      name: 'moon-wave-example',
      version: '0.1.0',
    });

    server.register('support', supportAgent, 'Customer support agent — answers product and service questions');
    server.register('coding', codingAgent, 'Software engineering assistant — code review, debugging, architecture');

    return server.handle(req, env as unknown as Record<string, unknown>);
  },
};
