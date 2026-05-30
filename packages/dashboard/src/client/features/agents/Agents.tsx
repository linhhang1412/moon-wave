import { useEffect } from 'react';
import { useApp } from '../../AppContext';
import { useAgents } from './useAgents';
import { Dot, Pill, Btn } from '../../shared/components/Primitives';
import Icon from '../../shared/components/Icon';

export default function Agents() {
  const { t, go } = useApp();
  const { agents, loading, error, load } = useAgents();

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div style={{ padding: '18px 20px', color: 'var(--text-3)', fontSize: 12 }}>
        loading…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '18px 20px' }}>
        <div style={{ color: 'var(--rose)', fontSize: 12, marginBottom: 8 }}>Error: {error}</div>
        <Btn onClick={load}><Icon name="refresh" size={11} /> retry</Btn>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      {/* toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 14px', borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
      }}>
        <Icon name="search" size={12} />
        <input
          placeholder={t('ag.filter')}
          style={{
            flex: 1, background: 'transparent', border: 0, outline: 0,
            color: 'var(--text)', fontSize: 12, fontFamily: 'var(--mono)',
          }}
        />
        <Btn onClick={load} variant="ghost"><Icon name="refresh" size={11} /></Btn>
      </div>

      {agents.length === 0 ? (
        <div style={{ padding: '18px 20px' }}>
          <div style={{ color: 'var(--text-3)', fontSize: 12, marginBottom: 12 }}>
            No agents registered yet.
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, maxWidth: 480 }}>
            Register agents by passing them to the dashboard:{' '}
            <code style={{ color: 'var(--accent)', fontSize: 11 }}>
              dashboard({'{ agents: { myAgent } }'})</code>
          </div>
          <button
            onClick={() => go('mount')}
            style={{
              marginTop: 12, padding: '5px 12px', fontSize: 11, fontFamily: 'var(--mono)',
              background: 'var(--accent)', color: '#0a0a0a', border: 0, borderRadius: 3, cursor: 'pointer',
            }}
          >
            {t('mnt.openPg')}
          </button>
        </div>
      ) : (
        <>
          {/* table header */}
          <table className="table" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ width: 200 }}>{t('th.name')}</th>
                <th>{t('th.model')}</th>
                <th style={{ width: 100 }}>{t('th.status')}</th>
                <th style={{ width: 100, textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {agents.map(a => (
                <tr key={a.name}>
                  <td>
                    <div style={{ color: 'var(--text)', fontWeight: 500, fontSize: 12.5 }}>{a.name}</div>
                    {a.description && (
                      <div style={{ color: 'var(--text-3)', fontSize: 11, marginTop: 2 }}>{a.description}</div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {a.provider && <Pill kind="subtle">{a.provider}</Pill>}
                      <span style={{ color: 'var(--text)' }}>{a.model ?? '—'}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Dot kind="ok" />
                      <span style={{ color: 'var(--accent)', fontSize: 11 }}>{t('ag.enabled')}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Btn variant="ghost" onClick={() => go('playground')}>
                      {t('c.openPlayground')}
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* summary */}
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-3)' }}>
            {agents.length} {t('ag.registered')}
          </div>
        </>
      )}
    </div>
  );
}
