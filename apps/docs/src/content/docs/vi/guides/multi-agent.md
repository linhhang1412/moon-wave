---
title: Hệ thống Multi-Agent
description: Xây dựng mạng lưới agent và handoff patterns
---

moon-wave hỗ trợ hai pattern multi-agent: dùng agent như một tool trong agent khác, và supervisor network nơi coordinator phân công nhiệm vụ.

## Agent as Tool

Wrap agent để agent khác có thể gọi như một tool:

```typescript
import { Agent } from '@moon-wave/core';
import { agentAsTool } from '@moon-wave/multi-agent';

const researchAgent = new Agent({
  name: 'researcher',
  model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  systemPrompt: 'Bạn là chuyên gia nghiên cứu. Tìm kiếm thông tin thực tế.',
});

const writerAgent = new Agent({
  name: 'writer',
  model: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  systemPrompt: 'Bạn là nhà văn. Dùng tool researcher để thu thập dữ liệu, rồi viết nội dung.',
});

writerAgent.use(agentAsTool(researchAgent));

const result = await writerAgent.run(
  'Viết bài ngắn về kính thiên văn James Webb.',
  { sessionId: 'session-1', env }
);
```

## AgentNetwork (Supervisor)

Supervisor phân công nhiệm vụ cho các specialist agent:

```typescript
import { AgentNetwork } from '@moon-wave/multi-agent';

const network = new AgentNetwork({
  supervisor: supervisorAgent,
  agents: [researchAgent, writerAgent, codeAgent],
});

const result = await network.run(
  'Nghiên cứu về điện toán lượng tử và tóm tắt trong các comment Python.',
  { sessionId: 'session-1', env }
);
```

Supervisor quyết định agent nào xử lý từng subtask và tổng hợp kết quả cuối.
