import * as p from '@clack/prompts';
import type { ProjectConfig, Provider, Memory, Channel } from './types.js';

export async function runPrompts(nameArg?: string): Promise<ProjectConfig> {
  p.intro('create-moon-wave-app');

  const name = nameArg ?? await p.text({
    message: 'Project name:',
    placeholder: 'my-agent',
    validate: (v) => v.trim().length === 0 ? 'Name is required' : undefined,
  });

  if (p.isCancel(name)) { p.cancel('Cancelled.'); process.exit(0); }

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

  const memory = await p.select<{ value: Memory; label: string; hint: string }[], Memory>({
    message: 'Memory:',
    options: [
      { value: 'none', label: 'None', hint: 'stateless' },
      { value: 'kv', label: 'KV  (session history)', hint: 'Cloudflare KV' },
      { value: 'd1', label: 'D1  (persistent history)', hint: 'Cloudflare D1 SQLite' },
    ],
  });

  if (p.isCancel(memory)) { p.cancel('Cancelled.'); process.exit(0); }

  const channel = await p.select<{ value: Channel; label: string }[], Channel>({
    message: 'Channel:',
    options: [
      { value: 'none', label: 'None  (HTTP only)' },
      { value: 'telegram', label: 'Telegram Bot' },
      { value: 'webchat', label: 'Web Chat  (SSE)' },
    ],
  });

  if (p.isCancel(channel)) { p.cancel('Cancelled.'); process.exit(0); }

  const install = await p.confirm({ message: 'Install dependencies?' });

  if (p.isCancel(install)) { p.cancel('Cancelled.'); process.exit(0); }

  return {
    name: String(name).trim(),
    provider: provider as Provider,
    memory: memory as Memory,
    channel: channel as Channel,
    install: Boolean(install),
  };
}
