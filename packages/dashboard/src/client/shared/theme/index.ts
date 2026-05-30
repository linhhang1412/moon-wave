export const ACCENTS = ['#9eff7a', '#7dd3fc', '#f5b056', '#c4b5fd', '#ff8aa3'] as const;

export const ACCENT_LIGHT: Record<string, string> = {
  '#9eff7a': '#1f7a1f',
  '#7dd3fc': '#0369a1',
  '#f5b056': '#b45309',
  '#c4b5fd': '#6d28d9',
  '#ff8aa3': '#b91c4a',
};

export interface FontPair {
  id: string;
  label: string;
  mono: string;
  ui: string;
}

export const FONT_PAIRS: FontPair[] = [
  { id: 'jetbrains', label: 'JetBrains Mono', mono: 'JetBrains Mono', ui: 'Geist' },
  { id: 'ibm',       label: 'IBM Plex Mono',  mono: 'IBM Plex Mono',  ui: 'IBM Plex Sans' },
  { id: 'geist',     label: 'Geist Mono',     mono: 'Geist Mono',     ui: 'Geist' },
  { id: 'fira',      label: 'Fira Code',      mono: 'Fira Code',      ui: 'Inter' },
];
