import type { Evaluator } from '../types.js';

export function contains(keywords: string[], options: { all?: boolean; caseInsensitive?: boolean } = {}): Evaluator {
  const { all = true, caseInsensitive = true } = options;
  return (output) => {
    const text = caseInsensitive ? output.toLowerCase() : output;
    const check = (kw: string) => text.includes(caseInsensitive ? kw.toLowerCase() : kw);
    return all ? keywords.every(check) : keywords.some(check);
  };
}
