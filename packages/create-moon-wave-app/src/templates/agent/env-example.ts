import type { ProjectConfig, Provider } from '../../types.js';

const providerEnvKey: Record<Provider, string> = {
  groq: 'GROQ_API_KEY',
  google: 'GOOGLE_AI_KEY',
  cerebras: 'CEREBRAS_API_KEY',
  workersai: '',
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
};

export function envExample(config: ProjectConfig): string {
  const { provider, channel } = config;
  const envKey = providerEnvKey[provider];
  const lines: string[] = [];

  if (envKey) lines.push(`${envKey}=`);
  if (channel === 'telegram') lines.push('TELEGRAM_TOKEN=');

  return lines.join('\n') + '\n';
}
