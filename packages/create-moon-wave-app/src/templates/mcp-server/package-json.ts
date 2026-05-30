import type { ProjectConfig } from '../../types.js';
import { VERSIONS } from '../constants.js';

export function mcpPackageJson(config: ProjectConfig): string {
  return JSON.stringify(
    {
      name: config.name,
      version: '0.1.0',
      private: true,
      type: 'module',
      scripts: {
        dev: 'wrangler dev',
        deploy: 'wrangler deploy',
      },
      dependencies: {
        '@moon-wave/core': VERSIONS.core,
        '@moon-wave/mcp':  VERSIONS.mcp,
      },
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
