/** Self-contained dashboard HTML — served at /dashboard */
export function buildDashboardHtml(basePath: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>moon-wave dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: { brand: { 50:'#f0f9ff',100:'#e0f2fe',500:'#0ea5e9',600:'#0284c7',700:'#0369a1' } }
        }
      }
    }
  </script>
  <style>
    .msg-user { background:#0ea5e9; color:#fff; margin-left:auto; }
    .msg-assistant { background:#f1f5f9; color:#1e293b; margin-right:auto; }
    #chat-messages { scrollbar-width:thin; }
  </style>
</head>
<body class="bg-gray-50 min-h-screen font-sans">

<!-- Nav -->
<nav class="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
  <svg class="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
      d="M13 10V3L4 14h7v7l9-11h-7z"/>
  </svg>
  <span class="font-semibold text-gray-800 text-lg">moon-wave</span>
  <span class="text-gray-400 text-sm ml-1">dashboard</span>
  <div class="ml-auto flex gap-2" id="nav-tabs">
    <button onclick="showTab('playground')" id="tab-playground"
      class="px-3 py-1.5 rounded-md text-sm font-medium tab-btn active-tab">
      Playground
    </button>
    <button onclick="showTab('agents')" id="tab-agents"
      class="px-3 py-1.5 rounded-md text-sm font-medium tab-btn inactive-tab">
      Agents
    </button>
  </div>
</nav>

<style>
  .active-tab   { background:#0ea5e9; color:#fff; }
  .inactive-tab { color:#64748b; }
  .inactive-tab:hover { background:#f1f5f9; }
</style>

<main class="max-w-4xl mx-auto px-4 py-6">

  <!-- Playground Tab -->
  <div id="tab-content-playground">
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col" style="height:600px">
      <!-- Agent selector -->
      <div class="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
        <label class="text-sm font-medium text-gray-600">Agent:</label>
        <select id="agent-select"
          class="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
          <option value="">Loading...</option>
        </select>
        <button onclick="clearChat()"
          class="ml-auto text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
          Clear
        </button>
      </div>
      <!-- Messages -->
      <div id="chat-messages" class="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        <div class="text-center text-gray-400 text-sm mt-8">
          Select an agent and send a message to start.
        </div>
      </div>
      <!-- Input -->
      <div class="px-4 py-3 border-t border-gray-100">
        <form onsubmit="sendMessage(event)" class="flex gap-2">
          <input id="chat-input" type="text" placeholder="Type a message..."
            class="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            autocomplete="off" />
          <button type="submit" id="send-btn"
            class="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
            Send
          </button>
        </form>
      </div>
    </div>

    <!-- Tool calls (hidden by default) -->
    <div id="tool-calls-panel" class="mt-4 hidden">
      <h3 class="text-sm font-medium text-gray-600 mb-2">Tool calls</h3>
      <div id="tool-calls-list" class="space-y-2"></div>
    </div>
  </div>

  <!-- Agents Tab -->
  <div id="tab-content-agents" class="hidden">
    <div id="agents-list" class="grid gap-4">
      <div class="text-center text-gray-400 py-12">Loading agents...</div>
    </div>
  </div>

</main>

<script>
  const BASE = '${basePath}';
  let sessionId = crypto.randomUUID();
  let agentsData = [];

  // --- Tabs ---
  function showTab(name) {
    ['playground','agents'].forEach(t => {
      document.getElementById('tab-content-' + t).classList.toggle('hidden', t !== name);
      const btn = document.getElementById('tab-' + t);
      btn.className = 'px-3 py-1.5 rounded-md text-sm font-medium tab-btn ' +
        (t === name ? 'active-tab' : 'inactive-tab');
    });
    if (name === 'agents') renderAgents();
  }

  // --- Load agents ---
  async function loadAgents() {
    try {
      const res = await fetch(BASE + '/api/agents');
      agentsData = await res.json();
      const sel = document.getElementById('agent-select');
      sel.innerHTML = agentsData.length === 0
        ? '<option value="">No agents registered</option>'
        : agentsData.map(a =>
            '<option value="' + a.name + '">' + a.name + (a.description ? ' — ' + a.description : '') + '</option>'
          ).join('');
    } catch(e) {
      document.getElementById('agent-select').innerHTML = '<option value="">Error loading agents</option>';
    }
  }

  function renderAgents() {
    const el = document.getElementById('agents-list');
    if (!agentsData.length) {
      el.innerHTML = '<div class="text-center text-gray-400 py-12">No agents registered.</div>';
      return;
    }
    el.innerHTML = agentsData.map(a => \`
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="font-semibold text-gray-800">\${a.name}</h3>
            <p class="text-sm text-gray-500 mt-0.5">\${a.description || 'No description'}</p>
          </div>
          <button onclick="selectAgent('\${a.name}')"
            class="text-xs bg-brand-50 text-brand-700 hover:bg-brand-100 px-3 py-1.5 rounded-lg font-medium transition-colors">
            Open in Playground
          </button>
        </div>
      </div>
    \`).join('');
  }

  function selectAgent(name) {
    document.getElementById('agent-select').value = name;
    showTab('playground');
  }

  // --- Chat ---
  function appendMessage(role, text) {
    const msgs = document.getElementById('chat-messages');
    // Remove placeholder
    const placeholder = msgs.querySelector('.text-center');
    if (placeholder) placeholder.remove();

    const div = document.createElement('div');
    div.className = 'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap msg-' + role;
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  function clearChat() {
    document.getElementById('chat-messages').innerHTML =
      '<div class="text-center text-gray-400 text-sm mt-8">Select an agent and send a message to start.</div>';
    document.getElementById('tool-calls-panel').classList.add('hidden');
    document.getElementById('tool-calls-list').innerHTML = '';
    sessionId = crypto.randomUUID();
  }

  async function sendMessage(e) {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const btn = document.getElementById('send-btn');
    const agentName = document.getElementById('agent-select').value;
    const text = input.value.trim();

    if (!text || !agentName) return;

    input.value = '';
    btn.disabled = true;
    appendMessage('user', text);

    // Loading indicator
    const loadingDiv = appendMessage('assistant', '...');
    loadingDiv.classList.add('animate-pulse', 'text-gray-400');

    try {
      const res = await fetch(BASE + '/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentName, input: text, sessionId }),
      });
      const data = await res.json();
      loadingDiv.remove();

      if (data.error) {
        appendMessage('assistant', 'Error: ' + data.error).classList.add('border', 'border-red-200', 'bg-red-50', 'text-red-700');
      } else {
        appendMessage('assistant', data.output);
        // Show tool calls if any
        if (data.toolCalls && data.toolCalls.length > 0) {
          const panel = document.getElementById('tool-calls-panel');
          const list = document.getElementById('tool-calls-list');
          panel.classList.remove('hidden');
          list.innerHTML = data.toolCalls.map(tc => \`
            <div class="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-xs font-mono">
              <span class="font-semibold text-amber-700">\${tc.name}</span>
              <span class="text-gray-500 ml-2">\${JSON.stringify(tc.args)}</span>
            </div>
          \`).join('');
        }
      }
    } catch(err) {
      loadingDiv.remove();
      appendMessage('assistant', 'Network error: ' + err.message)
        .classList.add('border', 'border-red-200', 'bg-red-50', 'text-red-700');
    } finally {
      btn.disabled = false;
      document.getElementById('chat-input').focus();
    }
  }

  // Init
  loadAgents();
</script>

</body>
</html>`;
}
