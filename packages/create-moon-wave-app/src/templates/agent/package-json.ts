import type { ProjectConfig } from '../../types.js';
import { VERSIONS } from '../constants.js';

export function packageJson(config: ProjectConfig): string {
  const { name, memory, channel, dashboard } = config;
  const deps: Record<string, string> = {
    '@moon-wave/core':      VERSIONS.core,
    '@moon-wave/providers': VERSIONS.providers,
  };

  if (memory !== 'none') deps['@moon-wave/memory']    = VERSIONS.memory;
  if (channel !== 'none') deps['@moon-wave/channels']  = VERSIONS.channels;
  if (dashboard)           deps['@moon-wave/dashboard'] = VERSIONS.dashboard;

  return JSON.stringify(
    {
      name,
      version: '0.1.0',
      private: true,
      type: 'module',
      scripts: {
        dev: 'wrangler dev',
        deploy: 'wrangler deploy',
      },
      dependencies: deps,
      devDependencies: {
        '@cloudflare/workers-types': '^4.20241205.0',
        wrangler: '^3.100.0',
        typescript: '^5.5.0',
      },
    },
    null,
    2,
  );
}
