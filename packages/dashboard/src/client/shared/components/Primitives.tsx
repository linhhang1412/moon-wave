import type { ReactNode, CSSProperties } from 'react';

// ── Dot ──────────────────────────────────────────────────────────────────────
type DotKind = 'ok' | 'warn' | 'err' | 'info' | 'idle';
export function Dot({ kind = 'idle' }: { kind?: DotKind }) {
  return <span className={`dot ${kind}`} />;
}

// ── Pill ─────────────────────────────────────────────────────────────────────
type PillKind = 'ok' | 'warn' | 'err' | 'info' | 'violet' | 'subtle';
export function Pill({ kind, children }: { kind?: PillKind; children: ReactNode }) {
  return <span className={`pill${kind ? ' ' + kind : ''}`}>{children}</span>;
}

// ── Btn ──────────────────────────────────────────────────────────────────────
type BtnVariant = 'default' | 'primary' | 'ghost' | 'danger' | 'sm';
interface BtnProps {
  variant?: BtnVariant;
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  title?: string;
}
export function Btn({ variant, onClick, disabled, children, style, className, title }: BtnProps) {
  const cls = ['btn', variant === 'primary' ? 'primary' : variant === 'ghost' ? 'ghost' : variant === 'danger' ? 'danger' : variant === 'sm' ? 'sm' : ''].filter(Boolean).join(' ');
  return (
    <button className={[cls, className].filter(Boolean).join(' ')} onClick={onClick} disabled={disabled} style={style} title={title}>
      {children}
    </button>
  );
}

// ── Kbd ──────────────────────────────────────────────────────────────────────
export function Kbd({ children }: { children: ReactNode }) {
  return <span className="kbd">{children}</span>;
}

// ── Tag ──────────────────────────────────────────────────────────────────────
export function Tag({ children }: { children: ReactNode }) {
  return <span className="tag">{children}</span>;
}

// ── Spark (mini sparkline) ────────────────────────────────────────────────────
interface SparkProps { data: number[]; w?: number; h?: number; }
export function Spark({ data, w = 120, h = 24 }: SparkProps) {
  if (!data.length) return <svg width={w} height={h} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 2) - 1;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke="var(--accent-dim)" strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}
