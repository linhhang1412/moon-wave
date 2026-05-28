import { join } from 'node:path';
import { execSync } from 'node:child_process';
import type { ProjectConfig } from './types.js';
import { generateAgentFiles } from './templates/agent/index.js';
import { generateMcpFiles } from './templates/mcp-server/index.js';

export async function generate(config: ProjectConfig, cwd: string): Promise<void> {
  const root = join(cwd, config.name);

  if (config.template === 'mcp-server') {
    await generateMcpFiles(config, root);
  } else {
    await generateAgentFiles(config, root);
  }

  if (config.install) {
    execSync('npm install', { cwd: root, stdio: 'inherit' });
  }
}
