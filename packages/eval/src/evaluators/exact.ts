import type { Evaluator } from '../types.js';

export function exactMatch(expected: string, options: { caseInsensitive?: boolean } = {}): Evaluator {
  return (output) => {
    const a = options.caseInsensitive ? output.trim().toLowerCase() : output.trim();
    const b = options.caseInsensitive ? expected.toLowerCase() : expected;
    return a === b;
  };
}
