---
title: Testing & Evaluation
description: Test your agents with EvalSuite — automated pass/fail scoring with built-in and custom evaluators
---

`@moon-wave/eval` provides a simple framework for running automated tests against your agents. Write test cases with expected outputs, choose an evaluator, and run a full suite in CI or locally.

## Installation

```bash
pnpm add @moon-wave/eval
```

## Basic usage

```typescript
import { EvalSuite, exactMatch, contains } from '@moon-wave/eval';
import { myAgent } from './agents';

const suite = new EvalSuite(myAgent, [
  {
    name: 'greets user',
    input: 'Say hello',
    evaluator: contains(['hello', 'hi'], { matchAll: false }),
  },
  {
    name: 'returns correct answer',
    input: 'What is 2 + 2?',
    evaluator: exactMatch('4'),
  },
]);

const report = await suite.run({ sessionId: 'eval', env: {} });
// Prints a formatted table to console and returns EvalReport
```

## Evaluators

### `exactMatch(expected, options?)`

Passes when the agent output exactly equals `expected`.

```typescript
exactMatch('yes')                          // case-sensitive
exactMatch('Yes', { ignoreCase: true })    // case-insensitive
```

### `contains(keywords[], options?)`

Passes when the agent output contains the specified keywords.

```typescript
contains(['error', 'failed'])             // must contain ALL keywords
contains(['yes', 'sure', 'ok'], { matchAll: false })  // must contain ANY keyword
```

### `llmJudge(options)`

Uses another agent (or a default Groq judge) to score the response against a natural-language criterion.

```typescript
import { llmJudge } from '@moon-wave/eval';

{
  name: 'explains clearly',
  input: 'Explain async/await in JavaScript',
  evaluator: llmJudge({
    criteria: 'The response should explain async/await clearly with a code example',
    // judgeAgent: myJudgeAgent,  // optional: use a custom agent as judge
  }),
}
```

### Custom evaluators

An evaluator is just a function `(output, ctx) => boolean | EvalVerdict`:

```typescript
import type { Evaluator } from '@moon-wave/eval';

const isValidJson: Evaluator = (output) => {
  try {
    JSON.parse(output);
    return { passed: true, reason: 'Valid JSON' };
  } catch {
    return { passed: false, reason: 'Output is not valid JSON' };
  }
};

{ name: 'returns json', input: 'List 3 colors as JSON', evaluator: isValidJson }
```

## Run options

```typescript
const report = await suite.run(agentCtx, {
  print: true,        // print table to console (default: true)
  concurrency: 4,     // run N cases in parallel (default: 1)
});
```

## The report object

```typescript
interface EvalReport {
  passed:   number;
  failed:   number;
  total:    number;
  passRate: number;    // 0–1
  totalMs:  number;
  cases: EvalResult[];
}

interface EvalResult {
  name:       string;
  input:      string;
  output:     string;   // actual agent output
  passed:     boolean;
  reason?:    string;   // explanation from evaluator
  durationMs: number;
}
```

## Running in CI

```typescript
// eval.ts
import { EvalSuite, contains } from '@moon-wave/eval';
import { myAgent } from './agents';

const suite = new EvalSuite(myAgent, [...]);
const report = await suite.run({ sessionId: 'ci', env: {} }, { print: true });

if (report.passRate < 1) process.exit(1);
```

```bash
# package.json
"eval": "tsx eval.ts"
```

Add to your CI pipeline:

```yaml
- run: pnpm eval
```

## Saving results

`EvalSuite` returns the full report in memory. To persist results, serialize to JSON:

```typescript
const report = await suite.run(ctx, { print: false });
await fs.writeFile('eval-results.json', JSON.stringify(report, null, 2));
```
