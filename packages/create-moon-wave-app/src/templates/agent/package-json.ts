import type { ProjectConfig } from '../../types.js';

export function packageJson(config: ProjectConfig): string {
  const { name, memory, channel, dashboard } = config;
  const deps: Record<string, string> = {
    '@moon-wave/core': '^0.1.0',
    '@moon-wave/providers': '^0.1.0',
  };

  if (memory !== 'none') deps['@moon-wave/memory'] = '^0.1.0';
  if (channel !== 'none') deps['@moon-wave/channels'] = '^0.1.0';
  if (dashboard) deps['@moon-wave/dashboard'] = '^0.1.0';

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
        '@cloudflare/workers-types': '^4.0.0',
        wrangler: '^3.0.0',
        typescript: '^5.5.0',
      },
    },
    null,
    2,
  );
}
