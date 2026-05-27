import type { VectorAdapter, VectorItem, VectorMatch, AiBinding } from '@moon-wave/types';

export interface VectorizeBinding {
  insert(vectors: Array<{ id: string; values: number[]; metadata?: Record<string, unknown> }>): Promise<void>;
  query(vector: number[], options: { topK: number; returnMetadata: boolean }): Promise<{
    matches: Array<{ id: string; score: number; metadata?: Record<string, unknown> }>;
  }>;
  deleteByIds(ids: string[]): Promise<void>;
}

const EMBED_MODEL = '@cf/baai/bge-base-en-v1.5';

export class VectorizeAdapter implements VectorAdapter {
  constructor(
    private vectorize: VectorizeBinding,
    private ai: AiBinding,
  ) {}

  private async embed(text: string): Promise<number[]> {
    const response = (await this.ai.run(EMBED_MODEL, { text: [text] })) as {
      data: number[][];
    };
    return response.data[0];
  }

  async insert(items: VectorItem[]): Promise<void> {
    await this.vectorize.insert(items);
  }

  async insertText(id: string, text: string, metadata?: Record<string, unknown>): Promise<void> {
    const values = await this.embed(text);
    await this.insert([{ id, values, metadata: { ...metadata, text } }]);
  }

  async query(vector: number[], topK = 5): Promise<VectorMatch[]> {
    const results = await this.vectorize.query(vector, { topK, returnMetadata: true });
    return results.matches.map((m) => ({
      id: m.id,
      score: m.score,
      metadata: m.metadata,
    }));
  }

  async queryByText(text: string, topK = 5): Promise<VectorMatch[]> {
    const vector = await this.embed(text);
    return this.query(vector, topK);
  }

  async delete(ids: string[]): Promise<void> {
    await this.vectorize.deleteByIds(ids);
  }
}
