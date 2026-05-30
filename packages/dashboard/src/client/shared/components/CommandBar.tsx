import { useState, useEffect, useRef } from 'react';
import type { SectionId } from '../types';
import type { Translator } from '../i18n';
import { Kbd } from './Primitives';
import Icon from './Icon';

interface CommandBarProps {
  sections: Record<string, { label: string; desc: string }>;
  onNavigate: (s: SectionId) => void;
  onClose: () => void;
  t: Translator;
}

export default function CommandBar({ sections, onNavigate, onClose, t }: CommandBarProps) {
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const items = Object.entries(sections).map(([k, m]) => ({ id: k as SectionId, label: m.label, desc: m.desc }));
  const filtered = q
    ? items.filter(i => i.label.toLowerCase().includes(q.toLowerCase()) || i.desc.toLowerCase().includes(q.toLowerCase()))
    : items;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 120,
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{
        width: 520, background: 'var(--surface)', border: '1px solid var(--border-strong)',
        borderRadius: 4, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
          borderBottom: '1px solid var(--border)',
        }}>
          <Icon name="cmd" size={14} />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={t('cmd.placeholder')}
            style={{
              flex: 1, background: 'transparent', border: 0, outline: 0,
              color: 'var(--text)', fontSize: 13, fontFamily: 'var(--mono)',
            }}
          />
          <Kbd>esc</Kbd>
        </div>
        <div style={{ maxHeight: 360, overflow: 'auto' }}>
          {filtered.length === 0 && (
            <div style={{ padding: 16, color: 'var(--text-3)', fontSize: 12 }}>{t('cmd.nomatch')}</div>
          )}
          {filtered.map(i => (
            <div key={i.id} onClick={() => { onNavigate(i.id); onClose(); }} style={{
              padding: '8px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <Icon name="chevron" size={12} />
              <div>
                <div style={{ color: 'var(--text)', fontSize: 12.5 }}>{i.label}</div>
                <div style={{ color: 'var(--text-3)', fontSize: 11 }}>{i.desc}</div>
              </div>
              <span style={{ marginLeft: 'auto', color: 'var(--text-3)', fontSize: 10.5 }}>{t('cmd.section')}</span>
            </div>
          ))}
        </div>
        <div style={{
          padding: '6px 14px', borderTop: '1px solid var(--border)',
          display: 'flex', gap: 14, fontSize: 10.5, color: 'var(--text-3)', alignItems: 'center',
        }}>
          <span><Kbd>⌘</Kbd> <Kbd>1-9</Kbd> {t('cmd.jump')}</span>
          <span><Kbd>↵</Kbd> {t('cmd.open')}</span>
          <span style={{ marginLeft: 'auto' }}>moon-wave</span>
        </div>
      </div>
    </div>
  );
}
