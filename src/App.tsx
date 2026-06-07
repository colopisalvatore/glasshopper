import { useEffect, useState } from 'react';
import { connect, getConnectionStatus, getLastError } from '@/lib/haConnection';
import { useEntity, useService, useHistory, useArea, useTheme } from '@/hooks';
import { AppShell } from '@/components/AppShell';

/**
 * Minimal — the starter dashboard. It already fills a landscape wall tablet via
 * the shared <AppShell> + .gh-grid, and demonstrates all five hooks. Replace the
 * cards below with your own UI.
 */
export function App() {
  const [status, setStatus] = useState(getConnectionStatus());

  useEffect(() => {
    void connect();
    const id = window.setInterval(() => setStatus(getConnectionStatus()), 500);
    return () => window.clearInterval(id);
  }, []);

  const topbar = (
    <>
      <span className="brand">Glasshopper</span>
      <span className={`status status--${status}`}>{status}</span>
    </>
  );

  return (
    <AppShell topbar={topbar} stage="spread">
      {status === 'error' && <p className="err">{getLastError()}</p>}

      <section className="grid gh-grid" aria-label="Examples">
        <SunCard />
        <FirstLightCard />
        <HistoryCard />
      </section>

      <AreaSection />

      <footer className="hint">
        Replace this scaffold with your own UI. Hooks: <code>useEntity</code>{' '}
        <code>useService</code> <code>useHistory</code> <code>useArea</code>{' '}
        <code>useTheme</code>.
        <ThemeNote />
      </footer>
    </AppShell>
  );
}

export default App;

function SunCard() {
  const sun = useEntity('sun.sun');
  return (
    <article className="card">
      <h2 className="card__title">sun.sun</h2>
      {sun ? (
        <>
          <div className="card__state">{sun.state}</div>
          <div className="card__meta">elev: {String(sun.attributes.elevation ?? '?')}</div>
        </>
      ) : (
        <div className="card__meta">no data</div>
      )}
    </article>
  );
}

function FirstLightCard() {
  const light = useEntity('light.living_room');
  const turnOn = useService('light', 'turn_on');
  const turnOff = useService('light', 'turn_off');
  const isOn = light?.state === 'on';
  return (
    <article className={`card${isOn ? ' card--on' : ''}`}>
      <h2 className="card__title">light.living_room</h2>
      {light ? (
        <>
          <div className="card__state">{light.state}</div>
          <button
            type="button"
            className="card__btn"
            onClick={() =>
              void (isOn
                ? turnOff({ entity_id: light.entity_id })
                : turnOn({ entity_id: light.entity_id }))
            }
          >
            {isOn ? 'Turn off' : 'Turn on'}
          </button>
        </>
      ) : (
        <div className="card__meta">entity not found</div>
      )}
    </article>
  );
}

function HistoryCard() {
  const { data, loading, error } = useHistory('sensor.outdoor_temperature', 24);
  return (
    <article className="card">
      <h2 className="card__title">sensor.outdoor_temperature — 24h</h2>
      {loading ? (
        <div className="card__meta">loading…</div>
      ) : error ? (
        <div className="card__meta">err: {error}</div>
      ) : (
        <div className="card__meta">
          {data.length} points · min{' '}
          {data.length ? Math.min(...data.map((p) => p.v)).toFixed(1) : '—'} · max{' '}
          {data.length ? Math.max(...data.map((p) => p.v)).toFixed(1) : '—'}
        </div>
      )}
    </article>
  );
}

function AreaSection() {
  const { area, entities, devices, loading, error } = useArea('Living Room');
  if (loading) return <p className="hint">area: loading…</p>;
  if (error) return <p className="hint">area err: {error}</p>;
  if (!area) return <p className="hint">area “Living Room” not found</p>;
  return (
    <section aria-label={`Area ${area.name}`}>
      <h2 className="section-heading">
        Area: {area.name} ({devices.length} devices · {entities.length} entities)
      </h2>
      <div className="grid gh-grid">
        {entities.slice(0, 6).map((e) => (
          <article className="card" key={e.entity_id}>
            <h2 className="card__title">{e.entity_id}</h2>
            <div className="card__state">{e.state}</div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ThemeNote() {
  const theme = useTheme();
  const n = Object.keys(theme).length;
  if (n === 0) return null;
  return <span className="hint__theme"> · useTheme sees {n} HA tokens</span>;
}
