---
title: Dùng Tools
description: Cho agent khả năng gọi hàm và thực hiện hành động
---

Tools cho phép agent thực hiện hành động — tìm kiếm web, gọi API, đọc file, và nhiều hơn.

## Định nghĩa tool

```typescript
import { tool } from '@moon-wave/core';

const getCurrentTime = tool({
  schema: {
    name: 'get_current_time',
    description: 'Trả về thời gian UTC hiện tại',
    parameters: {
      type: 'object',
      properties: {
        timezone: {
          type: 'string',
          description: 'IANA timezone, ví dụ "Asia/Ho_Chi_Minh"',
        },
      },
      required: [],
    },
  },
  execute: async (args) => {
    const tz = (args.timezone as string) ?? 'Asia/Ho_Chi_Minh';
    return new Date().toLocaleString('vi-VN', { timeZone: tz });
  },
});
```

## Đăng ký tools vào agent

```typescript
const agent = new Agent({
  name: 'my-agent',
  model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  systemPrompt: 'Bạn là trợ lý hữu ích.',
});

agent.use(getCurrentTime);

// Hoặc chain nhiều tools
agent.use(getCurrentTime, searchWeb, readFile);
```

## Cách hoạt động

1. Agent gửi tool schemas lên LLM kèm mỗi message
2. LLM quyết định gọi tool hay trả lời trực tiếp
3. Nếu gọi tool, `execute()` chạy và kết quả gửi lại LLM
4. Vòng lặp tiếp tục cho đến khi LLM trả về text

Agent loop tuân theo `maxIterations` (mặc định: 10) để tránh vòng lặp vô hạn.

## Truy cập Cloudflare bindings trong tools

`ctx` (AgentContext) được truyền vào tham số thứ hai của `execute`:

```typescript
execute: async (args, ctx) => {
  // Truy cập KV, D1, R2, v.v.
  const value = await ctx.env.MY_KV.get('some-key');
  return value;
}
```
