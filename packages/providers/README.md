# @moon-wave/providers

LLM router for moon-wave — supports Groq, OpenAI, Anthropic, Google, Cerebras, Cloudflare Workers AI, and Ollama.

## Installation

```bash
npm install @moon-wave/providers
```

## Supported Providers

| Provider | `provider` key | Env variable | Notes |
|----------|---------------|--------------|-------|
| Groq | `groq` | `GROQ_API_KEY` | Fast inference, Llama/Mixtral models |
| OpenAI | `openai` | `OPENAI_API_KEY` | GPT-4o, GPT-4o-mini, etc. |
| Anthropic | `anthropic` | `ANTHROPIC_API_KEY` | Claude 3.5 Sonnet, Haiku, Opus |
| Google | `google` | `GOOGLE_API_KEY` | Gemini models via OpenAI-compatible endpoint |
| Cerebras | `cerebras` | `CEREBRAS_API_KEY` | Ultra-fast Llama inference |
| Workers AI | `workersai` | `AI` binding | Cloudflare-native inference |
| Ollama | `ollama` | `OLLAMA_BASE_URL` | Self-hosted models |

## Usage

Providers are configured automatically when you pass `model` to `Agent`. Set the corresponding environment variable or Cloudflare secret:

```typescript
// Groq
const agent = new Agent({ model: { provider: 'groq', model: 'llama-3.3-70b-versatile' }, ... });
// Requires: GROQ_API_KEY in env

// OpenAI
const agent = new Agent({ model: { provider: 'openai', model: 'gpt-4o' }, ... });
// Requires: OPENAI_API_KEY in env

// Anthropic
const agent = new Agent({ model: { provider: 'anthropic', model: 'claude-sonnet-4-6' }, ... });
// Requires: ANTHROPIC_API_KEY in env
```

## Direct Usage

```typescript
import { LLMRouter } from '@moon-wave/providers';

const router = new LLMRouter();
router.register('groq', { apiKey: env.GROQ_API_KEY, model: 'llama-3.3-70b-versatile' });

const provider = router.get('groq');
const response = await provider.chat([
  { role: 'user', content: 'Hello!' }
]);
console.log(response.content);
```

## Retry Behavior

All providers use automatic retry with **exponential backoff** for transient errors:
- Retries on HTTP `429` (rate limit), `500`, `502`, `503`, `504`
- Retries on network errors (`TypeError`)
- Default: 3 attempts, 1s base delay (2s → 4s with jitter)
- No retry on `400`, `401`, `403` (client errors)

```typescript
import { withRetry, fetchWithRetry } from '@moon-wave/providers';

// Wrap any async function
const result = await withRetry(() => callExternalAPI(), { maxAttempts: 3, baseDelayMs: 500 });
```

## Custom Provider

Implement `LLMProvider` from `@moon-wave/types`:

```typescript
import { BaseProvider } from '@moon-wave/providers';
import type { Message, LLMResponse, ToolSchema } from '@moon-wave/types';

class MyProvider extends BaseProvider {
  async chat(messages: Message[], tools?: ToolSchema[]): Promise<LLMResponse> {
    // Call your API using this.fetch() for automatic retry
    const res = await this.fetch('https://my-api.com/chat', { ... });
    return { type: 'text', content: await res.text() };
  }
}
```

## License

MIT
