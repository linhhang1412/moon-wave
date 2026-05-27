import type { LLMProvider, ProviderName } from '@moon-wave/types';
import { GroqProvider, type GroqConfig } from './groq';
import { WorkersAIProvider, type WorkersAIConfig } from './workersai';
import { OllamaProvider, type OllamaConfig } from './ollama';
import { GoogleProvider, type GoogleConfig } from './google';
import { CerebrasProvider, type CerebrasConfig } from './cerebras';

type ProviderConfigMap = {
  groq: GroqConfig;
  workersai: WorkersAIConfig;
  ollama: OllamaConfig;
  google: GoogleConfig;
  cerebras: CerebrasConfig;
};

export class LLMRouter {
  private providers = new Map<string, LLMProvider>();

  register<T extends ProviderName>(name: T, config: ProviderConfigMap[T]): this {
    switch (name) {
      case 'groq':
        this.providers.set(name, new GroqProvider(config as GroqConfig));
        break;
      case 'workersai':
        this.providers.set(name, new WorkersAIProvider(config as WorkersAIConfig));
        break;
      case 'ollama':
        this.providers.set(name, new OllamaProvider(config as OllamaConfig));
        break;
      case 'google':
        this.providers.set(name, new GoogleProvider(config as GoogleConfig));
        break;
      case 'cerebras':
        this.providers.set(name, new CerebrasProvider(config as CerebrasConfig));
        break;
    }
    return this;
  }

  get(name: ProviderName): LLMProvider {
    const provider = this.providers.get(name);
    if (!provider) throw new Error(`Provider "${name}" not registered. Call .register("${name}", config) first.`);
    return provider;
  }

  has(name: ProviderName): boolean {
    return this.providers.has(name);
  }
}
