import { useEffect, useState } from 'react';
import { connect, getConnectionStatus, getLastError } from '@/lib/haConnection';
import { useEntity, useService, useHistory, useArea, useTheme } from '@/hooks';

export default function App() {
  const [status, setStatus] = useState(getConnectionStatus());

  useEffect(() => {
    void connect();
    const id = window.setInterval(() => setStatus(getConnectionStatus()), 500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <main className="app">
      <header className="app__header">
        <h1>HA React UI — scaffold</h1>
        <span className={`status status--${status}`}>{status}</span>
      </header>

      {status === 'error' && (
        <p style={{ color: '#f87171', fontSize: 12 }}>{getLastError()}</p>
      )}

      <section className="app__grid">
        <SunCard />
        <FirstLightCard />
        <HistoryCard />
      </section>

      <AreaSection />
      <ThemeDebug />

      <footer className="app__footer">
        Replace this scaffold with your own UI. Hooks:{' '}
        <code>useEntity</code> <code>useService</code> <code>useHistory</code>{' '}
        <code>useArea</code> <code>useTheme</code>.
      </footer>
    </main>
  );
}

function SunCard() {
  const sun = useEntity('sun.sun');
  if (!sun) return <Card title="sun.sun">no data</Card>;
  return (
    <Card title="sun.sun">
      <div className="card__state">{sun.state}</div>
      <div className="card__meta">
        elev: {String(sun.attributes.elevation ?? '?')}
      </div>
    </Card>
  );
}

function FirstLightCard() {
  const light = useEntity('light.living_room');
  const turnOn = useService('light', 'turn_on');
  const turnOff = useService('light', 'turn_off');
  if (!light) return <Card title="light.living_room">entity not found</Card>;

  const isOn = light.state === 'on';
  return (
    <Card title="light.living_room">
      <div className="card__state">{light.state}</div>
      <button
        type="button"
        onClick={() =>
          void (isOn
            ? turnOff({ entity_id: light.entity_id })
            : turnOn({ entity_id: light.entity_id }))
        }
      >
        {isOn ? 'Turn off' : 'Turn on'}
      </button>
    </Card>
  );
}

function HistoryCard() {
  const { data, loading, error } = useHistory('sensor.outdoor_temperature', 24);
  return (
    <Card title="sensor.outdoor_temperature — 24h">
      {loading && <div className="card__meta">loading…</div>}
      {error && <div className="card__meta">err: {error}</div>}
      {!loading && !error && (
        <div className="card__meta">
          {data.length} points · min{' '}
          {data.length ? Math.min(...data.map((p) => p.v)).toFixed(1) : '—'} · max{' '}
          {data.length ? Math.max(...data.map((p) => p.v)).toFixed(1) : '—'}
        </div>
      )}
    </Card>
  );
}

function AreaSection() {
  const { area, entities, devices, loading, error } = useArea('Living Room');
  if (loading) return <p className="app__footer">area: loading…</p>;
  if (error) return <p className="app__footer">area err: {error}</p>;
  if (!area) return <p className="app__footer">area &quot;Living Room&quot; not found</p>;
  return (
    <section>
      <h2 style={{ fontSize: 14, margin: '0 0 8px' }}>
        Area: {area.name} ({devices.length} devices · {entities.length} entities)
      </h2>
      <div className="app__grid">
        {entities.slice(0, 6).map((e) => (
          <Card key={e.entity_id} title={e.entity_id}>
            <div className="card__state">{e.state}</div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function ThemeDebug() {
  const theme = useTheme();
  const keys = Object.keys(theme).slice(0, 4);
  if (keys.length === 0) return null;
  return (
    <details className="app__footer">
      <summary>HA theme tokens ({Object.keys(theme).length})</summary>
      <pre style={{ fontSize: 11, margin: '8px 0 0' }}>
        {keys.map((k) => `--${k}: ${theme[k]}`).join('\n')}
      </pre>
    </details>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="card">
      <h2 className="card__title">{title}</h2>
      {children}
    </article>
  );
}
