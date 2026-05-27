export interface FileEntry {
  path: string;
  size: number;
  contentType: string;
  createdAt: number;
}

export interface R2Binding {
  put(key: string, value: ArrayBuffer | string, options?: { httpMetadata?: { contentType?: string }; customMetadata?: Record<string, string> }): Promise<void>;
  get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer>; text(): Promise<string>; httpMetadata?: { contentType?: string }; customMetadata?: Record<string, string> } | null>;
  list(options?: { prefix?: string }): Promise<{ objects: Array<{ key: string; size: number; httpMetadata?: { contentType?: string }; customMetadata?: Record<string, string> }> }>;
  delete(key: string): Promise<void>;
}

export class FileSystem {
  private prefix: string;

  constructor(private r2: R2Binding, workspaceId: string) {
    this.prefix = `workspaces/${workspaceId}/files`;
  }

  private key(path: string): string {
    const clean = path.replace(/\.\.\//g, '').replace(/^[/\\]/, '');
    return `${this.prefix}/${clean}`;
  }

  async write(path: string, content: ArrayBuffer | string, contentType = 'text/plain'): Promise<FileEntry> {
    const key = this.key(path);
    const body = typeof content === 'string' ? new TextEncoder().encode(content).buffer : content;
    await this.r2.put(key, body, {
      httpMetadata: { contentType },
      customMetadata: { createdAt: Date.now().toString(), path },
    });
    return { path, size: (body as ArrayBuffer).byteLength, contentType, createdAt: Date.now() };
  }

  async read(path: string): Promise<ArrayBuffer | null> {
    const obj = await this.r2.get(this.key(path));
    if (!obj) return null;
    return obj.arrayBuffer();
  }

  async readText(path: string): Promise<string | null> {
    const buf = await this.read(path);
    if (!buf) return null;
    return new TextDecoder().decode(buf);
  }

  async list(prefix?: string): Promise<FileEntry[]> {
    const listPrefix = prefix ? `${this.prefix}/${prefix}` : this.prefix;
    const result = await this.r2.list({ prefix: listPrefix });
    return result.objects.map((obj) => ({
      path: obj.key.replace(`${this.prefix}/`, ''),
      size: obj.size,
      contentType: obj.httpMetadata?.contentType ?? 'application/octet-stream',
      createdAt: parseInt(obj.customMetadata?.createdAt ?? '0'),
    }));
  }

  async delete(path: string): Promise<void> {
    await this.r2.delete(this.key(path));
  }

  async grep(query: string, filePrefix?: string): Promise<Array<{ path: string; line: string; lineNumber: number }>> {
    const files = await this.list(filePrefix);
    const results: Array<{ path: string; line: string; lineNumber: number }> = [];
    for (const file of files) {
      if (!file.contentType.startsWith('text/')) continue;
      const text = await this.readText(file.path);
      if (!text) continue;
      text.split('\n').forEach((line, i) => {
        if (line.toLowerCase().includes(query.toLowerCase())) {
          results.push({ path: file.path, line: line.trim(), lineNumber: i + 1 });
        }
      });
    }
    return results;
  }
}
