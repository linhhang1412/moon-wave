import { useState, useCallback, useEffect, type CSSProperties } from 'react';
import { AppCtx } from './AppContext';
import { useTweaks } from './shared/store/useTweaks';
import { makeTranslator } from './shared/i18n';
import { ACCENT_LIGHT, FONT_PAIRS } from './shared/theme';
import TweaksPanel from './shared/components/TweaksPanel';
import CommandBar from './shared/components/CommandBar';
import type { SectionId } from './shared/types';

// Feature views
import Playground from './features/playground/Playground';
import Agents from './features/agents/Agents';
import Mount from './features/mount/Mount';
import ComingSoon from './features/shared/ComingSoon';

// ── Sections registry ──────────────────────────────────────────────────────
const SECTIONS: Record<SectionId, { group: string; label: string; desc: string; num?: number; hideHead?: boolean }> = {
  mount:      { group: 'Develop',   label: 'Mount',             desc: 'attach /dashboard to your worker', hideHead: true },
  playground: { group: 'Develop',   label: 'Playground',        desc: 'chat with an agent · streaming',   hideHead: true },
  apiref:     { group: 'Develop',   label: 'API Reference',     desc: '8 endpoints',                      hideHead: true },
  overview:   { group: 'Observe',   label: 'Overview',          desc: 'live · last 60 min' },
  logs:       { group: 'Observe',   label: 'Logs',              desc: 'timeline grouped by request',      hideHead: true },
  sessions:   { group: 'Observe',   label: 'Sessions',          desc: 'active sessions',                  hideHead: true },
  errors:     { group: 'Observe',   label: 'Errors',            desc: 'grouped by signature',             hideHead: true },
  agents:     { group: 'Build',     label: 'Agents',            desc: 'registered agents',                hideHead: true },
  tools:      { group: 'Build',     label: 'Tools',             desc: 'tool registry · create & attach',  hideHead: true },
  mcp:        { group: 'Build',     label: 'MCP servers',       desc: 'connect external MCP tools',       hideHead: true },
  memory:     { group: 'Build',     label: 'Memory',            desc: 'KV · D1 · Vectorize · R2',         hideHead: true },
  workflows:  { group: 'Build',     label: 'Workflows',         desc: 'graph-based',                      hideHead: true },
  networks:   { group: 'Build',     label: 'Networks',          desc: 'multi-agent routing',              hideHead: true },
  channels:   { group: 'Build',     label: 'Channels',          desc: 'adapters' },
  rollouts:   { group: 'Operate',   label: 'Rollouts',          desc: 'prompt diff · A/B traffic split',  hideHead: true },
  evals:      { group: 'Operate',   label: 'Evals',             desc: 'dataset runs · provider A/B',      hideHead: true },
  cost:       { group: 'Operate',   label: 'Cost',              desc: 'attribution & budgets' },
  alerts:     { group: 'Operate',   label: 'Alerts',            desc: 'rules → webhook' },
  health:     { group: 'Operate',   label: 'Health',            desc: 'memory leak & anomaly detector' },
  audit:      { group: 'Operate',   label: 'Audit log',         desc: 'every mutating action' },
  routes:     { group: 'Configure', label: 'Routes & bindings', desc: 'resolved from src/index.ts',       hideHead: true },
  env:        { group: 'Configure', label: 'Environment',       desc: 'read-only',                        hideHead: true },
};

const GROUPS = ['Develop', 'Observe', 'Build', 'Operate', 'Configure'];

// ── Component map ──────────────────────────────────────────────────────────
function ViewFor({ section }: { section: SectionId }) {
  switch (section) {
    case 'playground': return <Playground />;
    case 'agents':     return <Agents />;
    case 'mount':      return <Mount />;
    default:           return <ComingSoon section={section} />;
  }
}

// ── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({ section, setSection, layout, t }: {
  section: SectionId;
  setSection: (s: SectionId) => void;
  layout: string;
  t: (k: string, fb?: string) => string;
}) {
  const groupedSections = GROUPS.map(g => ({
    group: g,
    items: Object.entries(SECTIONS).filter(([, m]) => m.group === g),
  }));

  if (layout === 'top') {
    return (
      <div className="side">
        {Object.entries(SECTIONS).map(([k, m]) => (
          <div
            key={k}
            className={`side-item${section === k ? ' active' : ''}`}
            onClick={() => setSection(k as SectionId)}
          >
            <span>{t('nav.' + k, m.label)}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="side">
      {groupedSections.map(({ group, items }) => (
        <div key={group}>
          <div className="side-group">{t('group.' + group, group)}</div>
          <div className="side-items">
            {items.map(([k, m]) => (
              <div
                key={k}
                className={`side-item${section === k ? ' active' : ''}`}
                onClick={() => setSection(k as SectionId)}
              >
                <span>{t('nav.' + k, m.label)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── TopBar ─────────────────────────────────────────────────────────────────
function TopBar({ section, dark, onToggleDark, lang, setLang, t }: {
  section: SectionId;
  dark: boolean;
  onToggleDark: () => void;
  lang: string;
  setLang: (l: 'en' | 'vi') => void;
  t: (k: string, fb?: string) => string;
}) {
  const meta = SECTIONS[section];
  return (
    <div className="topbar">
      <div className="brand">
        <span className="brand-logo">
          <svg width={14} height={14} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </span>
        <span className="brand-mark">moon-wave</span>
      </div>
      <div className="crumbs">
        <span className="text-3">worker</span>
        <span className="crumb-sep">/</span>
        <span>{t('nav.' + section, meta?.label ?? section)}</span>
      </div>
      <div className="topbar-spacer" />
      <div className="topbar-item">
        <span className="env-tag">production</span>
      </div>
      <div
        className="topbar-item btn"
        onClick={onToggleDark}
        title={t('tb.toggleTheme')}
        style={{ minWidth: 56, justifyContent: 'center' }}
      >
        {dark ? t('tb.dark') : t('tb.light')}
      </div>
      <div className="topbar-item" style={{ gap: 4 }}>
        {(['en', 'vi'] as const).map(l => (
          <button key={l} onClick={() => setLang(l)} style={{
            padding: '0 6px', height: '100%', fontSize: 10.5, fontFamily: 'var(--mono)',
            color: lang === l ? 'var(--text)' : 'var(--text-3)',
            fontWeight: lang === l ? 600 : 400,
            background: 'transparent', border: 0, cursor: 'pointer',
          }}>{l.toUpperCase()}</button>
        ))}
      </div>
    </div>
  );
}

// ── StatusBar ──────────────────────────────────────────────────────────────
function StatusBar({ t }: { t: (k: string, fb?: string) => string }) {
  return (
    <div className="statusbar">
      <div className="sb-item">
        <span className="dot ok" />
        <span>{t('sb.connected')}</span>
      </div>
      <div className="sb-item">
        <span className="text-3">edge</span>
      </div>
      <div className="sb-spacer" />
      <div className="sb-right">
        <div className="sb-item">
          <span className="text-3">⌘K</span>
          <span>{t('sb.command')}</span>
        </div>
        <div className="sb-item">
          <span className="text-3">⌘.</span>
          <span>tweaks</span>
        </div>
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [tweaks, setTweak] = useTweaks();
  const [section, setSection] = useState<SectionId>('playground');
  const [payload, setPayload] = useState<unknown>(null);
  const [cmdOpen, setCmdOpen] = useState(false);

  const t = makeTranslator(tweaks.lang as 'en' | 'vi');

  const go = useCallback((s: SectionId, p: unknown = null) => {
    setSection(s);
    setPayload(p);
  }, []);

  // Apply theme to <html>
  useEffect(() => {
    const pair = FONT_PAIRS.find(p => p.id === tweaks.fontPair) || FONT_PAIRS[0];
    const effAccent = tweaks.dark ? tweaks.accent : (ACCENT_LIGHT[tweaks.accent] || tweaks.accent);
    const root = document.documentElement;
    root.style.setProperty('--accent', effAccent);
    root.style.setProperty('--mono', `'${pair.mono}', ui-monospace, Menlo, monospace`);
    root.style.setProperty('--ui', `'${pair.ui}', system-ui, sans-serif`);
  }, [tweaks.accent, tweaks.fontPair, tweaks.dark]);

  // Apply dark/light class
  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', !tweaks.dark);
  }, [tweaks.dark]);

  // Apply density
  useEffect(() => {
    document.documentElement.className = document.documentElement.className
      .replace(/\bdensity-\w+\b/g, '')
      .trim() + ' density-' + tweaks.density;
  }, [tweaks.density]);

  // Keyboard shortcuts
  useEffect(() => {
    const sectionKeys = Object.keys(SECTIONS) as SectionId[];
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(o => !o); }
      if (e.key === 'Escape') setCmdOpen(false);
      if ((e.metaKey || e.ctrlKey) && /^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (sectionKeys[idx]) { e.preventDefault(); go(sectionKeys[idx]); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const meta = SECTIONS[section];

  const shellStyle: CSSProperties = {
    '--accent': tweaks.accent,
  } as CSSProperties;

  return (
    <AppCtx.Provider value={{ section, go, payload, t, lang: tweaks.lang as 'en' | 'vi' }}>
      <div
        className={`shell layout-${tweaks.layout} density-${tweaks.density}`}
        style={shellStyle}
      >
        <TopBar
          section={section}
          dark={tweaks.dark}
          onToggleDark={() => setTweak('dark', !tweaks.dark)}
          lang={tweaks.lang}
          setLang={l => setTweak('lang', l)}
          t={t}
        />
        <Sidebar section={section} setSection={s => go(s)} layout={tweaks.layout} t={t} />

        <div className="main">
          {!meta?.hideHead && (
            <div className="main-head">
              <span className="mh-title">{t('nav.' + section, meta?.label ?? section)}</span>
              <span className="mh-desc">· {t('desc.' + section, meta?.desc ?? '')}</span>
              <div className="mh-spacer" />
            </div>
          )}
          <div className="main-body" key={section}>
            <ViewFor section={section} />
          </div>
        </div>

        <StatusBar t={t} />

        <TweaksPanel
          tweaks={tweaks}
          setTweak={setTweak}
          section={section}
          onNavigate={go}
          t={t}
          sections={Object.fromEntries(Object.entries(SECTIONS).map(([k, v]) => [k, { label: t('nav.' + k, v.label) }]))}
        />

        {cmdOpen && (
          <CommandBar
            sections={Object.fromEntries(
              Object.entries(SECTIONS).map(([k, v]) => [k, { label: t('nav.' + k, v.label), desc: t('desc.' + k, v.desc) }])
            )}
            onNavigate={go}
            onClose={() => setCmdOpen(false)}
            t={t}
          />
        )}
      </div>
    </AppCtx.Provider>
  );
}
