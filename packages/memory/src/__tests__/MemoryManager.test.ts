import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryManager } from '../MemoryManager';
import type { Message } from '@moon-wave/types';

function makeKVAdapter(initial: Message[] = []) {
  const store: Message[] = [...initial];
  return {
    getMessages: vi.fn().mockImplementation(async () => [...store]),
    addMessage: vi.fn().mockImplementation(async (_id: string, msg: Message) => { store.push(msg); }),
    clearSession: vi.fn().mockImplementation(async () => { store.length = 0; }),
  };
}

describe('MemoryManager', () => {
  it('returns empty array when no adapters configured', async () => {
    const mm = new MemoryManager({});
    expect(await mm.getMessages('s1')).toEqual([]);
  });

  it('reads from shortTerm adapter', async () => {
    const msgs: Message[] = [{ role: 'user', content: 'hi' }];
    const kv = makeKVAdapter(msgs);
    const mm = new MemoryManager({ shortTerm: kv as never });
    expect(await mm.getMessages('s1')).toEqual(msgs);
  });

  it('prefers longTerm over shortTerm', async () => {
    const d1Msgs: Message[] = [{ role: 'user', content: 'from d1' }];
    const kvMsgs: Message[] = [{ role: 'user', content: 'from kv' }];
    const d1 = { getMessages: vi.fn().mockResolvedValue(d1Msgs), addMessage: vi.fn(), clearSession: vi.fn() };
    const kv = makeKVAdapter(kvMsgs);
    const mm = new MemoryManager({ shortTerm: kv as never, longTerm: d1 as never });
    const result = await mm.getMessages('s1');
    expect(result).toEqual(d1Msgs);
    expect(kv.getMessages).not.toHaveBeenCalled();
  });

  it('writes to both adapters on addMessage', async () => {
    const kv = makeKVAdapter();
    const d1 = { getMessages: vi.fn().mockResolvedValue([]), addMessage: vi.fn(), clearSession: vi.fn() };
    const mm = new MemoryManager({ shortTerm: kv as never, longTerm: d1 as never });
    await mm.addMessage('s1', { role: 'user', content: 'test' });
    expect(kv.addMessage).toHaveBeenCalled();
    expect(d1.addMessage).toHaveBeenCalled();
  });

  it('clears both adapters on clearSession', async () => {
    const kv = makeKVAdapter();
    const d1 = { getMessages: vi.fn().mockResolvedValue([]), addMessage: vi.fn(), clearSession: vi.fn() };
    const mm = new MemoryManager({ shortTerm: kv as never, longTerm: d1 as never });
    await mm.clearSession('s1');
    expect(kv.clearSession).toHaveBeenCalledWith('s1');
    expect(d1.clearSession).toHaveBeenCalledWith('s1');
  });

  it('passes maxMessages to longTerm adapter', async () => {
    const d1 = { getMessages: vi.fn().mockResolvedValue([]), addMessage: vi.fn(), clearSession: vi.fn() };
    const mm = new MemoryManager({ longTerm: d1 as never, maxMessages: 25 });
    await mm.getMessages('s1');
    expect(d1.getMessages).toHaveBeenCalledWith('s1', 25);
  });
});
