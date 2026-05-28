---
title: Kiểm thử & Đánh giá
description: Kiểm thử agent với EvalSuite — chấm điểm pass/fail tự động với các evaluator tích hợp và tùy chỉnh
---

`@moon-wave/eval` cung cấp framework đơn giản để chạy test tự động cho agent. Viết test cases với output mong đợi, chọn evaluator, và chạy toàn bộ suite trong CI hoặc local.

## Cài đặt

```bash
pnpm add @moon-wave/eval
```

## Sử dụng cơ bản

```typescript
import { EvalSuite, exactMatch, contains } from '@moon-wave/eval';
import { myAgent } from './agents';

const suite = new EvalSuite(myAgent, [
  {
    name: 'chào hỏi người dùng',
    input: 'Hãy nói xin chào',
    evaluator: contains(['xin chào', 'chào'], { matchAll: false }),
  },
  {
    name: 'trả lời đúng',
    input: '2 + 2 bằng bao nhiêu?',
    evaluator: exactMatch('4'),
  },
]);

const report = await suite.run({ sessionId: 'eval', env: {} });
// In bảng kết quả ra console và trả về EvalReport
```

## Các evaluator

### `exactMatch(expected, options?)`

Pass khi output của agent khớp chính xác với `expected`.

```typescript
exactMatch('có')                           // phân biệt chữ hoa/thường
exactMatch('Có', { ignoreCase: true })     // không phân biệt
```

### `contains(keywords[], options?)`

Pass khi output chứa các từ khóa chỉ định.

```typescript
contains(['lỗi', 'thất bại'])             // phải chứa TẤT CẢ từ khóa
contains(['có', 'đúng', 'ok'], { matchAll: false })  // chứa BẤT KỲ từ khóa nào
```

### `llmJudge(options)`

Dùng agent khác (hoặc judge mặc định qua Groq) để chấm điểm response dựa trên tiêu chí ngôn ngữ tự nhiên.

```typescript
import { llmJudge } from '@moon-wave/eval';

{
  name: 'giải thích rõ ràng',
  input: 'Giải thích async/await trong JavaScript',
  evaluator: llmJudge({
    criteria: 'Response phải giải thích rõ async/await kèm ví dụ code',
  }),
}
```

### Evaluator tùy chỉnh

Evaluator chỉ là một hàm `(output, ctx) => boolean | EvalVerdict`:

```typescript
import type { Evaluator } from '@moon-wave/eval';

const isValidJson: Evaluator = (output) => {
  try {
    JSON.parse(output);
    return { passed: true, reason: 'JSON hợp lệ' };
  } catch {
    return { passed: false, reason: 'Output không phải JSON hợp lệ' };
  }
};
```

## Tùy chọn chạy

```typescript
const report = await suite.run(agentCtx, {
  print: true,        // in bảng ra console (mặc định: true)
  concurrency: 4,     // chạy N test case song song (mặc định: 1)
});
```

## Đối tượng report

```typescript
interface EvalReport {
  passed:   number;
  failed:   number;
  total:    number;
  passRate: number;    // 0–1
  totalMs:  number;
  cases: EvalResult[];
}
```

## Chạy trong CI

```typescript
// eval.ts
const report = await suite.run({ sessionId: 'ci', env: {} }, { print: true });
if (report.passRate < 1) process.exit(1);
```

```yaml
# .github/workflows/ci.yml
- run: pnpm eval
```

## Lưu kết quả

```typescript
const report = await suite.run(ctx, { print: false });
await fs.writeFile('eval-results.json', JSON.stringify(report, null, 2));
```
