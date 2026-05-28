import type { ProjectConfig } from '../../types.js';
import { providerEnvKey } from '../constants.js';

export function envExample(config: ProjectConfig): string {
  const { provider, channel } = config;
  const envKey = providerEnvKey[provider];
  const lines: string[] = [];

  if (envKey) lines.push(`${envKey}=`);
  if (channel === 'telegram') lines.push('TELEGRAM_TOKEN=');

  return lines.join('\n') + '\n';
}
