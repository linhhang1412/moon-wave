import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ProjectConfig } from '../../types.js';
import {
  indexTs,
  chatAgentTs,
  chatHandlerTs,
  chatToolsTs,
  sharedEnvTs,
  sharedCorsTs,
} from './source-files.js';
import { packageJson } from './package-json.js';
import { wranglerToml } from './wrangler-toml.js';
import { envExample } from './env-example.js';
import { readme } from './readme.js';
import { tsconfigJson, gitignore } from '../shared.js';

export async function generateAgentFiles(config: ProjectConfig, root: string): Promise<void> {
  await Promise.all([
    mkdir(join(root, 'src', 'features', 'chat'), { recursive: true }),
    mkdir(join(root, 'src', 'shared'), { recursive: true }),
  ]);

  const writes: Promise<void>[] = [
    writeFile(join(root, 'src', 'index.ts'), indexTs(config)),
    writeFile(join(root, 'src', 'features', 'chat', 'agent.ts'), chatAgentTs(config)),
    writeFile(join(root, 'src', 'features', 'chat', 'handler.ts'), chatHandlerTs(config)),
    writeFile(join(root, 'src', 'features', 'chat', 'tools.ts'), chatToolsTs()),
    writeFile(join(root, 'src', 'shared', 'env.ts'), sharedEnvTs(config)),
    writeFile(join(root, 'package.json'), packageJson(config)),
    writeFile(join(root, 'wrangler.toml'), wranglerToml(config)),
    writeFile(join(root, 'tsconfig.json'), tsconfigJson()),
    writeFile(join(root, '.dev.vars.example'), envExample(config)),
    writeFile(join(root, '.gitignore'), gitignore()),
    writeFile(join(root, 'README.md'), readme(config)),
  ];

  // cors.ts only needed for plain HTTP channel
  if (config.channel === 'none') {
    writes.push(writeFile(join(root, 'src', 'shared', 'cors.ts'), sharedCorsTs()));
  }

  await Promise.all(writes);
}
