import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ProjectConfig } from '../../types.js';
import {
  indexTs,
  chatHandlerTs,
  chatNetworkTs,
  chatToolsTs,
  researchAgentTs,
  writerAgentTs,
  sharedEnvTs,
  sharedCorsTs,
} from './source-files.js';
import { multiAgentPackageJson } from './package-json.js';
import { multiAgentWranglerToml } from './wrangler-toml.js';
import { multiAgentEnvExample } from './env-example.js';
import { multiAgentReadme } from './readme.js';
import { tsconfigJson, gitignore } from '../shared.js';

export async function generateMultiAgentFiles(config: ProjectConfig, root: string): Promise<void> {
  await Promise.all([
    mkdir(join(root, 'src', 'features', 'chat', 'agents'), { recursive: true }),
    mkdir(join(root, 'src', 'shared'), { recursive: true }),
  ]);

  const writes: Promise<void>[] = [
    writeFile(join(root, 'src', 'index.ts'), indexTs(config)),
    writeFile(join(root, 'src', 'features', 'chat', 'handler.ts'), chatHandlerTs(config)),
    writeFile(join(root, 'src', 'features', 'chat', 'network.ts'), chatNetworkTs(config)),
    writeFile(join(root, 'src', 'features', 'chat', 'tools.ts'), chatToolsTs()),
    writeFile(join(root, 'src', 'features', 'chat', 'agents', 'research.ts'), researchAgentTs(config)),
    writeFile(join(root, 'src', 'features', 'chat', 'agents', 'writer.ts'), writerAgentTs(config)),
    writeFile(join(root, 'src', 'shared', 'env.ts'), sharedEnvTs(config)),
    writeFile(join(root, 'package.json'), multiAgentPackageJson(config)),
    writeFile(join(root, 'wrangler.toml'), multiAgentWranglerToml(config)),
    writeFile(join(root, 'tsconfig.json'), tsconfigJson()),
    writeFile(join(root, '.env.example'), multiAgentEnvExample(config)),
    writeFile(join(root, '.gitignore'), gitignore()),
    writeFile(join(root, 'README.md'), multiAgentReadme(config)),
  ];

  if (config.channel === 'none') {
    writes.push(writeFile(join(root, 'src', 'shared', 'cors.ts'), sharedCorsTs()));
  }

  await Promise.all(writes);
}
