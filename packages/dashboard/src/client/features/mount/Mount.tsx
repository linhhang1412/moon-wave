import { useState } from 'react';
import { useApp } from '../../AppContext';
import { Dot, Pill, Btn } from '../../shared/components/Primitives';
import Icon from '../../shared/components/Icon';

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    try { navigator.clipboard.writeText(text); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <Btn variant="sm" onClick={copy} style={{ position: 'absolute', top: 10, right: 10 }}>
      <Icon name={copied ? 'check' : 'copy'} size={11} />
      {copied ? ' copied' : ' copy'}
    </Btn>
  );
}

const MOUNT_SNIPPET = `import { Hono } from "hono";
import { dashboard } from "@moon-wave/dashboard";
import { myAgent } from "./features/chat/agent";

const app = new Hono<{ Bindings: Env }>();

app.post("/api/chat", async (c) => {
  return myAgent.handle(c.req.raw, c.env);
});

// 👇 mount dashboard — no extra deploy
app.route("/dashboard", dashboard({
  agents:   { myAgent },
  auth:     { token: env.DASHBOARD_TOKEN },
}));

export default app;`;

const WRANGLER_SNIPPET = `# wrangler.toml
name = "my-agent"
main = "src/index.ts"
compatibility_date = "2025-10-01"

[[kv_namespaces]]
binding = "SESSION_KV"
id      = "your-kv-id"

[vars]
DASHBOARD_ENABLED = "true"`;

const ENV_SNIPPET = `# .dev.vars (local dev)
DASHBOARD_TOKEN=mw_dev_local_token
GOOGLE_API_KEY=AIza...
GROQ_API_KEY=gsk_...`;

const VERIFY_SNIPPET = `curl -H "Authorization: Bearer $TOKEN" \\
     https://your-worker.workers.dev/dashboard/api/health
# → { "ok": true }`;

export default function Mount() {
  const { t, go } = useApp();
  const [step, setStep] = useState(0);

  const steps = [
    { n: 1, title: t('mnt.s1t'), desc: t('mnt.s1d') },
    { n: 2, title: t('mnt.s2t'), desc: t('mnt.s2d') },
    { n: 3, title: t('mnt.s3t'), desc: t('mnt.s3d') },
    { n: 4, title: t('mnt.s4t'), desc: t('mnt.s4d') },
  ];

  return (
    <div className="section-pad" style={{ maxWidth: 1100 }}>
      {/* hero */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {t('mnt.eyebrow')}
          </div>
          <h1 style={{ fontSize: 22, color: 'var(--text)', margin: '6px 0 8px', fontWeight: 500, letterSpacing: '-0.01em', fontFamily: 'var(--mono)' }}>
            {t('mnt.titlePre')} <span style={{ color: 'var(--accent)' }}>/dashboard</span> {t('mnt.titlePost')}
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 13, margin: 0, maxWidth: 720, lineHeight: 1.6 }}>
            {t('mnt.lead')}
          </p>
        </div>
        <div className="card" style={{ width: 240, flexShrink: 0 }}>
          <div className="card-head">
            <span className="ch-title">{t('mnt.yourWorker')}</span>
            <Dot kind="ok" />
          </div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11.5, color: 'var(--text-2)' }}>
            {[
              ['main', 'src/index.ts'],
              ['moon-wave', <span style={{ color: 'var(--accent)' }}>latest</span>],
            ].map(([k, v]) => (
              <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{k}</span><span style={{ color: 'var(--text)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* step strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        border: '1px solid var(--border)', borderRadius: 4, marginBottom: 20,
      }}>
        {steps.map((s, i) => (
          <div
            key={s.n}
            onClick={() => setStep(i)}
            style={{
              padding: '12px 16px',
              borderRight: i < 3 ? '1px solid var(--border)' : 0,
              cursor: 'pointer',
              background: step === i ? 'var(--surface-hover)' : 'var(--surface)',
              boxShadow: step === i ? 'inset 0 -2px 0 var(--accent)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-3)' }}>
              <span style={{
                width: 18, height: 18, borderRadius: '50%', display: 'inline-grid', placeItems: 'center',
                fontSize: 10, border: '1px solid',
                color: step >= i ? 'var(--accent)' : 'var(--text-3)',
                borderColor: step >= i ? 'var(--accent-dim)' : 'var(--border-strong)',
              }}>
                {step > i ? '✓' : s.n}
              </span>
              <span style={{ color: 'var(--text)' }}>{s.title}</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 4, paddingLeft: 26 }}>{s.desc}</div>
          </div>
        ))}
      </div>

      {/* step content */}
      {step === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16 }}>
          <div className="card">
            <div className="card-head">
              <span className="ch-title">{t('mnt.install')}</span>
              <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                <Pill kind="subtle">npm</Pill>
                <Pill kind="subtle">pnpm</Pill>
                <Pill kind="subtle">bun</Pill>
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <pre className="code" style={{ border: 0, borderRadius: 0 }}>
                {'$ '}<span className="tok-fn">npm install</span>{' '}<span className="tok-str">@moon-wave/dashboard</span>{`@latest\n\nadded 1 package in 1.2s`}
              </pre>
              <CopyBtn text="npm install @moon-wave/dashboard@latest" />
            </div>
          </div>
          <div className="card">
            <div className="card-head"><span className="ch-title">{t('mnt.requirements')}</span></div>
            <div style={{ padding: 14, fontSize: 12, color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['cloudflare workers', 'ok', t('mnt.required')],
                ['typescript', 'subtle', '5.0+'],
                ['hono / itty / std', 'ok', t('mnt.any')],
              ].map(([label, kind, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{label}</span>
                  <Pill kind={kind as 'ok' | 'subtle'}>{val}</Pill>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="card">
          <div className="card-head">
            <span className="ch-title">src/index.ts</span>
            <span style={{ color: 'var(--text-3)' }}>{t('mnt.mountHint')}</span>
            <span style={{ marginLeft: 'auto' }}><CopyBtn text={MOUNT_SNIPPET} /></span>
          </div>
          <div style={{ position: 'relative' }}>
            <pre className="code" style={{ border: 0, borderRadius: 0, padding: '16px 18px', fontSize: 12 }}>
              {MOUNT_SNIPPET.split('\n').map((line, i) => {
                if (line.startsWith('//')) return <><span key={i} className="tok-com">{line}</span>{'\n'}</>;
                if (line.includes('import')) return <><span key={i}><span className="tok-key">import</span>{line.replace('import', '')}</span>{'\n'}</>;
                return line + '\n';
              })}
            </pre>
          </div>
          <div className="card-foot">
            <Icon name="check" size={12} />
            <span>{t('mnt.footWorksA')} <code style={{ color: 'var(--text)' }}>fetch</code> {t('mnt.footWorksB')}</span>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid-2">
          <div className="card">
            <div className="card-head">
              <span className="ch-title">wrangler.toml</span>
              <span style={{ marginLeft: 'auto' }}><CopyBtn text={WRANGLER_SNIPPET} /></span>
            </div>
            <pre className="code" style={{ border: 0, borderRadius: 0, fontSize: 11.5 }}>{WRANGLER_SNIPPET}</pre>
          </div>
          <div className="card">
            <div className="card-head">
              <span className="ch-title">.dev.vars</span>
              <span style={{ color: 'var(--text-3)' }}>{t('mnt.local')}</span>
              <span style={{ marginLeft: 'auto' }}><CopyBtn text={ENV_SNIPPET} /></span>
            </div>
            <pre className="code" style={{ border: 0, borderRadius: 0, fontSize: 11.5 }}>{ENV_SNIPPET}</pre>
            <div className="card-foot">
              <Icon name="key" size={12} />
              <span>{t('mnt.forProd')} <code style={{ color: 'var(--text)' }}>wrangler secret put DASHBOARD_TOKEN</code></span>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
          <div className="card">
            <div className="card-head">
              <span className="ch-title">{t('mnt.verify')}</span>
              <span style={{ marginLeft: 'auto' }}><CopyBtn text={VERIFY_SNIPPET} /></span>
            </div>
            <pre className="code" style={{ border: 0, borderRadius: 0 }}>{VERIFY_SNIPPET}</pre>
            <div className="card-foot">
              <Dot kind="ok" />
              <span style={{ color: 'var(--accent)' }}>your-worker.workers.dev/dashboard</span>
              <span style={{ marginLeft: 'auto' }}>healthy</span>
            </div>
          </div>
          <div className="card">
            <div className="card-head"><span className="ch-title">{t('mnt.whatYouGet')}</span></div>
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, color: 'var(--text-2)' }}>
              {[
                ['Playground', t('mnt.wyd_playground')],
                ['Logs', t('mnt.wyd_logs')],
                ['Sessions', t('mnt.wyd_sessions')],
                ['Memory', t('mnt.wyd_memory')],
                ['Routes', t('mnt.wyd_routes')],
                [t('mnt.tracing'), t('mnt.wyd_tracing')],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <Icon name="check" size={12} />
                  <div>
                    <div style={{ color: 'var(--text)' }}>{k}</div>
                    <div style={{ color: 'var(--text-3)', fontSize: 11 }}>{v}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* nav buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
        <Btn variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
          {t('mnt.back')}
        </Btn>
        {step < 3
          ? <Btn variant="primary" onClick={() => setStep(step + 1)}>
              {t('mnt.next')} {steps[step + 1].title} →
            </Btn>
          : <Btn variant="primary" onClick={() => go('playground')}>{t('mnt.openPg')}</Btn>
        }
      </div>
    </div>
  );
}
