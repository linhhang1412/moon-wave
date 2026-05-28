import { describe, it, expect } from 'vitest';
import { LLMRouter } from '../router';

describe('LLMRouter', () => {
  it('throws when getting unregistered provider', () => {
    const router = new LLMRouter();
    expect(() => router.get('groq')).toThrow('Provider "groq" not registered');
  });

  it('has() returns false before registration', () => {
    const router = new LLMRouter();
    expect(router.has('groq')).toBe(false);
  });

  it('registers and retrieves a provider', () => {
    const router = new LLMRouter();
    router.register('groq', { apiKey: 'test-key', model: 'llama3' });
    expect(router.has('groq')).toBe(true);
    expect(router.get('groq')).toBeDefined();
  });

  it('registers OpenAI provider', () => {
    const router = new LLMRouter();
    router.register('openai', { apiKey: 'sk-test', model: 'gpt-4o' });
    expect(router.has('openai')).toBe(true);
    expect(router.get('openai')).toBeDefined();
  });

  it('registers Anthropic provider', () => {
    const router = new LLMRouter();
    router.register('anthropic', { apiKey: 'ant-test', model: 'claude-3-5-sonnet-20241022' });
    expect(router.has('anthropic')).toBe(true);
    expect(router.get('anthropic')).toBeDefined();
  });

  it('register returns this for chaining', () => {
    const router = new LLMRouter();
    const result = router.register('groq', { apiKey: 'k', model: 'm' });
    expect(result).toBe(router);
  });
});
