import { createContext, useContext } from 'react';
import type { SectionId } from './shared/types';
import type { Translator } from './shared/i18n';

export interface AppContextValue {
  section: SectionId;
  go: (section: SectionId, payload?: unknown) => void;
  payload: unknown;
  t: Translator;
  lang: 'en' | 'vi';
}

export const AppCtx = createContext<AppContextValue>({
  section: 'playground',
  go: () => {},
  payload: null,
  t: (k) => k,
  lang: 'en',
});

export const useApp = () => useContext(AppCtx);
