import type { ProjectConfig } from '../../types.js';
import { providerEnvKey } from '../constants.js';

export function mcpEnvExample(config: ProjectConfig): string {
  const envKey = providerEnvKey[config.provider];
  const lines = ['MOON_WAVE_TOKEN='];
  if (envKey) lines.push(`${envKey}=`);
  return lines.join('\n') + '\n';
}
