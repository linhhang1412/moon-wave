import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import type { TweakValues } from '../types';
import { ACCENTS, FONT_PAIRS, ACCENT_LIGHT } from '../theme';
import type { Translator } from '../i18n';
import type { SectionId } from '../types';

interface TweaksPanelProps {
  tweaks: TweakValues;
  setTweak: <K extends keyof TweakValues>(k: K, v: TweakValues[K]) => void;
  section: SectionId;
  onNavigate: (s: SectionId) => void;
  t: Translator;
  sections: Record<string, { label: string }>;
}

export default function TweaksPanel({ tweaks, setTweak, section, onNavigate, t, sections }: TweaksPanelProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 16, y: 16 });

  const clamp = useCallback(() => {
    const el = panelRef.current;
    if (!el) return;
    const w = el.offsetWidth, h = el.offsetHeight;
    const PAD = 16;
    offsetRef.current = {
      x: Math.min(window.innerWidth - w - PAD, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(window.innerHeight - h - PAD, Math.max(PAD, offsetRef.current.y)),
    };
    el.style.right = offsetRef.current.x + 'px';
    el.style.bottom = offsetRef.current.y + 'px';
  }, []);

  useEffect(() => {
    if (!open) return;
    clamp();
    const ro = new ResizeObserver(clamp);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clamp]);

  // keyboard shortcut: ⌘+. to open tweaks
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '.') { e.preventDefault(); setOpen(o => !o); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onDragStart = (e: React.MouseEvent) => {
    const el = panelRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY;
    const sr = window.innerWidth - r.right;
    const sb = window.innerHeight - r.bottom;
    const move = (ev: MouseEvent) => {
      offsetRef.current = { x: sr - (ev.clientX - sx), y: sb - (ev.clientY - sy) };
      clamp();
    };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', right: 16, bottom: 16, zIndex: 100,
          width: 28, height: 28, borderRadius: '50%',
          background: 'var(--surface)', border: '1px solid var(--border-strong)',
          color: 'var(--text-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontFamily: 'var(--mono)',
        }}
        title="Tweaks (⌘.)"
      >⊕</button>
    );
  }

  const pair = FONT_PAIRS.find(p => p.id === tweaks.fontPair) || FONT_PAIRS[0];
  const sectionKeys = Object.keys(sections) as SectionId[];

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed', right: offsetRef.current.x, bottom: offsetRef.current.y, zIndex: 100,
        width: 260, maxHeight: 'calc(100vh - 32px)',
        display: 'flex', flexDirection: 'column',
        background: 'var(--surface)', border: '1px solid var(--border-strong)',
        borderRadius: 6, boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        overflow: 'hidden',
      }}
    >
      {/* header */}
      <div
        onMouseDown={onDragStart}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', borderBottom: '1px solid var(--border)',
          cursor: 'move', userSelect: 'none', fontSize: 11, color: 'var(--text-2)',
        }}
      >
        <span style={{ fontWeight: 500, color: 'var(--text)' }}>tweaks</span>
        <button onClick={() => setOpen(false)} style={{ color: 'var(--text-3)', lineHeight: 1 }}>
          <svg width={12} height={12} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      {/* body */}
      <div style={{ overflow: 'auto', padding: '10px 12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <TwSection label={t('tw.brand')} />
        {/* accent */}
        <TwRow label={t('tw.accent')}>
          <div style={{ display: 'flex', gap: 6 }}>
            {ACCENTS.map(a => (
              <button key={a} onClick={() => setTweak('accent', a)} style={{
                width: 22, height: 22, borderRadius: 3, background: tweaks.dark ? a : (ACCENT_LIGHT[a] || a),
                border: tweaks.accent === a ? '2px solid var(--text)' : '1px solid var(--border-strong)',
                cursor: 'pointer', flexShrink: 0,
              }} />
            ))}
          </div>
        </TwRow>
        {/* font pair */}
        <TwRow label={t('tw.fontpair')}>
          <select
            value={tweaks.fontPair}
            onChange={e => setTweak('fontPair', e.target.value)}
            style={{
              width: '100%', height: 24, fontSize: 11, fontFamily: 'var(--mono)',
              background: 'var(--surface-raised)', border: '1px solid var(--border-strong)',
              color: 'var(--text)', borderRadius: 3, padding: '0 6px',
            }}
          >
            {FONT_PAIRS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </TwRow>

        <TwSection label={t('tw.language')} />
        <TwSegmented
          value={tweaks.lang}
          options={[{ value: 'en', label: 'EN' }, { value: 'vi', label: 'VI' }]}
          onChange={v => setTweak('lang', v as TweakValues['lang'])}
        />

        <TwSection label={t('tw.layout')} />
        <TwRow label={t('tw.chrome')}>
          <TwSegmented
            value={tweaks.layout}
            options={[{ value: 'sidebar', label: 'sidebar' }, { value: 'top', label: 'top' }]}
            onChange={v => setTweak('layout', v as TweakValues['layout'])}
          />
        </TwRow>
        <TwRow label={t('tw.density')}>
          <TwSegmented
            value={tweaks.density}
            options={['compact', 'regular', 'comfy'].map(v => ({ value: v, label: v }))}
            onChange={v => setTweak('density', v as TweakValues['density'])}
          />
        </TwRow>
        <TwToggle label={t('tw.dark')} value={tweaks.dark} onChange={v => setTweak('dark', v)} />

        <TwSection label={t('tw.jump')} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {sectionKeys.map(k => (
            <button key={k} onClick={() => { onNavigate(k); setOpen(false); }} style={{
              padding: '3px 7px', fontSize: 10, fontFamily: 'var(--mono)', borderRadius: 2,
              background: section === k ? 'var(--accent)' : 'var(--surface-raised)',
              color: section === k ? '#0a0a0a' : 'var(--text-2)',
              border: '1px solid var(--border-strong)', cursor: 'pointer',
            }}>{sections[k].label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TwSection({ label }: { label: string }) {
  return <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', paddingTop: 2 }}>{label}</div>;
}

function TwRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{label}</div>
      {children}
    </div>
  );
}

function TwToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{label}</span>
      <button onClick={() => onChange(!value)} style={{
        position: 'relative', width: 32, height: 18, borderRadius: 9,
        background: value ? 'var(--accent)' : 'var(--border-strong)', border: 0,
        cursor: 'pointer', padding: 0, transition: 'background 0.15s',
      }}>
        <span style={{
          position: 'absolute', top: 2, left: value ? 14 : 2, width: 14, height: 14,
          borderRadius: '50%', background: '#fff', transition: 'left 0.15s',
        }} />
      </button>
    </div>
  );
}

interface SegOption { value: string; label: string; }
function TwSegmented({ value, options, onChange }: { value: string; options: SegOption[]; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', border: '1px solid var(--border-strong)', borderRadius: 3, overflow: 'hidden', background: 'var(--surface)' }}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)} style={{
          flex: 1, fontSize: 10, padding: '3px 6px', fontFamily: 'var(--mono)',
          background: value === o.value ? 'var(--surface-hover)' : 'transparent',
          color: value === o.value ? 'var(--text)' : 'var(--text-3)',
          borderRight: '1px solid var(--border)', cursor: 'pointer',
        }}>{o.label}</button>
      ))}
    </div>
  );
}
