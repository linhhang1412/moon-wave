import type { EvalReport, EvalResult } from './types.js';

const PASS = '\x1b[32m✓\x1b[0m';
const FAIL = '\x1b[31m✗\x1b[0m';
const BOLD = (s: string) => `\x1b[1m${s}\x1b[0m`;
const DIM = (s: string) => `\x1b[2m${s}\x1b[0m`;

export function printReport(report: EvalReport): void {
  console.log('');
  console.log(BOLD('Eval Results'));
  console.log('─'.repeat(50));

  for (const r of report.cases) {
    printCase(r);
  }

  console.log('─'.repeat(50));
  const rate = Math.round(report.passRate * 100);
  const summary = `${report.passed}/${report.total} passed (${rate}%) ${DIM(`in ${report.totalMs}ms`)}`;
  console.log(report.failed === 0 ? `${PASS} ${BOLD(summary)}` : `${FAIL} ${BOLD(summary)}`);
  console.log('');
}

function printCase(r: EvalResult): void {
  const icon = r.passed ? PASS : FAIL;
  const duration = DIM(`${r.durationMs}ms`);
  console.log(`  ${icon} ${r.name} ${duration}`);
  if (!r.passed && r.reason) {
    console.log(`     ${DIM(r.reason)}`);
  }
}
