import { useEffect, useState } from 'react';
import { connect, getConnectionStatus, type ConnectionStatus } from '@/lib/haConnection';
import { useTheme } from '@/hooks';
import { AppShell } from '@/components/AppShell';

/**
 * Minimal — the free, bundled starter. It ships as a clean welcome canvas: it
 * confirms the Home Assistant connection and points you at the five hooks and
 * the docs. This is your blank slate — replace this file (src/App.tsx) with your
 * own UI. The hook usage examples live in the docs so a fresh install never
 * shows "entity not found" for example entities that aren't in your HA.
 */

const HOOKS = ['useEntity', 'useService', 'useHistory', 'useArea', 'useTheme'] as const;
const DOCS_URL = 'https://docs.glasshopper.dev';

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  idle: 'Connecting…',
  connecting: 'Connecting…',
  connected: 'Connected',
  disconnected: 'Disconnected',
  error: 'Connection error',
};

export function App() {
  const [status, setStatus] = useState<ConnectionStatus>(getConnectionStatus());
  const theme = useTheme();

  useEffect(() => {
    void connect();
    const id = window.setInterval(() => setStatus(getConnectionStatus()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // useTheme: if HA hands us a primary colour, let it tint the accent.
  useEffect(() => {
    const c = theme['primary-color'];
    const root = document.documentElement;
    if (c) root.style.setProperty('--accent', c);
    else root.style.removeProperty('--accent');
  }, [theme]);

  return (
    <AppShell stage="center">
      <section className="welcome" aria-label="Glasshopper">
        <div className="welcome__mark" aria-hidden>🦗</div>
        <h1 className="welcome__title">Glasshopper</h1>

        <p className="welcome__status">
          <span className={`dot dot--${status}`} aria-hidden /> {STATUS_LABEL[status]}
        </p>

        <p className="welcome__lead">Your blank canvas.</p>
        <p className="welcome__edit">
          Edit <code>src/App.tsx</code> and build your dashboard with five hooks:
        </p>

        <ul className="welcome__hooks">
          {HOOKS.map((h) => (
            <li key={h}><code>{h}</code></li>
          ))}
        </ul>

        <a className="welcome__cta" href={DOCS_URL} target="_blank" rel="noopener noreferrer">
          Read the docs →
        </a>
      </section>
    </AppShell>
  );
}

export default App;
