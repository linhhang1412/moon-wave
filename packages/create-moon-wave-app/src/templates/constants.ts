import type { Provider } from '../types.js';

export const providerEnvKey: Record<Provider, string> = {
  groq: 'GROQ_API_KEY',
  google: 'GOOGLE_AI_KEY',
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
