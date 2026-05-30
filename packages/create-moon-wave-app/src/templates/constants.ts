import type { Provider } from '../types.js';

// Versions của các @moon-wave/* packages trên npm.
// Khi publish package mới, chỉ cần cập nhật tại đây.
export const VERSIONS = {
  core:        '^0.1.2',
  providers:   '^0.1.1',
  memory:      '^0.1.1',
  channels:    '^0.1.1',
  dashboard:   '^0.2.1',
  mcp:         '^0.1.1',
  multiAgent:  '^0.1.1',
} as const;

export const providerEnvKey: Record<Provider, string> = {
  groq: 'GROQ_API_KEY',
  google: 'GOOGLE_API_KEY',
  cerebras: 'CEREBRAS_API_KEY',
  workersai: '',
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
};

export const providerModel: Record<Provider, string> = {
  groq: 'llama-3.3-70b-versatile',
  google: 'gemini-2.0-flash',
  cerebras: 'llama3.3-70b',
  workersai: '@cf/meta/llama-3.1-8b-instruct',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-20241022',
};

export const providerModels: Record<Provider, string[]> = {
  groq: ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
  google: ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  cerebras: ['llama3.3-70b', 'llama3.1-8b'],
  workersai: ['@cf/meta/llama-3.1-8b-instruct', '@cf/meta/llama-3.3-70b-instruct-fp8-fast', '@cf/mistral/mistral-7b-instruct-v0.2'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  anthropic: ['claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-3-5-sonnet-20241022'],
};
