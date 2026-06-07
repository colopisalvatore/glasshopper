import { useEffect, useMemo, useState } from 'react';
import type { HassEntity } from 'home-assistant-js-websocket';
import { connect, getConnectionStatus } from '@/lib/haConnection';
import { useEntity, useService, useHistory, useArea, useTheme } from '@/hooks';
import { AppShell } from '@/components/AppShell';

/**
 * Minimal — the free, bundled dashboard. A clean, glanceable home view: a
 * greeting, a tidy grid of device tiles, a climate card and a scenes row. It is
 * intentionally restrained (one green accent, flat surfaces) — a solid free
 * starter, a step below the premium templates. Built on all five hooks.
 */

const DEVICES = [
  { id: 'light.living_room', name: 'Living room', icon: 'bulb' },
  { id: 'light.kitchen', name: 'Kitchen', icon: 'bulb' },
  { id: 'light.bedroom', name: 'Bedroom', icon: 'bulb' },
  { id: 'switch.coffee', name: 'Coffee', icon: 'plug' },
  { id: 'fan.bedroom', name: 'Fan', icon: 'fan' },
] as const;

const SCENES = [
  { id: 'scene.morning', name: 'Morning' },
  { id: 'scene.evening', name: 'Evening' },
] as const;

function greet(h: number): string {
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 22) return 'Good evening';
  return 'Good night';
}

function num(e: HassEntity | undefined): number | null {
  if (!e || e.state === 'unavailable' || e.state === 'unknown') return null;
  const n = Number(e.state);
  return Number.isFinite(n) ? n : null;
}

export function App() {
  const [status, setStatus] = useState(getConnectionStatus());
  const [now, setNow] = useState(() => new Date());
  const theme = useTheme();

  useEffect(() => {
    void connect();
    const s = window.setInterval(() => setStatus(getConnectionStatus()), 1000);
    const t = window.setInterval(() => setNow(new Date()), 30_000);
    return () => {
      window.clearInterval(s);
      window.clearInterval(t);
    };
  }, []);

  // useTheme: if HA hands us a primary colour, let it tint the accent.
  useEffect(() => {
    const c = theme['primary-color'];
    const root = document.documentElement;
    if (c) root.style.setProperty('--accent', c);
    else root.style.removeProperty('--accent');
  }, [theme]);

  const time = useMemo(
    () => now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    [now],
  );

  return (
    <AppShell
      stage="center"
      topbar={
        <>
          <div className="head">
            <span className="head__hi">{greet(now.getHours())}</span>
            <span className="head__sub">Home</span>
          </div>
          <div className="head__right">
            <time className="clock">{time}</time>
            <span className={`dot dot--${status}`} title={status} aria-label={status} />
          </div>
        </>
      }
    >
      <section className="tiles gh-grid" aria-label="Devices">
        {DEVICES.map((d) => (
          <DeviceTile key={d.id} {...d} />
        ))}
      </section>

      <section className="lower gh-grid" aria-label="Climate and scenes">
        <ClimateCard />
        <ScenesCard />
      </section>
    </AppShell>
  );
}

export default App;

function Icon({ name, on }: { name: string; on: boolean }) {
  const cls = on ? 'ico ico--on' : 'ico';
  if (name === 'plug')
    return (
      <svg viewBox="0 0 24 24" className={cls} aria-hidden>
        <path d="M9 3v6m6-6v6M6 9h12v2a6 6 0 0 1-12 0V9Zm6 8v4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  if (name === 'fan')
    return (
      <svg viewBox="0 0 24 24" className={cls} aria-hidden>
        <circle cx="12" cy="12" r="2" fill="currentColor" />
        <path d="M12 10c0-4 1-6 3-6s2 3-1 5m-2 3c4 0 6 1 6 3s-3 2-5-1m-1-2c0 4-1 6-3 6s-2-3 1-5m2-3c-4 0-6-1-6-3s3-2 5 1" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className={cls} aria-hidden>
      <path d="M9 18h6m-5 3h4M8 11a4 4 0 1 1 8 0c0 1.7-1 2.7-1.6 3.4-.4.5-.9 1-.9 1.6h-3c0-.6-.5-1.1-.9-1.6C9 13.7 8 12.7 8 11Z" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DeviceTile({ id, name, icon }: { id: string; name: string; icon: string }) {
  const e = useEntity(id);
  const domain = id.split('.')[0];
  const on = useService(domain, 'turn_on');
  const off = useService(domain, 'turn_off');
  const live = !!e && e.state !== 'unavailable' && e.state !== 'unknown';
  const isOn = e?.state === 'on';
  const bri =
    e && typeof e.attributes?.brightness === 'number'
      ? Math.round((e.attributes.brightness / 255) * 100)
      : null;

  return (
    <button
      type="button"
      className={`tile${isOn ? ' tile--on' : ''}`}
      disabled={!live}
      aria-pressed={isOn}
      onClick={() => void (isOn ? off({ entity_id: id }) : on({ entity_id: id }))}
    >
      <span className="tile__ico"><Icon name={icon} on={isOn} /></span>
      <span className="tile__name">{name}</span>
      <span className="tile__state">
        {!live ? 'Offline' : isOn ? (bri !== null ? `On · ${bri}%` : 'On') : 'Off'}
      </span>
    </button>
  );
}

function ClimateCard() {
  const temp = useEntity('sensor.living_room_temperature');
  const hum = useEntity('sensor.living_room_humidity');
  const { data } = useHistory('sensor.living_room_temperature', 24);
  const { area } = useArea('Living Room');

  const t = num(temp);
  const h = num(hum);
  const lo = data.length ? Math.min(...data.map((p) => p.v)) : null;
  const hi = data.length ? Math.max(...data.map((p) => p.v)) : null;

  return (
    <article className="climate">
      <span className="climate__label">{area?.name ?? 'Living room'}</span>
      <div className="climate__temp">
        {t !== null ? t.toFixed(1) : '--'}
        <span className="climate__deg">°</span>
      </div>
      <div className="climate__meta">
        <span>humidity {h !== null ? `${Math.round(h)}%` : '--'}</span>
        {lo !== null && hi !== null && (
          <span className="climate__range">24h {lo.toFixed(0)}° / {hi.toFixed(0)}°</span>
        )}
      </div>
    </article>
  );
}

function ScenesCard() {
  const activate = useService('scene', 'turn_on');
  const [fired, setFired] = useState<string | null>(null);
  const run = (id: string) => {
    void activate({ entity_id: id });
    setFired(id);
    window.setTimeout(() => setFired((p) => (p === id ? null : p)), 600);
  };
  return (
    <article className="scenes">
      <span className="scenes__label">Scenes</span>
      <div className="scenes__row">
        {SCENES.map((s) => (
          <SceneChip key={s.id} id={s.id} name={s.name} active={fired === s.id} onRun={() => run(s.id)} />
        ))}
      </div>
    </article>
  );
}

function SceneChip({ id, name, active, onRun }: { id: string; name: string; active: boolean; onRun: () => void }) {
  const e = useEntity(id);
  return (
    <button type="button" className={`chip${active ? ' chip--on' : ''}`} disabled={!e} onClick={onRun}>
      {name}
    </button>
  );
}
