#!/usr/bin/env node
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { runPrompts } from './prompts.js';
import { generate } from './generate.js';

const nameArg = process.argv[2];

try {
  const config = await runPrompts(nameArg);
  await generate(config, process.cwd());

  p.outro(
    `${pc.green('✓')} Created ${pc.bold(config.name)}\n\n` +
    `  cd ${config.name}\n` +
    (config.install ? '' : `  npm install\n`) +
    `  npm run dev`
  );
} catch (err) {
  p.cancel(String(err));
  process.exit(1);
}
