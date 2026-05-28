import type { ProjectConfig } from '../../types.js';

export function mcpWranglerToml(config: ProjectConfig): string {
  const { name, provider } = config;
  const aiBinding =
    provider === 'workersai'
      ? `
[ai]
binding = "AI"
`
      : '';

  return `name = "${name}"
main = "src/index.ts"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]
${aiBinding}`.trim();
}
