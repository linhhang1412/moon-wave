import * as p from '@clack/prompts';
import type { ProjectConfig, Provider, Memory, Channel, Template } from './types.js';

export async function runPrompts(nameArg?: string): Promise<ProjectConfig> {
  p.intro('create-moon-wave-app');

  const name = nameArg ?? await p.text({
    message: 'Project name:',
    placeholder: 'my-agent',
    validate: (v) => v.trim().length === 0 ? 'Name is required' : undefined,
  });

  if (p.isCancel(name)) { p.cancel('Cancelled.'); process.exit(0); }

  const template = await p.select<{ value: Template; label: string; hint: string }[], Template>({
    message: 'Template:',
    options: [
      { value: 'agent', label: 'Agent', hint: 'Cloudflare Worker with HTTP endpoint' },
      { value: 'mcp-server', label: 'MCP Server', hint: 'Expose agents as tools in Claude Code' },
    ],
  });

  if (p.isCancel(template)) { p.cancel('Cancelled.'); process.exit(0); }

  const provider = await p.select<{ value: Provider; label: string }[], Provider>({
    message: 'LLM Provider:',
    options: [
      { value: 'groq', label: 'Groq  (fast, free tier)' },
      { value: 'google', label: 'Google Gemini  (generous free tier)' },
      { value: 'cerebras', label: 'Cerebras  (ultra-fast inference)' },
      { value: 'workersai', label: 'Cloudflare Workers AI  (no API key needed)' },
    ],
  });

  if (p.isCancel(provider)) { p.cancel('Cancelled.'); process.exit(0); }

  // memory + channel + dashboard only relevant for agent template
  let memory: Memory = 'none';
  let channel: Channel = 'none';
  let dashboard = false;

  if (template === 'agent') {
    const memoryAnswer = await p.select<{ value: Memory; label: string; hint: string }[], Memory>({
      message: 'Memory:',
      options: [
        { value: 'none', label: 'None', hint: 'stateless' },
        { value: 'kv', label: 'KV  (session history)', hint: 'Cloudflare KV' },
        { value: 'd1', label: 'D1  (persistent history)', hint: 'Cloudflare D1 SQLite' },
      ],
    });
    if (p.isCancel(memoryAnswer)) { p.cancel('Cancelled.'); process.exit(0); }
    memory = memoryAnswer as Memory;

    const channelAnswer = await p.select<{ value: Channel; label: string }[], Channel>({
      message: 'Channel:',
      options: [
        { value: 'none', label: 'None  (HTTP only)' },
        { value: 'telegram', label: 'Telegram Bot' },
        { value: 'webchat', label: 'Web Chat  (SSE)' },
      ],
    });
    if (p.isCancel(channelAnswer)) { p.cancel('Cancelled.'); process.exit(0); }
    channel = channelAnswer as Channel;

    const dashboardAnswer = await p.confirm({
      message: 'Include self-hosted dashboard?  (chat playground + agent list at /dashboard)',
      initialValue: false,
    });
    if (p.isCancel(dashboardAnswer)) { p.cancel('Cancelled.'); process.exit(0); }
    dashboard = Boolean(dashboardAnswer);
  }

  const install = await p.confirm({ message: 'Install dependencies?' });

  if (p.isCancel(install)) { p.cancel('Cancelled.'); process.exit(0); }

  return {
    name: String(name).trim(),
    template: template as Template,
    provider: provider as Provider,
    memory,
    channel,
    dashboard,
    install: Boolean(install),
  };
}
