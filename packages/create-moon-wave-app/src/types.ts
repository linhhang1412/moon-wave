export type Provider = 'groq' | 'google' | 'cerebras' | 'workersai';
export type Memory = 'none' | 'kv' | 'd1';
export type Channel = 'none' | 'telegram' | 'webchat';

export interface ProjectConfig {
  name: string;
  provider: Provider;
  memory: Memory;
  channel: Channel;
  install: boolean;
}
