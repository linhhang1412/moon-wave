import { useState, useCallback, useRef } from 'react';
import type { AgentData, Message } from '../../shared/types';

// BASE is injected by the server before the bundle script
declare const BASE: string;

export function usePlayground() {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [agentName, setAgentName] = useState('');
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => {
    const saved = localStorage.getItem('mw_session_id');
    if (saved) return saved;
    const id = crypto.randomUUID();
    localStorage.setItem('mw_session_id', id);
    return id;
  });
  const lastInputRef = useRef('');

  const loadAgents = useCallback(async () => {
    try {
      const res = await fetch(BASE + '/api/agents');
      if (!res.ok) return;
      const data = (await res.json()) as AgentData[];
      setAgents(data);
      if (data.length > 0) setAgentName(data[0].name);
    } catch { /* ignore */ }
  }, []);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || !agentName || loading) return;
    lastInputRef.current = text;
    setInput('');
    setLoading(true);

    setMsgs(prev => [...prev, { role: 'user', body: text, ts: Date.now() }]);

    try {
      const res = await fetch(BASE + '/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentName, input: text, sessionId }),
      });
      const data = await res.json() as { output?: string; error?: string; toolCalls?: Array<{ name: string; args: Record<string, unknown>; result: unknown }> };

      if (data.error) {
        setMsgs(prev => [...prev, { role: 'assistant', body: 'Error: ' + data.error, ts: Date.now(), error: true }]);
      } else {
        const toolMsgs: Message[] = (data.toolCalls ?? []).map(tc => ({
          role: 'tool' as const,
          body: JSON.stringify(tc.result, null, 2),
          toolName: tc.name,
          toolArgs: tc.args,
          toolResult: tc.result,
          ts: Date.now(),
        }));
        setMsgs(prev => [...prev, ...toolMsgs, { role: 'assistant', body: data.output ?? '', ts: Date.now() }]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setMsgs(prev => [...prev, { role: 'assistant', body: 'Network error: ' + msg, ts: Date.now(), error: true }]);
    } finally {
      setLoading(false);
    }
  }, [agentName, loading, sessionId]);

  const reset = useCallback(() => {
    setMsgs([]);
    localStorage.removeItem('mw_session_id');
  }, []);

  return { agents, agentName, setAgentName, msgs, input, setInput, loading, send, reset, loadAgents, lastInput: lastInputRef };
}
