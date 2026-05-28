import { CLIENT_SCRIPT } from './client-bundle';

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
      darkMode: 'class',
      theme: {
        extend: {
          colors: { brand: { 50:'#f0f9ff',100:'#e0f2fe',500:'#0ea5e9',600:'#0284c7',700:'#0369a1' } }
        }
      }
    }
  </script>
  <script src="https://cdn.jsdelivr.net/npm/marked@9/marked.min.js"></script>
  <link id="hljs-light" rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
  <link id="hljs-dark" rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css" disabled>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <style>
    .msg-user      { background:#0ea5e9; color:#fff; margin-left:auto; }
    .msg-assistant { background:#f1f5f9; color:#1e293b; margin-right:auto; }
    .dark .msg-assistant { background:#374151; color:#f1f5f9; }
    .chat-container { height: calc(100vh - 220px); min-height: 380px; }
    #chat-messages { scrollbar-width: thin; }
    /* Markdown prose */
    .prose p { margin: 0.4em 0; }
    .prose p:first-child { margin-top: 0; }
    .prose p:last-child  { margin-bottom: 0; }
    .prose pre { background:#f6f8fa; border-radius:6px; padding:12px; overflow-x:auto; margin:0.5em 0; }
    .dark .prose pre { background:#161b22; }
    .prose code:not(pre code) { background:#f0f0f0; border-radius:3px; padding:1px 5px; font-size:0.875em; }
    .dark .prose code:not(pre code) { background:#374151; color:#e2e8f0; }
    .prose pre code { background:transparent; padding:0; }
    .prose ul  { list-style:disc;    padding-left:1.5em; margin:0.4em 0; }
    .prose ol  { list-style:decimal; padding-left:1.5em; margin:0.4em 0; }
    .prose li  { margin:0.2em 0; }
    .prose h1  { font-size:1.25em; font-weight:600; margin:0.7em 0 0.25em; }
    .prose h2  { font-size:1.1em;  font-weight:600; margin:0.7em 0 0.25em; }
    .prose h3  { font-size:1em;    font-weight:600; margin:0.7em 0 0.25em; }
    .prose blockquote { border-left:3px solid #cbd5e1; padding-left:1em; color:#64748b; margin:0.5em 0; }
    .prose table { border-collapse:collapse; width:100%; margin:0.5em 0; font-size:0.875em; }
    .prose th, .prose td { border:1px solid #e2e8f0; padding:6px 10px; }
    .prose th { background:#f8fafc; font-weight:600; }
    .dark .prose th { background:#374151; }
    .dark .prose th, .dark .prose td { border-color:#4b5563; }
    .prose a { color:#0ea5e9; text-decoration:underline; }
    /* Tool calls */
    .tool-detail summary { cursor:pointer; user-select:none; padding:6px 16px; }
    .tool-detail pre     { max-height:200px; overflow-y:auto; }
    /* Copy button visible on hover */
    .copy-btn { opacity:0; transition:opacity 0.15s; }
    .msg-wrapper:hover .copy-btn { opacity:1; }
    /* Tabs */
    .active-tab   { background:#0ea5e9; color:#fff; }
    .inactive-tab { color:#64748b; }
    .inactive-tab:hover { background:#f1f5f9; }
    .dark .inactive-tab       { color:#9ca3af; }
    .dark .inactive-tab:hover { background:#374151; }
    @media (max-width:640px) {
      .chat-container { height:calc(100vh - 180px); min-height:320px; }
      .msg-user, .msg-assistant { max-width:95% !important; }
    }
  </style>
</head>
<body class="bg-gray-50 dark:bg-gray-900 min-h-screen font-sans transition-colors duration-150">

<!-- Nav -->
<nav class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
  <svg class="w-6 h-6 text-brand-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
  </svg>
  <span class="font-semibold text-gray-800 dark:text-white text-lg">moon-wave</span>
  <span class="text-gray-400 text-sm ml-1 hidden sm:inline">dashboard</span>
  <div class="ml-auto flex items-center gap-1" id="nav-tabs">
    <button id="tab-playground"
      class="px-3 py-1.5 rounded-md text-sm font-medium tab-btn active-tab">
      Playground
    </button>
    <button id="tab-agents"
      class="px-3 py-1.5 rounded-md text-sm font-medium tab-btn inactive-tab">
      Agents
    </button>
    <button id="dark-btn" title="Toggle dark mode"
      class="ml-1 p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
      <svg id="icon-moon" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
      </svg>
      <svg id="icon-sun" class="w-4 h-4 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
      </svg>
    </button>
  </div>
</nav>

<main class="max-w-4xl mx-auto px-4 py-4 sm:py-6">

  <!-- Playground Tab -->
  <div id="tab-content-playground">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col chat-container">

      <!-- Header: agent selector + actions -->
      <div class="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2 flex-wrap">
        <label class="text-sm font-medium text-gray-600 dark:text-gray-400 shrink-0">Agent:</label>
        <select id="agent-select"
          class="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-700 dark:text-white flex-1 sm:flex-none min-w-0">
          <option value="">Loading...</option>
        </select>
        <div class="ml-auto flex items-center gap-1">
          <button id="export-btn" title="Export chat as JSON"
            class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center gap-1 px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            <span class="hidden sm:inline">Export</span>
          </button>
          <button id="clear-btn" title="Clear conversation"
            class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center gap-1 px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
            <span class="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      <!-- Messages -->
      <div id="chat-messages" class="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        <div class="text-center text-gray-400 dark:text-gray-500 text-sm mt-8 placeholder-hint">
          Select an agent and send a message to start.
        </div>
      </div>

      <!-- Input -->
      <div class="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
        <form id="chat-form" class="flex gap-2">
          <input id="chat-input" type="text" placeholder="Type a message..."
            class="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 min-w-0"
            autocomplete="off" />
          <button type="submit" id="send-btn"
            class="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
            <span class="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>

    <!-- Tool calls panel -->
    <div id="tool-calls-panel" class="mt-4 hidden">
      <h3 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1.5">
        <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        Tool calls
      </h3>
      <div id="tool-calls-list" class="space-y-2"></div>
    </div>
  </div>

  <!-- Agents Tab -->
  <div id="tab-content-agents" class="hidden">
    <div id="agents-list" class="grid gap-4">
      <div class="text-center text-gray-400 dark:text-gray-500 py-12">Loading agents...</div>
    </div>
  </div>

</main>

<script>const BASE = '${basePath}';</script>
<script>${CLIENT_SCRIPT}</script>

</body>
</html>`;
}
