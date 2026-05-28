import type { ProjectConfig, Provider } from '../../types.js';

const providerEnvKey: Record<Provider, string> = {
  groq: 'GROQ_API_KEY',
  google: 'GOOGLE_AI_KEY',
  cerebras: 'CEREBRAS_API_KEY',
  workersai: '',
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
};

export function mcpEnvExample(config: ProjectConfig): string {
  const envKey = providerEnvKey[config.provider];
  const lines = ['MOON_WAVE_TOKEN='];
  if (envKey) lines.push(`${envKey}=`);
  return lines.join('\n') + '\n';
}
