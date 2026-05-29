import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ProjectConfig } from '../../types.js';
import { mcpIndexTs, mcpAgentHandlerTs, mcpSharedEnvTs } from './source-files.js';
import { mcpPackageJson } from './package-json.js';
import { mcpWranglerToml } from './wrangler-toml.js';
import { mcpEnvExample } from './env-example.js';
import { mcpReadme } from './readme.js';
import { tsconfigJson, gitignore } from '../shared.js';

export async function generateMcpFiles(config: ProjectConfig, root: string): Promise<void> {
  await Promise.all([
    mkdir(join(root, 'src', 'features', 'agent'), { recursive: true }),
    mkdir(join(root, 'src', 'shared'), { recursive: true }),
  ]);

  await Promise.all([
    writeFile(join(root, 'src', 'index.ts'), mcpIndexTs()),
    writeFile(join(root, 'src', 'features', 'agent', 'handler.ts'), mcpAgentHandlerTs(config)),
    writeFile(join(root, 'src', 'shared', 'env.ts'), mcpSharedEnvTs(config)),
    writeFile(join(root, 'package.json'), mcpPackageJson(config)),
    writeFile(join(root, 'wrangler.toml'), mcpWranglerToml(config)),
    writeFile(join(root, 'tsconfig.json'), tsconfigJson()),
    writeFile(join(root, '.dev.vars.example'), mcpEnvExample(config)),
    writeFile(join(root, '.gitignore'), gitignore()),
    writeFile(join(root, 'README.md'), mcpReadme(config)),
  ]);
}
