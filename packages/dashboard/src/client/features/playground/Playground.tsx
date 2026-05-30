import { useEffect, useRef, type KeyboardEvent } from 'react';
import { useApp } from '../../AppContext';
import { usePlayground } from './usePlayground';
import { Dot } from '../../shared/components/Primitives';
import Icon from '../../shared/components/Icon';
import type { Message } from '../../shared/types';

function fmtTime(ts: number): string {
  const d = new Date(ts);
  return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
}

function ToolCallBlock({ msg }: { msg: Message }) {
  return (
    <div style={{
      margin: '6px 0',
      border: '1px solid var(--border)',
      borderRadius: 3,
      background: '#060606',
      fontSize: 11.5,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 10px', borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ color: 'var(--amber)' }}>{msg.toolName}</span>
        <span style={{ color: 'var(--text-3)', fontSize: 11 }}>· tool call</span>
      </div>
      {msg.toolArgs && (
        <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--text-3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>args</div>
          <pre style={{ margin: 0, color: 'var(--text-2)', fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {JSON.stringify(msg.toolArgs, null, 2)}
          </pre>
        </div>
      )}
      {msg.toolResult !== undefined && (
        <div style={{ padding: '6px 10px' }}>
          <div style={{ color: 'var(--text-3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>result</div>
          <pre style={{ margin: 0, color: 'var(--text-2)', fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 200, overflow: 'auto' }}>
            {JSON.stringify(msg.toolResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  if (msg.role === 'tool') return <ToolCallBlock msg={msg} />;

  const isUser = msg.role === 'user';
  const color = isUser ? 'var(--cyan)' : msg.error ? 'var(--rose)' : 'var(--accent)';

  return (
    <div className="msg">
      <div className="msg-head">
        <span className={`who ${msg.role}`} style={{ color }}>{msg.role}</span>
        {msg.ts && <span>{fmtTime(msg.ts)}</span>}
      </div>
      <div className="msg-body" style={msg.error ? { color: 'var(--rose)' } : undefined}>
        {msg.body}
      </div>
    </div>
  );
}

export default function Playground() {
  const { t, go } = useApp();
  const { agents, agentName, setAgentName, msgs, input, setInput, loading, send, reset, loadAgents } = usePlayground();
  const convRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadAgents(); }, [loadAgents]);

  useEffect(() => {
    const el = convRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, loading]);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  return (
    <div className="pg-shell">
      {/* main chat */}
      <div className="pg-main">
        {/* conversation */}
        <div ref={convRef} className="pg-conv">
          {msgs.length === 0 && (
            <div style={{ color: 'var(--text-3)', fontSize: 12, textAlign: 'center', marginTop: 60 }}>
              {agents.length === 0
                ? 'No agents registered. Go to Mount to add an agent.'
                : 'Select an agent and send a message to start.'}
            </div>
          )}
          {msgs.map((m, i) => <MessageBubble key={i} msg={m} />)}
          {loading && (
            <div className="msg">
              <div className="msg-head">
                <span className="who assistant" style={{ color: 'var(--accent)' }}>assistant</span>
              </div>
              <div className="msg-body">
                <span className="cursor" />
              </div>
            </div>
          )}
        </div>

        {/* input */}
        <div className="pg-input">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 11, color: 'var(--text-3)' }}>
            <span>{t('pg.sendTo')}</span>
            <select
              value={agentName}
              onChange={e => setAgentName(e.target.value)}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border-strong)',
                color: 'var(--text)', fontSize: 11, borderRadius: 3, padding: '1px 6px',
                fontFamily: 'var(--mono)',
              }}
            >
              {agents.length === 0
                ? <option value="">no agents</option>
                : agents.map(a => <option key={a.name} value={a.name}>{a.name}</option>)
              }
            </select>
            <span style={{ marginLeft: 'auto' }}>
              <kbd style={{ fontSize: 10, padding: '1px 4px', border: '1px solid var(--border-strong)', borderRadius: 2, color: 'var(--text-3)' }}>↵</kbd>
              &nbsp;{t('pg.send')} &nbsp;
              <kbd style={{ fontSize: 10, padding: '1px 4px', border: '1px solid var(--border-strong)', borderRadius: 2, color: 'var(--text-3)' }}>⇧↵</kbd>
              &nbsp;{t('pg.newline')}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={t('pg.placeholder')}
              disabled={loading || agents.length === 0}
              rows={2}
              style={{
                flex: 1, resize: 'none', fontFamily: 'var(--mono)', fontSize: 12.5,
                background: 'var(--surface)', border: '1px solid var(--border-strong)',
                color: 'var(--text)', borderRadius: 3, padding: '8px 10px',
                outline: 'none', lineHeight: 1.5,
              }}
            />
            <button
              onClick={() => void send(input)}
              disabled={loading || !agentName || !input.trim()}
              style={{
                height: 56, width: 40, background: 'var(--accent)', color: '#0a0a0a',
                border: 0, borderRadius: 3, cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <Icon name="send" size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* sidebar metadata */}
      <div className="pg-side">
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 10 }}>
            {t('pg.agent')}
          </div>
          {agents.length === 0 ? (
            <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
              No agents yet.{' '}
              <button onClick={() => go('mount')} style={{ color: 'var(--accent)', background: 'none', border: 0, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 11.5 }}>
                Mount guide →
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {agents.map(a => (
                <div
                  key={a.name}
                  onClick={() => setAgentName(a.name)}
                  style={{
                    padding: '8px 10px', borderRadius: 3, cursor: 'pointer',
                    background: agentName === a.name ? 'var(--surface-hover)' : 'var(--surface)',
                    border: `1px solid ${agentName === a.name ? 'var(--accent-dim)' : 'var(--border)'}`,
                  }}
                >
                  <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{a.name}</div>
                  {a.description && (
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{a.description}</div>
                  )}
                  {a.model && (
                    <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 4 }}>
                      {a.provider && <span style={{ marginRight: 6 }}>{a.provider}</span>}
                      {a.model}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 8 }}>
            {t('pg.session')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{t('pg.messages')}</span>
              <span style={{ color: 'var(--text)' }}>{msgs.filter(m => m.role !== 'tool').length}</span>
            </div>
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontSize: 11 }}>
                <Dot kind="ok" />
                {t('pg.streaming')}
              </div>
            )}
          </div>
          <button
            onClick={reset}
            style={{
              marginTop: 12, width: '100%', padding: '5px 0', fontSize: 11, fontFamily: 'var(--mono)',
              background: 'transparent', border: '1px solid var(--border-strong)', borderRadius: 3,
              color: 'var(--text-2)', cursor: 'pointer',
            }}
          >
            {t('pg.reset')}
          </button>
        </div>
      </div>
    </div>
  );
}
