export type Template = 'agent' | 'mcp-server';
export type Provider = 'groq' | 'google' | 'cerebras' | 'workersai';
export type Memory = 'none' | 'kv' | 'd1';
export type Channel = 'none' | 'telegram' | 'webchat';

export interface ProjectConfig {
  name: string;
  template: Template;
  provider: Provider;
  memory: Memory;
  channel: Channel;
  dashboard: boolean;
  install: boolean;
}
