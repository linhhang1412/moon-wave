import type { AgentContext, AgentResult, ModelConfig } from '@moon-wave/types';
import { Agent } from '@moon-wave/core';
import { agentAsTool } from './agentAsTool';

export interface NetworkConfig {
  name: string;
  routerModel: ModelConfig;
  agents: Agent[];
  systemPrompt?: string;
}

export class AgentNetwork {
  private routerAgent: Agent;

  constructor(config: NetworkConfig) {
    const agentTools = config.agents.map((a) =>
      agentAsTool(a, { description: `Delegate task to the ${a.name} agent` }),
    );

    const agentList = config.agents.map((a) => `- ${a.name}`).join('\n');

    this.routerAgent = new Agent({
      name: config.name,
      model: config.routerModel,
      systemPrompt:
        config.systemPrompt ??
        `You are a supervisor coordinating these agents:\n${agentList}\nAnalyze requests and delegate to the most appropriate agent.`,
      maxIterations: 15,
    }).use(...agentTools);
  }

  async run(input: string, ctx: AgentContext): Promise<AgentResult> {
    return this.routerAgent.run(input, ctx);
  }
}
