export type Template = 'agent' | 'mcp-server' | 'multi-agent';
export type Provider = 'groq' | 'google' | 'cerebras' | 'workersai' | 'openai' | 'anthropic';
export type Memory = 'none' | 'kv' | 'd1';
export type Channel = 'none' | 'telegram' | 'webchat';
export type PackageManager = 'npm' | 'pnpm' | 'yarn';

export interface ProjectConfig {
  name: string;
  template: Template;
  provider: Provider;
  model: string;
  memory: Memory;
  channel: Channel;
  dashboard: boolean;
  install: boolean;
  packageManager: PackageManager;
}
