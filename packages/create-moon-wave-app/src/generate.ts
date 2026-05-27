import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import type { ProjectConfig } from './types.js';
import {
  indexTs, packageJson, wranglerToml, tsconfigJson, envExample, gitignore, readme,
  mcpIndexTs, mcpPackageJson, mcpWranglerToml, mcpEnvExample, mcpReadme,
} from './templates.js';

export async function generate(config: ProjectConfig, cwd: string): Promise<void> {
  const root = join(cwd, config.name);

  await mkdir(join(root, 'src'), { recursive: true });

  if (config.template === 'mcp-server') {
    await Promise.all([
      writeFile(join(root, 'src', 'index.ts'), mcpIndexTs(config)),
      writeFile(join(root, 'package.json'), mcpPackageJson(config)),
      writeFile(join(root, 'wrangler.toml'), mcpWranglerToml(config)),
      writeFile(join(root, 'tsconfig.json'), tsconfigJson()),
      writeFile(join(root, '.env.example'), mcpEnvExample(config)),
      writeFile(join(root, '.gitignore'), gitignore()),
      writeFile(join(root, 'README.md'), mcpReadme(config)),
    ]);
  } else {
    await Promise.all([
      writeFile(join(root, 'src', 'index.ts'), indexTs(config)),
      writeFile(join(root, 'package.json'), packageJson(config)),
      writeFile(join(root, 'wrangler.toml'), wranglerToml(config)),
      writeFile(join(root, 'tsconfig.json'), tsconfigJson()),
      writeFile(join(root, '.env.example'), envExample(config)),
      writeFile(join(root, '.gitignore'), gitignore()),
      writeFile(join(root, 'README.md'), readme(config)),
    ]);
  }

  if (config.install) {
    execSync('npm install', { cwd: root, stdio: 'inherit' });
  }
}
