import * as p from '@clack/prompts';
import type { ProjectConfig, Provider, Memory, Channel, Template, PackageManager } from './types.js';
import { providerModels } from './templates/constants.js';

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
      { value: 'multi-agent', label: 'Multi-Agent', hint: 'Supervisor + specialist agents (AgentNetwork)' },
      { value: 'mcp-server', label: 'MCP Server', hint: 'Expose agents as tools in Claude Code' },
    ],
  });

  if (p.isCancel(template)) { p.cancel('Cancelled.'); process.exit(0); }

  const provider = await p.select<{ value: Provider; label: string; hint: string }[], Provider>({
    message: 'LLM Provider:',
    options: [
      { value: 'groq', label: 'Groq', hint: 'llama-3.3-70b-versatile  (fast, free tier)' },
      { value: 'google', label: 'Google Gemini', hint: 'gemini-2.0-flash  (generous free tier)' },
      { value: 'openai', label: 'OpenAI', hint: 'gpt-4o-mini  (industry standard)' },
      { value: 'anthropic', label: 'Anthropic', hint: 'claude-3-5-haiku  (best reasoning)' },
      { value: 'cerebras', label: 'Cerebras', hint: 'llama3.3-70b  (ultra-fast inference)' },
      { value: 'workersai', label: 'Cloudflare Workers AI', hint: '@cf/meta/llama-3.1-8b  (no API key needed)' },
    ],
  });

  if (p.isCancel(provider)) { p.cancel('Cancelled.'); process.exit(0); }

  const models = providerModels[provider as Provider];
  const modelAnswer = await p.select<{ value: string; label: string; hint?: string }[], string>({
    message: 'Model:',
    options: models.map((m, i) => ({ value: m, label: m, hint: i === 0 ? 'recommended' : undefined })),
  });
  if (p.isCancel(modelAnswer)) { p.cancel('Cancelled.'); process.exit(0); }

  // memory + channel + dashboard apply to agent and multi-agent templates
  let memory: Memory = 'none';
  let channel: Channel = 'none';
  let dashboard = false;

  if (template === 'agent' || template === 'multi-agent') {
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

  let packageManager: PackageManager = 'npm';
  if (install) {
    const pkgAnswer = await p.select<{ value: PackageManager; label: string }[], PackageManager>({
      message: 'Package manager:',
      options: [
        { value: 'npm', label: 'npm' },
        { value: 'pnpm', label: 'pnpm  (recommended)' },
        { value: 'yarn', label: 'Yarn' },
      ],
    });
    if (p.isCancel(pkgAnswer)) { p.cancel('Cancelled.'); process.exit(0); }
    packageManager = pkgAnswer as PackageManager;
  }

  return {
    name: String(name).trim(),
    template: template as Template,
    provider: provider as Provider,
    model: String(modelAnswer),
    memory,
    channel,
    dashboard,
    install: Boolean(install),
    packageManager,
  };
}
