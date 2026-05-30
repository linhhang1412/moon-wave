import { useState, useCallback } from 'react';
import type { AgentData } from '../../shared/types';

declare const BASE: string;

export function useAgents() {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(BASE + '/api/agents');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAgents(await res.json() as AgentData[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  return { agents, loading, error, load };
}
