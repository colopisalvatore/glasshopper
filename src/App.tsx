import { useEffect, useState } from 'react';
import { connect, getConnectionStatus } from '@/lib/haConnection';
import { useEntity } from '@/hooks/useEntity';
import { useService } from '@/hooks/useService';

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

      <section className="app__grid">
        <SunCard />
        <FirstLightCard />
      </section>

      <footer className="app__footer">
        <code>useEntity</code> / <code>useService</code> demo. Replace this with your own UI.
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
      <div className="card__meta">elev: {String(sun.attributes.elevation ?? '?')}</div>
    </Card>
  );
}

function FirstLightCard() {
  const lights = useEntity('light.living_room');
  const turnOn = useService('light', 'turn_on');
  const turnOff = useService('light', 'turn_off');
  if (!lights) return <Card title="light.living_room">entity not found</Card>;

  const isOn = lights.state === 'on';
  return (
    <Card title="light.living_room">
      <div className="card__state">{lights.state}</div>
      <button
        type="button"
        onClick={() => void (isOn ? turnOff({ entity_id: lights.entity_id }) : turnOn({ entity_id: lights.entity_id }))}
      >
        {isOn ? 'Turn off' : 'Turn on'}
      </button>
    </Card>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="card">
      <h2 className="card__title">{title}</h2>
      {children}
    </article>
  );
}
