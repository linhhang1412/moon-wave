import { describe, it, expect, vi } from 'vitest';
import { WorkflowEngine } from '../WorkflowEngine';
import { Graph } from '../Graph';
import type { AgentContext } from '@moon-wave/types';

const ctx: AgentContext = { sessionId: 'wf-1', env: {} };

describe('WorkflowEngine', () => {
  it('runs a single step and returns its output', async () => {
    const graph = new Graph();
    const execute = vi.fn().mockResolvedValue('done');
    graph.step({ name: 'start', execute, next: () => null });
    const engine = new WorkflowEngine(graph);
    const result = await engine.run('input', ctx);
    expect(result.output).toBe('done');
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].name).toBe('start');
  });

  it('chains multiple steps', async () => {
    const graph = new Graph();
    graph.step({ name: 'step1', execute: vi.fn().mockResolvedValue(42), next: () => 'step2' });
    graph.step({ name: 'step2', execute: vi.fn().mockResolvedValue('final'), next: () => null });
    const engine = new WorkflowEngine(graph);
    const result = await engine.run('input', ctx);
    expect(result.steps).toHaveLength(2);
    expect(result.output).toBe('final');
  });

  it('throws when maxSteps is exceeded', async () => {
    const graph = new Graph();
    graph.step({ name: 'step1', execute: vi.fn().mockResolvedValue('loop'), next: () => 'step1' });
    const engine = new WorkflowEngine(graph, 3);
    await expect(engine.run('input', ctx)).rejects.toThrow('Workflow exceeded max steps (3)');
  });

  it('throws for unknown step name returned by next()', async () => {
    const graph = new Graph();
    graph.step({ name: 'start', execute: vi.fn().mockResolvedValue('ok'), next: () => 'missing' });
    const engine = new WorkflowEngine(graph);
    await expect(engine.run('input', ctx)).rejects.toThrow('Step "missing" not found');
  });

  it('records duration for each step', async () => {
    const graph = new Graph();
    graph.step({ name: 'start', execute: vi.fn().mockResolvedValue('x'), next: () => null });
    const engine = new WorkflowEngine(graph);
    const result = await engine.run('input', ctx);
    expect(result.steps[0].durationMs).toBeGreaterThanOrEqual(0);
    expect(result.totalDurationMs).toBeGreaterThanOrEqual(0);
  });
});
