import { useState, useCallback } from 'react';
import type { TweakValues } from '../types';

const STORAGE_KEY = 'mw_tweaks';

const DEFAULTS: TweakValues = {
  accent: '#9eff7a',
  fontPair: 'jetbrains',
  density: 'regular',
  layout: 'sidebar',
  dark: true,
  lang: 'en',
};

function load(): TweakValues {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULTS };
}

function save(v: TweakValues): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)); } catch { /* ignore */ }
}

export function useTweaks(): [TweakValues, <K extends keyof TweakValues>(key: K, val: TweakValues[K]) => void] {
  const [values, setValues] = useState<TweakValues>(load);

  const setTweak = useCallback(<K extends keyof TweakValues>(key: K, val: TweakValues[K]) => {
    setValues(prev => {
      const next = { ...prev, [key]: val };
      save(next);
      return next;
    });
  }, []);

  return [values, setTweak];
}
