import type { SectionId } from '../../shared/types';

interface Props { section: SectionId; }

export default function ComingSoon({ section }: Props) {
  return (
    <div style={{
      padding: '18px 20px',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
        <span style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}>{section}</span>
        {' '}— coming soon
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', maxWidth: 420, lineHeight: 1.6 }}>
        This section is under construction. The UI shell and navigation are ready — the data layer will be wired up in a future release.
      </div>
    </div>
  );
}
