import type { AgentData, AgentRunResult, AppendMessageOptions, ChatHistoryEntry, ToolCallData } from './types';

// CDN libraries injected via HTML <script> tags
declare const marked: { parse(text: string): string };
declare const hljs: { highlightElement(block: Element): void };
// BASE is injected by the server as `const BASE = '<basePath>';` before this bundle
declare const BASE: string;

const STORAGE_SESSION_KEY = 'mw_session_id';
const STORAGE_DARK_KEY = 'mw_dark';

let sessionId: string = localStorage.getItem(STORAGE_SESSION_KEY) ?? crypto.randomUUID();
localStorage.setItem(STORAGE_SESSION_KEY, sessionId);
let agentsData: AgentData[] = [];
let chatHistory: ChatHistoryEntry[] = [];
let lastInput = '';
let previousAgent = '';

function getEl<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element #${id} not found`);
  return el as T;
}

// ── Dark mode ─────────────────────────────────────────────────────────────────

function applyDark(isDark: boolean): void {
  document.documentElement.classList.toggle('dark', isDark);
  (getEl<HTMLLinkElement>('hljs-light')).disabled = isDark;
  (getEl<HTMLLinkElement>('hljs-dark')).disabled = !isDark;
  getEl('icon-moon').classList.toggle('hidden', isDark);
  getEl('icon-sun').classList.toggle('hidden', !isDark);
  localStorage.setItem(STORAGE_DARK_KEY, isDark ? '1' : '0');
}

function toggleDark(): void {
  applyDark(!document.documentElement.classList.contains('dark'));
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

function showTab(name: 'playground' | 'agents'): void {
  const tabs = ['playground', 'agents'] as const;
  tabs.forEach(t => {
    getEl('tab-content-' + t).classList.toggle('hidden', t !== name);
    const btn = getEl('tab-' + t);
    btn.className = 'px-3 py-1.5 rounded-md text-sm font-medium tab-btn ' +
      (t === name ? 'active-tab' : 'inactive-tab');
  });
  if (name === 'agents') renderAgents();
}

// ── Agents ────────────────────────────────────────────────────────────────────

async function loadAgents(): Promise<void> {
  try {
    const res = await fetch(BASE + '/api/agents');
    agentsData = (await res.json()) as AgentData[];
    const sel = getEl<HTMLSelectElement>('agent-select');
    if (!agentsData.length) {
      sel.innerHTML = '<option value="">No agents registered</option>';
      return;
    }
    sel.innerHTML = agentsData.map(a =>
      '<option value="' + a.name + '">' + a.name +
      (a.description ? ' — ' + a.description : '') + '</option>'
    ).join('');
    previousAgent = sel.value;
    sel.addEventListener('change', (e: Event) => {
      const next = (e.target as HTMLSelectElement).value;
      if (chatHistory.length > 0) {
        if (!confirm('Switching agents will start a new session. Continue?')) {
          sel.value = previousAgent;
          return;
        }
        clearChat();
      }
      previousAgent = next;
    });
  } catch {
    getEl('agent-select').innerHTML = '<option value="">Error loading agents</option>';
  }
}

function renderAgents(): void {
  const el = getEl('agents-list');
  if (!agentsData.length) {
    el.innerHTML = '<div class="text-center text-gray-400 dark:text-gray-500 py-12">No agents registered.</div>';
    return;
  }
  el.innerHTML = agentsData.map(a => `
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <h3 class="font-semibold text-gray-800 dark:text-white">${esc(a.name)}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">${esc(a.description ?? 'No description')}</p>
        </div>
        <button data-agent-name="${esc(a.name)}"
          class="shrink-0 text-xs bg-brand-50 dark:bg-blue-900/30 text-brand-700 dark:text-blue-300 hover:bg-brand-100 dark:hover:bg-blue-900/50 px-3 py-1.5 rounded-lg font-medium transition-colors">
          Open in Playground
        </button>
      </div>
    </div>
  `).join('');
}

function selectAgent(name: string): void {
  getEl<HTMLSelectElement>('agent-select').value = name;
  previousAgent = name;
  showTab('playground');
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function esc(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtTime(d: Date): string {
  return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
}

function nearBottom(el: HTMLElement): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
}

function renderMarkdown(text: string, el: HTMLElement): void {
  el.innerHTML = marked.parse(text);
  el.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));
}

// ── Chat ──────────────────────────────────────────────────────────────────────

function appendMessage(role: string, text: string, opts: AppendMessageOptions = {}): HTMLElement {
  const msgs = getEl('chat-messages');
  const hint = msgs.querySelector('.placeholder-hint');
  if (hint) hint.remove();

  const now = new Date();
  const isUser = role === 'user';

  const wrapper = document.createElement('div');
  wrapper.className = 'msg-wrapper flex flex-col ' + (isUser ? 'items-end' : 'items-start');

  const bubble = document.createElement('div');
  const baseClass = 'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ';
  if (opts.isError) {
    bubble.className = baseClass + 'border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300';
  } else {
    bubble.className = baseClass + 'msg-' + role;
  }

  if (isUser) {
    bubble.textContent = text;
  } else if (opts.isLoading) {
    bubble.textContent = '...';
    bubble.classList.add('animate-pulse', 'text-gray-400', 'dark:text-gray-500');
  } else {
    const content = document.createElement('div');
    content.className = 'prose';
    if (typeof marked !== 'undefined') {
      renderMarkdown(text, content);
    } else {
      content.textContent = text;
    }
    bubble.appendChild(content);

    if (!opts.isError) {
      const footer = document.createElement('div');
      footer.className = 'flex items-center gap-2 mt-1.5 flex-wrap';

      const ts = document.createElement('span');
      ts.className = 'text-xs text-gray-400 dark:text-gray-500';
      ts.textContent = fmtTime(now);
      footer.appendChild(ts);

      if (opts.iterations && opts.iterations > 0) {
        const itr = document.createElement('span');
        itr.className = 'text-xs text-gray-400 dark:text-gray-500';
        itr.textContent = opts.iterations + ' iteration' + (opts.iterations !== 1 ? 's' : '');
        footer.appendChild(itr);
      }

      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn ml-auto text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors';
      copyBtn.title = 'Copy response';
      copyBtn.innerHTML = '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>';
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(text).then(() => {
          copyBtn.innerHTML = '<svg class="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';
          setTimeout(() => {
            copyBtn.innerHTML = '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>';
          }, 2000);
        }).catch(() => { /* clipboard not available */ });
      });
      footer.appendChild(copyBtn);
      bubble.appendChild(footer);
    }
  }

  wrapper.appendChild(bubble);

  if (isUser) {
    const ts = document.createElement('div');
    ts.className = 'text-xs text-gray-400 dark:text-gray-500 mt-0.5 px-1';
    ts.textContent = fmtTime(now);
    wrapper.appendChild(ts);
  }

  const atBottom = nearBottom(msgs);
  msgs.appendChild(wrapper);
  if (atBottom || isUser) msgs.scrollTop = msgs.scrollHeight;

  return bubble;
}

function clearChat(): void {
  const msgs = getEl('chat-messages');
  msgs.innerHTML = '<div class="text-center text-gray-400 dark:text-gray-500 text-sm mt-8 placeholder-hint">Select an agent and send a message to start.</div>';
  getEl('tool-calls-panel').classList.add('hidden');
  getEl('tool-calls-list').innerHTML = '';
  chatHistory = [];
  lastInput = '';
  sessionId = crypto.randomUUID();
  localStorage.setItem(STORAGE_SESSION_KEY, sessionId);
}

function exportChat(): void {
  if (!chatHistory.length) { alert('No messages to export.'); return; }
  const agentName = getEl<HTMLSelectElement>('agent-select').value;
  const payload = {
    sessionId,
    agent: agentName,
    exportedAt: new Date().toISOString(),
    messages: chatHistory,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'chat-' + (agentName || 'session') + '-' + Date.now() + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

async function sendMessage(e: SubmitEvent): Promise<void> {
  e.preventDefault();
  const input    = getEl<HTMLInputElement>('chat-input');
  const btn      = getEl<HTMLButtonElement>('send-btn');
  const agentName = getEl<HTMLSelectElement>('agent-select').value;
  const text     = input.value.trim();

  if (!text || !agentName) return;

  lastInput   = text;
  input.value = '';
  btn.disabled = true;

  chatHistory.push({ role: 'user', content: text, timestamp: new Date().toISOString() });
  appendMessage('user', text);

  const msgs = getEl('chat-messages');
  const loadingWrapper = document.createElement('div');
  loadingWrapper.className = 'msg-wrapper flex flex-col items-start';
  const loadingBubble = document.createElement('div');
  loadingBubble.className = 'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm msg-assistant animate-pulse text-gray-400 dark:text-gray-500';
  loadingBubble.textContent = '...';
  loadingWrapper.appendChild(loadingBubble);
  msgs.appendChild(loadingWrapper);
  msgs.scrollTop = msgs.scrollHeight;

  try {
    const res  = await fetch(BASE + '/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentName, input: text, sessionId }),
    });
    const data = (await res.json()) as AgentRunResult;
    loadingWrapper.remove();

    if (data.error) {
      const errBubble = appendMessage('assistant', 'Error: ' + data.error, { isError: true });
      addRetryButton(errBubble.parentElement as HTMLElement, input);
      chatHistory.push({ role: 'assistant', content: 'Error: ' + data.error, timestamp: new Date().toISOString(), error: true });
    } else {
      appendMessage('assistant', data.output, { iterations: data.iterations });
      chatHistory.push({
        role: 'assistant',
        content: data.output,
        timestamp: new Date().toISOString(),
        iterations: data.iterations,
        toolCalls: data.toolCalls,
      });
      renderToolCalls(data.toolCalls);
    }
  } catch (err) {
    loadingWrapper.remove();
    const message = err instanceof Error ? err.message : String(err);
    const errBubble = appendMessage('assistant', 'Network error: ' + message, { isError: true });
    addRetryButton(errBubble.parentElement as HTMLElement, input);
    chatHistory.push({ role: 'assistant', content: 'Network error: ' + message, timestamp: new Date().toISOString(), error: true });
  } finally {
    btn.disabled = false;
    getEl<HTMLInputElement>('chat-input').focus();
  }
}

function addRetryButton(wrapper: HTMLElement, input: HTMLInputElement): void {
  const retryBtn = document.createElement('button');
  retryBtn.className = 'text-xs text-red-400 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 mt-1 px-1 underline';
  retryBtn.textContent = 'Retry';
  retryBtn.addEventListener('click', () => {
    input.value = lastInput;
    input.focus();
  });
  wrapper.appendChild(retryBtn);
}

function renderToolCalls(toolCalls: ToolCallData[] | undefined): void {
  const panel = getEl('tool-calls-panel');
  const list  = getEl('tool-calls-list');
  if (!toolCalls?.length) {
    panel.classList.add('hidden');
    return;
  }
  panel.classList.remove('hidden');
  list.innerHTML = toolCalls.map(tc => {
    const result = tc.result as Record<string, unknown> | null;
    const hasError   = result != null && typeof result === 'object' && 'error' in result;
    const statusCls  = hasError ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';
    const statusText = hasError ? '✗ Error' : '✓ Success';
    return `
      <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg overflow-hidden text-xs font-mono">
        <div class="px-4 py-2 flex items-center justify-between gap-2 flex-wrap bg-amber-100/60 dark:bg-amber-900/30">
          <span class="font-semibold text-amber-700 dark:text-amber-400">${esc(tc.name)}</span>
          <span class="${statusCls}">${statusText}</span>
        </div>
        <details class="tool-detail border-t border-amber-200 dark:border-amber-700">
          <summary class="text-gray-500 dark:text-gray-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 text-xs">Args</summary>
          <pre class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-900/40 overflow-x-auto">${esc(JSON.stringify(tc.args, null, 2))}</pre>
        </details>
        <details class="tool-detail border-t border-amber-200 dark:border-amber-700" open>
          <summary class="text-gray-500 dark:text-gray-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 text-xs">Result</summary>
          <pre class="px-4 py-2 ${hasError ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'} bg-white/60 dark:bg-gray-900/40 overflow-x-auto">${esc(JSON.stringify(tc.result, null, 2))}</pre>
        </details>
      </div>
    `;
  }).join('');
}

// ── Init ──────────────────────────────────────────────────────────────────────
// Script is injected at the bottom of <body>, so the DOM is already parsed.

// Apply dark mode immediately to prevent flash of unstyled content
const savedDark = localStorage.getItem(STORAGE_DARK_KEY);
applyDark(savedDark !== null ? savedDark === '1' : window.matchMedia('(prefers-color-scheme: dark)').matches);

// Wire up all event listeners
getEl('tab-playground').addEventListener('click', () => showTab('playground'));
getEl('tab-agents').addEventListener('click', () => showTab('agents'));
getEl('dark-btn').addEventListener('click', () => toggleDark());
getEl('export-btn').addEventListener('click', () => exportChat());
getEl('clear-btn').addEventListener('click', () => clearChat());
getEl<HTMLFormElement>('chat-form').addEventListener('submit', (e: Event) => {
  void sendMessage(e as SubmitEvent);
});
getEl('agents-list').addEventListener('click', (e: MouseEvent) => {
  const btn = (e.target as Element).closest<HTMLButtonElement>('[data-agent-name]');
  if (btn?.dataset.agentName) selectAgent(btn.dataset.agentName);
});
document.addEventListener('keydown', (e: KeyboardEvent) => {
  const chatInput = document.getElementById('chat-input');
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    chatInput?.focus();
  }
  if (e.key === 'Escape' && document.activeElement === chatInput) {
    chatInput?.blur();
  }
});

loadAgents().catch((err: unknown) => console.error('Failed to load agents:', err));
