export type Lang = 'en' | 'vi';

const dict: Record<Lang, Record<string, string>> = {
  en: {
    // groups
    'group.Develop': 'Develop', 'group.Observe': 'Observe', 'group.Build': 'Build',
    'group.Operate': 'Operate', 'group.Configure': 'Configure',
    // nav labels
    'nav.mount': 'Mount', 'nav.playground': 'Playground', 'nav.apiref': 'API Reference',
    'nav.overview': 'Overview', 'nav.logs': 'Logs', 'nav.sessions': 'Sessions', 'nav.errors': 'Errors',
    'nav.agents': 'Agents', 'nav.tools': 'Tools', 'nav.mcp': 'MCP servers', 'nav.memory': 'Memory',
    'nav.workflows': 'Workflows', 'nav.networks': 'Networks', 'nav.channels': 'Channels',
    'nav.rollouts': 'Rollouts', 'nav.evals': 'Evals', 'nav.cost': 'Cost', 'nav.alerts': 'Alerts',
    'nav.health': 'Health', 'nav.audit': 'Audit log', 'nav.routes': 'Routes & bindings', 'nav.env': 'Environment',
    // descriptions
    'desc.mount': 'attach /dashboard to your worker', 'desc.overview': 'live · last 60 min',
    'desc.playground': 'chat with an agent · streaming', 'desc.logs': 'timeline grouped by request',
    'desc.sessions': 'active sessions', 'desc.errors': 'grouped by signature',
    'desc.agents': 'registered agents', 'desc.tools': 'tool registry · create & attach',
    'desc.mcp': 'connect external MCP tools', 'desc.memory': 'KV · D1 · Vectorize · R2',
    'desc.workflows': 'graph-based', 'desc.networks': 'multi-agent routing',
    'desc.channels': 'adapters', 'desc.rollouts': 'prompt diff · A/B traffic split',
    'desc.evals': 'dataset runs · provider A/B', 'desc.cost': 'attribution & budgets',
    'desc.alerts': 'rules → webhook', 'desc.health': 'memory leak & anomaly detector',
    'desc.audit': 'every mutating action', 'desc.routes': 'resolved from src/index.ts',
    'desc.env': 'read-only', 'desc.apiref': '8 endpoints',
    // topbar
    'tb.worker': 'worker', 'tb.dashboard': 'dashboard', 'tb.readonly': 'read-only',
    'tb.readwrite': 'read-write', 'tb.dark': 'dark', 'tb.light': 'light',
    'tb.toggleTheme': 'Toggle theme',
    // statusbar
    'sb.connected': 'connected', 'sb.region': 'region', 'sb.command': 'command',
    'sb.shortcuts': 'shortcuts',
    // command palette
    'cmd.placeholder': 'type a command, search a section, paste a session id…',
    'cmd.jump': 'jump', 'cmd.open': 'open', 'cmd.nomatch': 'no matches', 'cmd.section': 'section',
    // tweaks
    'tw.brand': 'Brand', 'tw.accent': 'Accent', 'tw.fontpair': 'Font pair', 'tw.layout': 'Layout',
    'tw.chrome': 'Chrome', 'tw.density': 'Density', 'tw.dark': 'Dark mode', 'tw.redact': 'Redact PII',
    'tw.jump': 'Jump to', 'tw.language': 'Language',
    // common actions
    'c.copy': 'copy', 'c.copied': 'copied', 'c.cancel': 'cancel', 'c.create': 'create',
    'c.new': 'new', 'c.refresh': 'refresh', 'c.export': 'export', 'c.reset': 'reset',
    'c.open': 'open →', 'c.add': 'add', 'c.connect': 'connect', 'c.disconnect': 'disconnect',
    'c.enable': 'enable', 'c.disable': 'disable', 'c.ping': 'ping', 'c.view': 'view',
    'c.edit': 'edit', 'c.replay': 'replay', 'c.openPlayground': 'open in playground',
    'c.running': '… running', 'c.newRule': 'new rule', 'c.newChannel': 'new channel',
    // status pills
    'p.runtime': 'runtime', 'p.readonly': 'read-only', 'p.healthy': 'healthy', 'p.draft': 'draft',
    'p.live': 'live', 'p.canary': 'canary', 'p.archived': 'archived', 'p.production': 'production',
    'p.connected': 'connected', 'p.available': 'available', 'p.offline': 'offline',
    'p.enabled': 'enabled', 'p.disabled': 'disabled',
    // column headers
    'th.name': 'name', 'th.model': 'model', 'th.provider': 'provider', 'th.calls': 'calls',
    'th.errors': 'errors', 'th.status': 'status', 'th.method': 'method', 'th.path': 'path',
    'th.handler': 'handler', 'th.middleware': 'middleware', 'th.key': 'key', 'th.size': 'size',
    'th.type': 'type', 'th.updated': 'updated', 'th.ttl': 'ttl', 'th.total': 'total',
    'th.user': 'user', 'th.cost': 'cost', 'th.tokens': 'tokens', 'th.sessions': 'sessions',
    'th.time': 'time', 'th.actor': 'actor', 'th.action': 'action', 'th.target': 'target',
    'th.session': 'session', 'th.agent': 'agent', 'th.from': 'from', 'th.to': 'to',
    'th.id': 'id', 'th.title': 'title', 'th.input': 'input', 'th.score': 'score',
    // MOUNT
    'mnt.eyebrow': 'onboarding · ~3 min', 'mnt.titlePre': 'Mount', 'mnt.titlePost': 'into your Worker',
    'mnt.lead': 'The dashboard ships as a request handler. Mount it at any path on your existing Worker — no extra service, no extra deploy.',
    'mnt.yourWorker': 'your worker', 'mnt.s1t': 'Install', 'mnt.s1d': 'Add the package',
    'mnt.s2t': 'Mount', 'mnt.s2d': 'Attach the handler', 'mnt.s3t': 'Bindings',
    'mnt.s3d': 'KV / D1 / Vectorize', 'mnt.s4t': 'Verify', 'mnt.s4d': 'Hit /dashboard',
    'mnt.install': 'install', 'mnt.requirements': 'requirements', 'mnt.required': 'required',
    'mnt.optional': 'optional', 'mnt.any': 'any', 'mnt.mountHint': '· mount handler at any path',
    'mnt.footWorksA': 'works with Hono, itty-router, or a bare', 'mnt.footWorksB': 'handler.',
    'mnt.see': 'see', 'mnt.guides': 'integration guides →', 'mnt.local': '· local',
    'mnt.forProd': 'for prod:', 'mnt.verify': 'verify', 'mnt.whatYouGet': 'what you get',
    'mnt.tracing': 'Tracing', 'mnt.wyd_playground': 'chat with any agent · streaming',
    'mnt.wyd_logs': 'timeline grouped by request', 'mnt.wyd_sessions': 'list, detail, kill / restart',
    'mnt.wyd_memory': 'KV · D1 · Vectorize browser', 'mnt.wyd_routes': 'live route + binding table',
    'mnt.wyd_tracing': 'OTel-compatible spans', 'mnt.back': '← back', 'mnt.next': 'next:',
    'mnt.openPg': 'open playground →',
    // OVERVIEW
    'ov.reqMin': 'requests / min', 'ov.latency': 'latency', 'ov.errRate': 'error rate',
    'ov.activeSess': 'active sessions', 'ov.tokens24h': 'tokens (24h)', 'ov.byProvider': 'by provider',
    'ov.costToday': 'cost (today)', 'ov.est': 'est.', 'ov.projMonth': 'projected month',
    'ov.topology': 'topology', 'ov.agents': 'agents', 'ov.last24h': '· last 24h',
    'ov.vs5m': 'vs 5m', 'ov.now': 'now',
    // PLAYGROUND
    'pg.sendTo': 'send to', 'pg.send': 'send', 'pg.newline': 'newline',
    'pg.placeholder': 'ask anything…', 'pg.reset': 'reset', 'pg.agent': 'agent',
    'pg.providerModel': 'provider / model', 'pg.parameters': 'parameters',
    'pg.temperature': 'temperature', 'pg.stream': 'stream', 'pg.session': 'session',
    'pg.newSession': '— new session —', 'pg.messages': 'messages', 'pg.tokensUsed': 'tokens used',
    'pg.cost': 'cost', 'pg.toolsAvailable': 'tools available', 'pg.streaming': 'streaming…',
    'pg.toolCall': '· tool call', 'pg.arguments': 'arguments', 'pg.result': 'result',
    // AGENTS
    'ag.filter': 'filter agents…', 'ag.tools': 'tools', 'ag.calls24h': 'calls/24h',
    'ag.provider': 'provider', 'ag.model': 'model', 'ag.systemPrompt': 'system prompt',
    'ag.enabled': 'enabled', 'ag.registered': 'registered', 'ag.createTitle': 'Create agent',
    // LOGS
    'lg.filter': 'filter by path, method, agent…', 'lg.all': 'all', 'lg.info': 'info',
    'lg.warn': 'warn', 'lg.errors': 'errors', 'lg.live': 'live', 'lg.paused': 'paused',
    'lg.events': 'events', 'lg.elapsed': 'elapsed', 'lg.level': 'level', 'lg.source': 'source',
    'lg.waterfall': 'waterfall', 'lg.tailWaiting': 'tail · waiting for next request',
    // SESSIONS
    'ss.filter': 'filter sessions…', 'ss.compare': 'compare', 'ss.msgs': 'msgs',
    'ss.copyId': 'copy id', 'ss.restart': 'restart', 'ss.kill': 'kill', 'ss.user': 'user',
    'ss.channel': 'channel', 'ss.started': 'started', 'ss.lastActive': 'last active',
    'ss.messages': 'messages', 'ss.tokensIO': 'tokens (in / out)', 'ss.timeline': 'timeline',
    'ss.tabMessages': 'messages', 'ss.state': 'state', 'ss.tools': 'tools', 'ss.trace': 'trace',
    // ROUTES & ENV
    'rt.routes': 'routes', 'rt.bindings': 'bindings',
    'env.title': 'environment', 'env.secret': 'secret', 'env.var': 'var',
    'env.reveal': 'reveal', 'env.hide': 'hide',
    // API REF
    'api.endpoints': 'endpoints', 'api.request': 'request', 'api.responseStream': 'response (stream)',
    'api.typescript': 'typescript', 'api.curl': 'curl',
  },
  vi: {
    // groups
    'group.Develop': 'Phát triển', 'group.Observe': 'Quan sát', 'group.Build': 'Xây dựng',
    'group.Operate': 'Vận hành', 'group.Configure': 'Cấu hình',
    // nav
    'nav.mount': 'Cài đặt', 'nav.playground': 'Thử nghiệm', 'nav.apiref': 'Tài liệu API',
    'nav.overview': 'Tổng quan', 'nav.logs': 'Nhật ký', 'nav.sessions': 'Phiên', 'nav.errors': 'Lỗi',
    'nav.agents': 'Agents', 'nav.tools': 'Công cụ', 'nav.mcp': 'MCP servers', 'nav.memory': 'Bộ nhớ',
    'nav.workflows': 'Luồng', 'nav.networks': 'Mạng', 'nav.channels': 'Kênh',
    'nav.rollouts': 'Triển khai', 'nav.evals': 'Đánh giá', 'nav.cost': 'Chi phí',
    'nav.alerts': 'Cảnh báo', 'nav.health': 'Sức khỏe', 'nav.audit': 'Nhật ký kiểm toán',
    'nav.routes': 'Routes & bindings', 'nav.env': 'Môi trường',
    // descriptions
    'desc.mount': 'gắn /dashboard vào worker của bạn', 'desc.overview': 'trực tiếp · 60 phút qua',
    'desc.playground': 'chat với agent · streaming', 'desc.logs': 'timeline nhóm theo request',
    'desc.sessions': 'phiên đang hoạt động', 'desc.errors': 'nhóm theo signature',
    'desc.agents': 'agents đã đăng ký', 'desc.tools': 'registry công cụ · tạo & gắn',
    'desc.mcp': 'kết nối MCP tools từ bên ngoài', 'desc.memory': 'KV · D1 · Vectorize · R2',
    'desc.workflows': 'dạng đồ thị', 'desc.networks': 'định tuyến đa agent',
    'desc.channels': 'adapters', 'desc.rollouts': 'so sánh prompt · chia traffic A/B',
    'desc.evals': 'chạy dataset · so sánh providers', 'desc.cost': 'phân bổ & ngân sách',
    'desc.alerts': 'quy tắc → webhook', 'desc.health': 'phát hiện rò bộ nhớ & bất thường',
    'desc.audit': 'mọi hành động thay đổi', 'desc.routes': 'trích xuất từ src/index.ts',
    'desc.env': 'chỉ đọc', 'desc.apiref': '8 endpoints',
    // topbar
    'tb.worker': 'worker', 'tb.dashboard': 'dashboard', 'tb.readonly': 'chỉ-đọc',
    'tb.readwrite': 'đọc-ghi', 'tb.dark': 'tối', 'tb.light': 'sáng',
    'tb.toggleTheme': 'Đổi giao diện',
    // statusbar
    'sb.connected': 'đã kết nối', 'sb.region': 'khu vực', 'sb.command': 'lệnh', 'sb.shortcuts': 'phím tắt',
    // command palette
    'cmd.placeholder': 'nhập lệnh, tìm mục, dán session id…',
    'cmd.jump': 'nhảy', 'cmd.open': 'mở', 'cmd.nomatch': 'không tìm thấy', 'cmd.section': 'mục',
    // tweaks
    'tw.brand': 'Thương hiệu', 'tw.accent': 'Màu nhấn', 'tw.fontpair': 'Cặp phông', 'tw.layout': 'Bố cục',
    'tw.chrome': 'Chrome', 'tw.density': 'Mật độ', 'tw.dark': 'Chế độ tối', 'tw.redact': 'Ẩn PII',
    'tw.jump': 'Đi đến', 'tw.language': 'Ngôn ngữ',
    // common
    'c.copy': 'sao chép', 'c.copied': 'đã sao chép', 'c.cancel': 'hủy', 'c.create': 'tạo',
    'c.new': 'mới', 'c.refresh': 'làm mới', 'c.export': 'xuất', 'c.reset': 'đặt lại',
    'c.open': 'mở →', 'c.add': 'thêm', 'c.connect': 'kết nối', 'c.disconnect': 'ngắt kết nối',
    'c.enable': 'bật', 'c.disable': 'tắt', 'c.ping': 'ping', 'c.view': 'xem', 'c.edit': 'sửa',
    'c.replay': 'phát lại', 'c.openPlayground': 'mở trong thử nghiệm', 'c.running': '… đang chạy',
    'c.newRule': 'quy tắc mới', 'c.newChannel': 'kênh mới',
    // pills
    'p.runtime': 'runtime', 'p.readonly': 'chỉ-đọc', 'p.healthy': 'ổn định', 'p.draft': 'nháp',
    'p.live': 'live', 'p.canary': 'canary', 'p.archived': 'lưu trữ', 'p.production': 'production',
    'p.connected': 'đã kết nối', 'p.available': 'sẵn sàng', 'p.offline': 'ngoại tuyến',
    'p.enabled': 'bật', 'p.disabled': 'tắt',
    // column headers
    'th.name': 'tên', 'th.model': 'model', 'th.provider': 'provider', 'th.calls': 'lượt gọi',
    'th.errors': 'lỗi', 'th.status': 'trạng thái', 'th.method': 'phương thức', 'th.path': 'đường dẫn',
    'th.handler': 'handler', 'th.middleware': 'middleware', 'th.key': 'khóa', 'th.size': 'kích cỡ',
    'th.type': 'loại', 'th.updated': 'cập nhật', 'th.ttl': 'ttl', 'th.total': 'tổng',
    'th.user': 'người dùng', 'th.cost': 'chi phí', 'th.tokens': 'tokens', 'th.sessions': 'phiên',
    'th.time': 'thời gian', 'th.actor': 'tác nhân', 'th.action': 'hành động', 'th.target': 'đối tượng',
    'th.session': 'phiên', 'th.agent': 'agent', 'th.from': 'từ', 'th.to': 'đến',
    'th.id': 'id', 'th.title': 'tiêu đề', 'th.input': 'đầu vào', 'th.score': 'điểm',
    // MOUNT
    'mnt.eyebrow': 'hướng dẫn · ~3 phút', 'mnt.titlePre': 'Gắn', 'mnt.titlePost': 'vào Worker của bạn',
    'mnt.lead': 'Dashboard là một request handler. Gắn vào bất kỳ path nào trên Worker hiện có — không cần service thêm, không cần deploy thêm.',
    'mnt.yourWorker': 'worker của bạn', 'mnt.s1t': 'Cài đặt', 'mnt.s1d': 'Thêm package',
    'mnt.s2t': 'Gắn', 'mnt.s2d': 'Đính handler vào route', 'mnt.s3t': 'Bindings',
    'mnt.s3d': 'KV / D1 / Vectorize', 'mnt.s4t': 'Xác nhận', 'mnt.s4d': 'Truy cập /dashboard',
    'mnt.install': 'cài đặt', 'mnt.requirements': 'yêu cầu', 'mnt.required': 'bắt buộc',
    'mnt.optional': 'tùy chọn', 'mnt.any': 'bất kỳ', 'mnt.mountHint': '· gắn handler vào bất kỳ path nào',
    'mnt.footWorksA': 'hoạt động với Hono, itty-router hoặc', 'mnt.footWorksB': 'handler thô.',
    'mnt.see': 'xem', 'mnt.guides': 'hướng dẫn tích hợp →', 'mnt.local': '· local',
    'mnt.forProd': 'cho prod:', 'mnt.verify': 'xác nhận', 'mnt.whatYouGet': 'bạn nhận được gì',
    'mnt.tracing': 'Tracing', 'mnt.wyd_playground': 'chat với bất kỳ agent · streaming',
    'mnt.wyd_logs': 'timeline nhóm theo request', 'mnt.wyd_sessions': 'danh sách, chi tiết, kill / restart',
    'mnt.wyd_memory': 'KV · D1 · Vectorize browser', 'mnt.wyd_routes': 'bảng route + binding trực tiếp',
    'mnt.wyd_tracing': 'spans tương thích OTel', 'mnt.back': '← quay lại', 'mnt.next': 'tiếp theo:',
    'mnt.openPg': 'mở thử nghiệm →',
    // OVERVIEW
    'ov.reqMin': 'yêu cầu / phút', 'ov.latency': 'độ trễ', 'ov.errRate': 'tỷ lệ lỗi',
    'ov.activeSess': 'phiên đang hoạt động', 'ov.tokens24h': 'tokens (24h)', 'ov.byProvider': 'theo provider',
    'ov.costToday': 'chi phí (hôm nay)', 'ov.est': 'ước tính', 'ov.projMonth': 'dự kiến tháng',
    'ov.topology': 'cấu trúc', 'ov.agents': 'agents', 'ov.last24h': '· 24h qua', 'ov.vs5m': 'so 5 phút', 'ov.now': 'hiện tại',
    // PLAYGROUND
    'pg.sendTo': 'gửi đến', 'pg.send': 'gửi', 'pg.newline': 'xuống dòng',
    'pg.placeholder': 'hỏi bất cứ điều gì…', 'pg.reset': 'đặt lại', 'pg.agent': 'agent',
    'pg.providerModel': 'provider / model', 'pg.parameters': 'tham số', 'pg.temperature': 'nhiệt độ',
    'pg.stream': 'stream', 'pg.session': 'phiên', 'pg.newSession': '— phiên mới —',
    'pg.messages': 'tin nhắn', 'pg.tokensUsed': 'tokens đã dùng', 'pg.cost': 'chi phí',
    'pg.toolsAvailable': 'tools sẵn có', 'pg.streaming': 'đang stream…',
    'pg.toolCall': '· gọi tool', 'pg.arguments': 'tham số', 'pg.result': 'kết quả',
    // AGENTS
    'ag.filter': 'tìm agents…', 'ag.tools': 'tools', 'ag.calls24h': 'lượt gọi/24h',
    'ag.provider': 'provider', 'ag.model': 'model', 'ag.systemPrompt': 'system prompt',
    'ag.enabled': 'đã bật', 'ag.registered': 'đã đăng ký', 'ag.createTitle': 'Tạo agent',
    // LOGS
    'lg.filter': 'lọc theo path, method, agent…', 'lg.all': 'tất cả', 'lg.info': 'info',
    'lg.warn': 'warn', 'lg.errors': 'lỗi', 'lg.live': 'trực tiếp', 'lg.paused': 'tạm dừng',
    'lg.events': 'sự kiện', 'lg.elapsed': 'thời gian', 'lg.level': 'mức', 'lg.source': 'nguồn',
    'lg.waterfall': 'waterfall', 'lg.tailWaiting': 'tail · chờ request tiếp theo',
    // SESSIONS
    'ss.filter': 'lọc phiên…', 'ss.compare': 'so sánh', 'ss.msgs': 'tin nhắn',
    'ss.copyId': 'sao chép id', 'ss.restart': 'khởi động lại', 'ss.kill': 'kết thúc',
    'ss.user': 'người dùng', 'ss.channel': 'kênh', 'ss.started': 'bắt đầu',
    'ss.lastActive': 'hoạt động cuối', 'ss.messages': 'tin nhắn', 'ss.tokensIO': 'tokens (vào / ra)',
    'ss.timeline': 'dòng thời gian', 'ss.tabMessages': 'tin nhắn', 'ss.state': 'trạng thái',
    'ss.tools': 'tools', 'ss.trace': 'trace',
    // ROUTES & ENV
    'rt.routes': 'routes', 'rt.bindings': 'bindings',
    'env.title': 'môi trường', 'env.secret': 'bí mật', 'env.var': 'biến', 'env.reveal': 'hiện',
    'env.hide': 'ẩn',
    // API REF
    'api.endpoints': 'endpoints', 'api.request': 'yêu cầu', 'api.responseStream': 'phản hồi (stream)',
    'api.typescript': 'typescript', 'api.curl': 'curl',
  },
};

export type Translator = (key: string, fallback?: string) => string;

export function makeTranslator(lang: Lang): Translator {
  const d = dict[lang] ?? dict.en;
  return (key: string, fallback?: string) => d[key] ?? dict.en[key] ?? fallback ?? key;
}
