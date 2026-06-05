import { useEffect, useState } from 'react';
import { isPanelMode } from '@/lib/haConnection';

export type ThemeTokens = Record<string, string>;

const CORE_TOKENS = [
  'primary-color',
  'accent-color',
  'primary-background-color',
  'secondary-background-color',
  'card-background-color',
  'primary-text-color',
  'secondary-text-color',
  'disabled-text-color',
  'divider-color',
  'error-color',
  'warning-color',
  'success-color',
  'info-color',
  'state-icon-color',
  'state-icon-active-color',
  'sidebar-background-color',
  'sidebar-text-color',
  'sidebar-selected-text-color',
  'sidebar-selected-icon-color',
  'app-header-background-color',
  'app-header-text-color',
] as const;

function readTokens(): ThemeTokens {
  if (typeof document === 'undefined') return {};

  // In panel mode, theme lives on parent <html>. Cross-origin reads fall back
  // to local document.
  let host: HTMLElement | null = null;
  if (isPanelMode()) {
    try {
      host = window.parent?.document?.documentElement ?? null;
    } catch {
      host = null;
    }
  }
  host ??= document.documentElement;

  const cs = getComputedStyle(host);
  const tokens: ThemeTokens = {};
  for (const key of CORE_TOKENS) {
    const v = cs.getPropertyValue(`--${key}`).trim();
    if (v) tokens[key] = v;
  }
  return tokens;
}

/**
 * Snapshot of HA theme CSS custom properties.
 *
 * In panel mode reads from the parent HA frame so the dashboard reflects the
 * user's selected HA theme. In dev/standalone mode reads from the local
 * document — supply tokens via your own CSS to preview.
 */
export function useTheme(): ThemeTokens {
  const [tokens, setTokens] = useState<ThemeTokens>(() => readTokens());

  useEffect(() => {
    setTokens(readTokens());

    let host: HTMLElement | null = null;
    if (isPanelMode()) {
      try {
        host = window.parent?.document?.documentElement ?? null;
      } catch {
        host = null;
      }
    }
    host ??= document.documentElement;

    const observer = new MutationObserver(() => setTokens(readTokens()));
    observer.observe(host, {
      attributes: true,
      attributeFilter: ['style', 'class'],
    });
    return () => observer.disconnect();
  }, []);

  return tokens;
}
