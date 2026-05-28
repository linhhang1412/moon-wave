import type { ProjectConfig } from '../../types.js';

export function wranglerToml(config: ProjectConfig): string {
  const { name, provider, memory } = config;

  const kvBinding =
    memory === 'kv'
      ? `
[[kv_namespaces]]
binding = "KV"
id = "YOUR_KV_NAMESPACE_ID"
`
      : '';

  const d1Binding =
    memory === 'd1'
      ? `
[[d1_databases]]
binding = "DB"
database_name = "${name}-db"
database_id = "YOUR_D1_DATABASE_ID"
`
      : '';

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
${kvBinding}${d1Binding}${aiBinding}`.trim();
}
