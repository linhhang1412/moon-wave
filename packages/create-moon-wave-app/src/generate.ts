import { join } from 'node:path';
import { execSync } from 'node:child_process';
import type { ProjectConfig } from './types.js';
import { generateAgentFiles } from './templates/agent/index.js';
import { generateMcpFiles } from './templates/mcp-server/index.js';
import { generateMultiAgentFiles } from './templates/multi-agent/index.js';

const installCmd: Record<string, string> = {
  npm: 'npm install',
  pnpm: 'pnpm install',
  yarn: 'yarn',
};

export async function generate(config: ProjectConfig, cwd: string): Promise<void> {
  const root = join(cwd, config.name);

  if (config.template === 'mcp-server') {
    await generateMcpFiles(config, root);
  } else if (config.template === 'multi-agent') {
    await generateMultiAgentFiles(config, root);
  } else {
    await generateAgentFiles(config, root);
  }

  if (config.install) {
    execSync(installCmd[config.packageManager] ?? 'npm install', { cwd: root, stdio: 'inherit' });
  }
}
