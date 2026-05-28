# @moon-wave/eval

Testing framework for moon-wave agents — define test cases, run them, and get pass/fail reports.

## Installation

```bash
npm install @moon-wave/eval @moon-wave/core
```

## Quick Start

```typescript
import { EvalSuite } from '@moon-wave/eval';

const suite = new EvalSuite(agent, [
  {
    name: 'answers basic math',
    input: 'What is 2 + 2?',
    evaluator: (output) => output.includes('4'),
  },
  {
    name: 'uses get_time tool',
    input: 'What time is it right now?',
    evaluator: (output) => /\d{4}-\d{2}-\d{2}/.test(output),
  },
  {
    name: 'returns structured verdict',
    input: 'Explain recursion in one sentence.',
    evaluator: async (output) => ({
      passed: output.length > 20 && output.length < 300,
      reason: `Response length: ${output.length} chars`,
    }),
  },
]);

const report = await suite.run({ sessionId: 'eval', env });
// Prints table to console and returns EvalReport
```

**Example output:**
```
┌─────────────────────────────┬────────┬──────────┐
│ Test                        │ Result │ Duration │
├─────────────────────────────┼────────┼──────────┤
│ answers basic math          │ ✓ PASS │   312ms  │
│ uses get_time tool          │ ✓ PASS │   489ms  │
│ returns structured verdict  │ ✓ PASS │   201ms  │
└─────────────────────────────┴────────┴──────────┘
Passed: 3/3 (100%) in 1002ms
```

## API

### `EvalSuite`

```typescript
class EvalSuite {
  constructor(agent: Agent, cases: EvalCase[])

  run(
    agentCtx: AgentContext,
    options?: { print?: boolean; concurrency?: number }
  ): Promise<EvalReport>
}
```

**Options:**
- `print` — print report to console (default: `true`)
- `concurrency` — number of parallel cases (default: `1`, set higher for faster runs with rate-limit-safe providers)

### `EvalCase`

```typescript
interface EvalCase {
  name: string;
  input: string;
  evaluator: Evaluator;
  sessionId?: string;  // fixed session ID for reproducibility
}

type Evaluator = (
  output: string,
  ctx: EvalRunContext
) => boolean | Promise<boolean | EvalVerdict>;

interface EvalVerdict {
  passed: boolean;
  reason?: string;  // shown in the report
}
```

### `EvalReport`

```typescript
interface EvalReport {
  passed: number;
  failed: number;
  total: number;
  passRate: number;       // 0–1
  totalMs: number;
  cases: EvalResult[];
}
```

## LLM-based Evaluation

Use another agent as the evaluator:

```typescript
import { Agent } from '@moon-wave/core';

const judge = new Agent({
  name: 'judge',
  model: { provider: 'openai', model: 'gpt-4o' },
  systemPrompt: 'You evaluate AI responses. Reply only with JSON: {"passed": true/false, "reason": "..."}',
  memory: 'none',
});

const suite = new EvalSuite(agent, [
  {
    name: 'helpful and accurate',
    input: 'What is the capital of France?',
    evaluator: async (output, { agentCtx }) => {
      const result = await judge.run(`Question: "What is the capital of France?"\nAnswer: "${output}"`, agentCtx);
      return JSON.parse(result.output) as EvalVerdict;
    },
  },
]);
```

## License

MIT
