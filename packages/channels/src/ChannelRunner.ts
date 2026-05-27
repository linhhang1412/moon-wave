import type { AgentContext } from '@moon-wave/types';
import type { Agent } from '@moon-wave/core';
import type { Channel, IncomingMessage } from './types';

export class ChannelRunner {
  constructor(
    private channel: Channel,
    private agent: Agent,
    private buildContext?: (msg: IncomingMessage) => Partial<AgentContext>,
  ) {}

  async handle(request: Request, env: Record<string, unknown>): Promise<Response> {
    const valid = await this.channel.verify(request);
    if (!valid) return new Response('Unauthorized', { status: 401 });

    const incoming = await this.channel.parse(request.clone());
    if (!incoming) return new Response('OK');

    const extraCtx = this.buildContext?.(incoming) ?? {};
    const ctx: AgentContext = {
      sessionId: incoming.sessionId,
      userId: incoming.userId,
      env,
      ...extraCtx,
    };

    const result = await this.agent.run(incoming.text, ctx);
    await this.channel.send({ text: result.output, sessionId: incoming.sessionId }, incoming);

    return new Response('OK');
  }
}
