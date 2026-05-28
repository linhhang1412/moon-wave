import { describe, it, expect, vi } from 'vitest';
import { ToolRegistry, tool } from '../tool';
import type { AgentContext } from '@moon-wave/types';

const mockCtx: AgentContext = { sessionId: 'test', env: {} };

describe('ToolRegistry', () => {
  it('registers and retrieves a tool', () => {
    const registry = new ToolRegistry();
    const myTool = tool({
      schema: { name: 'greet', description: 'Say hello', parameters: { type: 'object', properties: {} } },
      execute: async () => 'hello',
    });
    registry.register(myTool);
    expect(registry.get('greet')).toBe(myTool);
  });

  it('getSchemas returns all registered schemas', () => {
    const registry = new ToolRegistry();
    registry.registerMany([
      tool({ schema: { name: 'a', description: 'A', parameters: { type: 'object', properties: {} } }, execute: async () => null }),
      tool({ schema: { name: 'b', description: 'B', parameters: { type: 'object', properties: {} } }, execute: async () => null }),
    ]);
    const schemas = registry.getSchemas();
    expect(schemas).toHaveLength(2);
    expect(schemas.map((s) => s.name)).toEqual(['a', 'b']);
  });

  it('executes a registered tool', async () => {
    const registry = new ToolRegistry();
    const execute = vi.fn().mockResolvedValue(42);
    registry.register(tool({ schema: { name: 'calc', description: '', parameters: { type: 'object', properties: {} } }, execute }));
    const result = await registry.execute('calc', { x: 1 }, mockCtx);
    expect(result).toBe(42);
    expect(execute).toHaveBeenCalledWith({ x: 1 }, mockCtx);
  });

  it('throws when executing unknown tool', async () => {
    const registry = new ToolRegistry();
    await expect(registry.execute('missing', {}, mockCtx)).rejects.toThrow('Tool "missing" not found in registry');
  });
});
