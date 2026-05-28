import { describe, it, expect, vi } from 'vitest';
import { AgentLoop } from '../AgentLoop';
import type { LLMProvider, LLMResponse, Message, StreamEvent } from '@moon-wave/types';
import type { MemoryManager } from '@moon-wave/memory';
import type { ToolRegistry } from '../tool';

async function collectStream(stream: ReadableStream<StreamEvent>): Promise<StreamEvent[]> {
  const events: StreamEvent[] = [];
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    events.push(value);
  }
  return events;
}

function makeMemory(): MemoryManager {
  const store: Message[] = [];
  return {
    getMessages: vi.fn().mockImplementation(async () => [...store]),
    addMessage: vi.fn().mockImplementation(async (_id: string, msg: Message) => { store.push(msg); }),
    clearSession: vi.fn(),
    remember: vi.fn(),
    recall: vi.fn().mockResolvedValue([]),
  } as unknown as MemoryManager;
}

function makeTools(results: Record<string, unknown> = {}): ToolRegistry {
  return {
    getSchemas: vi.fn().mockReturnValue([]),
    execute: vi.fn().mockImplementation(async (name: string) => {
      if (name in results) return results[name];
      throw new Error(`tool ${name} failed`);
    }),
  } as unknown as ToolRegistry;
}

const ctx = { sessionId: 'sess-1', env: {} };

describe('AgentLoop', () => {
  it('returns text response on first turn', async () => {
    const provider: LLMProvider = {
      chat: vi.fn().mockResolvedValue({ type: 'text', content: 'Hello!' } as LLMResponse),
      stream: vi.fn(),
    };
    const loop = new AgentLoop({ agentName: 'bot', systemPrompt: 'You help.', provider, memory: makeMemory(), tools: makeTools(), maxIterations: 5 });
    const result = await loop.run('Hi', ctx);
    expect(result.output).toBe('Hello!');
    expect(result.iterations).toBe(1);
  });

  it('executes tool calls and continues loop', async () => {
    const provider: LLMProvider = {
      chat: vi.fn()
        .mockResolvedValueOnce({ type: 'tool_call', toolCalls: [{ id: 't1', name: 'get_time', args: {} }] } as LLMResponse)
        .mockResolvedValueOnce({ type: 'text', content: 'The time is now.' } as LLMResponse),
      stream: vi.fn(),
    };
    const tools = makeTools({ get_time: '2024-01-01' });
    const loop = new AgentLoop({ agentName: 'bot', systemPrompt: '', provider, memory: makeMemory(), tools, maxIterations: 5 });
    const result = await loop.run('What time is it?', ctx);
    expect(result.output).toBe('The time is now.');
    expect(result.toolCalls).toHaveLength(1);
    expect(result.toolCalls[0].name).toBe('get_time');
  });

  it('continues loop when tool fails, lets LLM recover', async () => {
    const provider: LLMProvider = {
      chat: vi.fn()
        .mockResolvedValueOnce({ type: 'tool_call', toolCalls: [{ id: 't1', name: 'bad_tool', args: {} }] } as LLMResponse)
        .mockResolvedValueOnce({ type: 'text', content: 'I could not complete that.' } as LLMResponse),
      stream: vi.fn(),
    };
    const tools = makeTools({}); // bad_tool not in results, will throw
    const loop = new AgentLoop({ agentName: 'bot', systemPrompt: '', provider, memory: makeMemory(), tools, maxIterations: 5 });
    const result = await loop.run('Do something', ctx);
    // Loop should NOT break — LLM gets the error and returns a text response
    expect(result.output).toBe('I could not complete that.');
  });

  it('executes multiple parallel tool calls', async () => {
    const provider: LLMProvider = {
      chat: vi.fn()
        .mockResolvedValueOnce({
          type: 'tool_call',
          toolCalls: [
            { id: 't1', name: 'tool_a', args: {} },
            { id: 't2', name: 'tool_b', args: {} },
          ],
        } as LLMResponse)
        .mockResolvedValueOnce({ type: 'text', content: 'Done.' } as LLMResponse),
      stream: vi.fn(),
    };
    const tools = makeTools({ tool_a: 'result_a', tool_b: 'result_b' });
    const loop = new AgentLoop({ agentName: 'bot', systemPrompt: '', provider, memory: makeMemory(), tools, maxIterations: 5 });
    const result = await loop.run('Run both', ctx);
    expect(result.toolCalls).toHaveLength(2);
    expect(result.output).toBe('Done.');
  });

  it('throws after exceeding maxIterations', async () => {
    const provider: LLMProvider = {
      chat: vi.fn().mockResolvedValue({ type: 'tool_call', toolCalls: [{ id: 't1', name: 'loop_tool', args: {} }] } as LLMResponse),
      stream: vi.fn(),
    };
    const tools = makeTools({ loop_tool: 'ok' });
    const loop = new AgentLoop({ agentName: 'bot', systemPrompt: '', provider, memory: makeMemory(), tools, maxIterations: 3 });
    await expect(loop.run('infinite', ctx)).rejects.toThrow('exceeded max iterations (3)');
  });
});

describe('AgentLoop.stream()', () => {
  it('emits text and usage events for a plain response', async () => {
    const provider: LLMProvider = {
      chat: vi.fn().mockResolvedValue({ type: 'text', content: 'Hello!' } as LLMResponse),
      stream: vi.fn(),
    };
    const loop = new AgentLoop({ agentName: 'bot', systemPrompt: '', provider, memory: makeMemory(), tools: makeTools(), maxIterations: 5 });
    const events = await collectStream(loop.stream('Hi', ctx));

    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({ type: 'text', text: 'Hello!' });
    expect(events[1]).toEqual({ type: 'usage', iterations: 1, toolCallCount: 0 });
  });

  it('emits tool_start and tool_end around tool execution', async () => {
    const provider: LLMProvider = {
      chat: vi.fn()
        .mockResolvedValueOnce({ type: 'tool_call', toolCalls: [{ id: 'tc1', name: 'get_time', args: { tz: 'UTC' } }] } as LLMResponse)
        .mockResolvedValueOnce({ type: 'text', content: 'The time is now.' } as LLMResponse),
      stream: vi.fn(),
    };
    const tools = makeTools({ get_time: '2024-01-01T00:00:00Z' });
    const loop = new AgentLoop({ agentName: 'bot', systemPrompt: '', provider, memory: makeMemory(), tools, maxIterations: 5 });
    const events = await collectStream(loop.stream('What time?', ctx));

    expect(events[0]).toEqual({ type: 'tool_start', name: 'get_time', callId: 'tc1', args: { tz: 'UTC' } });
    expect(events[1]).toEqual({ type: 'tool_end', name: 'get_time', callId: 'tc1', result: '2024-01-01T00:00:00Z' });
    expect(events[2]).toEqual({ type: 'text', text: 'The time is now.' });
    expect(events[3]).toMatchObject({ type: 'usage', iterations: 2, toolCallCount: 1 });
  });

  it('emits tool_end with error field when tool fails', async () => {
    const provider: LLMProvider = {
      chat: vi.fn()
        .mockResolvedValueOnce({ type: 'tool_call', toolCalls: [{ id: 'tc2', name: 'bad_tool', args: {} }] } as LLMResponse)
        .mockResolvedValueOnce({ type: 'text', content: 'Could not complete.' } as LLMResponse),
      stream: vi.fn(),
    };
    const loop = new AgentLoop({ agentName: 'bot', systemPrompt: '', provider, memory: makeMemory(), tools: makeTools(), maxIterations: 5 });
    const events = await collectStream(loop.stream('Do it', ctx));

    const toolEnd = events.find((e) => e.type === 'tool_end');
    expect(toolEnd).toBeDefined();
    expect((toolEnd as Extract<StreamEvent, { type: 'tool_end' }>).error).toBe('tool bad_tool failed');
  });

  it('emits tool_start for multiple parallel tool calls', async () => {
    const provider: LLMProvider = {
      chat: vi.fn()
        .mockResolvedValueOnce({
          type: 'tool_call',
          toolCalls: [
            { id: 'ta', name: 'tool_a', args: {} },
            { id: 'tb', name: 'tool_b', args: {} },
          ],
        } as LLMResponse)
        .mockResolvedValueOnce({ type: 'text', content: 'Both done.' } as LLMResponse),
      stream: vi.fn(),
    };
    const tools = makeTools({ tool_a: 'a', tool_b: 'b' });
    const loop = new AgentLoop({ agentName: 'bot', systemPrompt: '', provider, memory: makeMemory(), tools, maxIterations: 5 });
    const events = await collectStream(loop.stream('Run both', ctx));

    const starts = events.filter((e) => e.type === 'tool_start');
    const ends = events.filter((e) => e.type === 'tool_end');
    expect(starts).toHaveLength(2);
    expect(ends).toHaveLength(2);
    expect((events.at(-1) as Extract<StreamEvent, { type: 'usage' }>).toolCallCount).toBe(2);
  });
});
