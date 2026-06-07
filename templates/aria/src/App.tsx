import { useEffect, useMemo, useState } from 'react';
import type { HassEntity } from 'home-assistant-js-websocket';
import { useEntity, useService, useHistory } from '@/hooks';
import { TempChart } from '@/components/TempChart';
import { AppShell } from '@/components/AppShell';

/* ------------------------------------------------------------------ */
/*  Aria — a single-room glance dashboard for Home Assistant.          */
/*  Warm neutral, light-first, calm. One accent (amber clay).          */
/* ------------------------------------------------------------------ */

/** Parse an entity's numeric state, returning null when unusable. */
function numericState(e: HassEntity | undefined): number | null {
  if (!e) return null;
  if (e.state === 'unavailable' || e.state === 'unknown' || e.state === '') return null;
  const n = Number(e.state);
  return Number.isFinite(n) ? n : null;
}

/** True when an entity is present and not in an unusable state. */
function isReachable(e: HassEntity | undefined): boolean {
  return !!e && e.state !== 'unavailable' && e.state !== 'unknown';
}

/** A friendly name from attributes, falling back to a humanized id. */
function friendly(e: HassEntity | undefined, fallback: string): string {
  const name = e?.attributes?.friendly_name;
  return typeof name === 'string' && name.length > 0 ? name : fallback;
}

/** Greeting keyed to the hour of day. */
function greetingFor(hour: number): string {
  if (hour < 5) return 'Late night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 22) return 'Good evening';
  return 'Good night';
}

/* ------------------------------------------------------------------ */
/*  Clock — local time + date, updated each minute.                    */
/* ------------------------------------------------------------------ */

function useNow(): Date {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    // Tick on the minute boundary, then every minute after.
    let interval: ReturnType<typeof setInterval> | undefined;
    const msToNextMinute = 60_000 - (Date.now() % 60_000);
    const timeout = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), 60_000);
    }, msToNextMinute);
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, []);
  return now;
}

function Greeting() {
  const now = useNow();
  const hour = now.getHours();
  const time = useMemo(
    () =>
      now.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      }),
    [now],
  );
  const date = useMemo(
    () =>
      now.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    [now],
  );

  return (
    <header className="greeting">
      <div className="greeting__copy">
        <p className="greeting__eyebrow">{date}</p>
        <h1 className="greeting__title">{greetingFor(hour)}</h1>
      </div>
      <div className="greeting__clock" aria-label={`Current time ${time}`}>
        <span className="greeting__time">{time}</span>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Climate strip — temperature + humidity + climate setpoint.         */
/* ------------------------------------------------------------------ */

type ClimateProps = {
  tempId: string;
  humidityId: string;
  climateId: string;
};

function ClimateStrip({ tempId, humidityId, climateId }: ClimateProps) {
  const temp = useEntity(tempId);
  const humidity = useEntity(humidityId);
  const climate = useEntity(climateId);

  const tempVal = numericState(temp);
  const humVal = numericState(humidity);

  const tempUnit =
    (temp?.attributes?.unit_of_measurement as string | undefined) ?? '°';
  const humUnit =
    (humidity?.attributes?.unit_of_measurement as string | undefined) ?? '%';

  const setpoint =
    climate && typeof climate.attributes?.temperature === 'number'
      ? (climate.attributes.temperature as number)
      : null;
  const climateMode = isReachable(climate) ? climate!.state : null;

  return (
    <section className="climate" aria-label="Climate">
      <div className="climate__primary">
        <Thermometer value={tempVal} />
        <div className="climate__readout">
          <p className="climate__value">
            {tempVal !== null ? (
              <>
                {tempVal.toFixed(1)}
                <span className="climate__unit">{tempUnit}</span>
              </>
            ) : (
              <span className="climate__value--muted">--</span>
            )}
          </p>
          <p className="climate__label">{friendly(temp, 'Temperature')}</p>
        </div>
      </div>

      <dl className="climate__meta">
        <div className="climate__meta-row">
          <dt>
            <DropIcon /> Humidity
          </dt>
          <dd>{humVal !== null ? `${Math.round(humVal)}${humUnit}` : '--'}</dd>
        </div>
        {setpoint !== null && (
          <div className="climate__meta-row">
            <dt>
              <TargetIcon /> Target
            </dt>
            <dd>
              {setpoint.toFixed(0)}
              {tempUnit}
              {climateMode ? (
                <span className={`climate__mode climate__mode--${climateMode}`}>
                  {climateMode}
                </span>
              ) : null}
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}

/** A small filled-bulb thermometer whose fill tracks comfort range. */
function Thermometer({ value }: { value: number | null }) {
  // Map 14..30C onto 0..1 for the visual fill height.
  const ratio =
    value === null ? 0.5 : Math.max(0, Math.min(1, (value - 14) / (30 - 14)));
  const fillHeight = 46 * ratio;
  const y = 8 + (46 - fillHeight);

  return (
    <svg
      className="thermo"
      viewBox="0 0 28 72"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="10" y="6" width="8" height="50" rx="4" className="thermo__track" />
      <rect
        x="10"
        y={y}
        width="8"
        height={fillHeight}
        rx="4"
        className="thermo__fill"
      />
      <circle cx="14" cy="60" r="8" className="thermo__bulb" />
      <circle cx="14" cy="60" r="4.5" className="thermo__bulb-core" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Toggle row — lights & switches with live state.                    */
/* ------------------------------------------------------------------ */

type ToggleSpec = {
  entityId: string;
  label: string;
  icon: 'lamp' | 'kitchen' | 'coffee';
};

function ToggleTile({ spec }: { spec: ToggleSpec }) {
  const entity = useEntity(spec.entityId);
  const domain = spec.entityId.split('.')[0];
  const turnOn = useService(domain, 'turn_on');
  const turnOff = useService(domain, 'turn_off');

  const reachable = isReachable(entity);
  const isOn = entity?.state === 'on';
  const brightness =
    entity && typeof entity.attributes?.brightness === 'number'
      ? Math.round((entity.attributes.brightness / 255) * 100)
      : null;

  const onToggle = () => {
    if (!reachable) return;
    const data = { entity_id: spec.entityId };
    void (isOn ? turnOff(data) : turnOn(data));
  };

  return (
    <button
      type="button"
      className={`tile ${isOn ? 'tile--on' : ''} ${reachable ? '' : 'tile--off-grid'}`}
      onClick={onToggle}
      disabled={!reachable}
      aria-pressed={isOn}
      aria-label={`${friendly(entity, spec.label)}, ${
        reachable ? (isOn ? 'on' : 'off') : 'unavailable'
      }`}
    >
      <span className="tile__icon" aria-hidden="true">
        <ToggleGlyph icon={spec.icon} on={isOn} />
      </span>
      <span className="tile__text">
        <span className="tile__name">{friendly(entity, spec.label)}</span>
        <span className="tile__state">
          {!reachable
            ? 'Offline'
            : isOn
              ? brightness !== null
                ? `On · ${brightness}%`
                : 'On'
              : 'Off'}
        </span>
      </span>
      <span className={`tile__pip ${isOn ? 'tile__pip--on' : ''}`} aria-hidden="true" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Scene row.                                                          */
/* ------------------------------------------------------------------ */

type SceneSpec = { entityId: string; label: string; glyph: 'sun' | 'moon' };

function SceneRow({ scenes }: { scenes: SceneSpec[] }) {
  const activate = useService('scene', 'turn_on');
  const [pulsed, setPulsed] = useState<string | null>(null);

  const run = (id: string) => {
    void activate({ entity_id: id });
    setPulsed(id);
    window.setTimeout(() => setPulsed((p) => (p === id ? null : p)), 600);
  };

  return (
    <section className="scenes" aria-label="Scenes">
      <h2 className="section-heading">Scenes</h2>
      <div className="scenes__row">
        {scenes.map((s) => (
          <SceneChip
            key={s.entityId}
            spec={s}
            active={pulsed === s.entityId}
            onRun={() => run(s.entityId)}
          />
        ))}
      </div>
    </section>
  );
}

function SceneChip({
  spec,
  active,
  onRun,
}: {
  spec: SceneSpec;
  active: boolean;
  onRun: () => void;
}) {
  const entity = useEntity(spec.entityId);
  const exists = !!entity;
  return (
    <button
      type="button"
      className={`scene ${active ? 'scene--active' : ''}`}
      onClick={onRun}
      disabled={!exists}
      aria-label={`Activate scene ${friendly(entity, spec.label)}`}
    >
      <span className="scene__glyph" aria-hidden="true">
        {spec.glyph === 'sun' ? <SunIcon /> : <MoonIcon />}
      </span>
      <span className="scene__label">{friendly(entity, spec.label)}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  History card — 24h temperature.                                    */
/* ------------------------------------------------------------------ */

function HistoryCard({ entityId }: { entityId: string }) {
  const { data, loading, error } = useHistory(entityId, 24);

  return (
    <section className="history" aria-label="Temperature over the last 24 hours">
      <div className="history__head">
        <h2 className="section-heading">Last 24 hours</h2>
        {data.length > 1 && !error ? (
          <HistoryStat data={data} />
        ) : null}
      </div>
      <div className="history__plot">
        {error ? (
          <p className="history__msg">History unavailable</p>
        ) : loading ? (
          <p className="history__msg history__msg--loading">Reading history</p>
        ) : data.length < 2 ? (
          <p className="history__msg">Not enough data yet</p>
        ) : (
          <TempChart data={data} />
        )}
      </div>
    </section>
  );
}

function HistoryStat({ data }: { data: { t: number; v: number }[] }) {
  const values = data.map((d) => d.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const now = values[values.length - 1];
  return (
    <div className="history__stat">
      <span className="history__now">{now.toFixed(1)}&deg;</span>
      <span className="history__range">
        {min.toFixed(0)}&deg; / {max.toFixed(0)}&deg;
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Icons — authored inline SVG, single accent via currentColor.       */
/* ------------------------------------------------------------------ */

function ToggleGlyph({ icon, on }: { icon: ToggleSpec['icon']; on: boolean }) {
  if (icon === 'coffee') return <CoffeeIcon steam={on} />;
  if (icon === 'kitchen') return <KitchenLightIcon on={on} />;
  return <LampIcon on={on} />;
}

function LampIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" focusable="false">
      <path
        d="M7 10a5 5 0 0 1 10 0c0 2.2-1.3 3.4-2 4.3-.5.6-1 1.1-1 2.2H10c0-1.1-.5-1.6-1-2.2-.7-.9-2-2.1-2-4.3Z"
        className={on ? 'glyph-fill' : 'glyph-stroke'}
      />
      <path d="M10 19.5h4M10.5 21.5h3" className="glyph-stroke" />
      {on && (
        <g className="glyph-rays">
          <path d="M12 1.5v2M3.5 6l1.7 1M20.5 6l-1.7 1" className="glyph-stroke" />
        </g>
      )}
    </svg>
  );
}

function KitchenLightIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" focusable="false">
      <path d="M8 3h8l2 6H6l2-6Z" className={on ? 'glyph-fill' : 'glyph-stroke'} />
      <path d="M12 9v4" className="glyph-stroke" />
      <circle cx="12" cy="16" r="3" className={on ? 'glyph-fill' : 'glyph-stroke'} />
    </svg>
  );
}

function CoffeeIcon({ steam }: { steam: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" focusable="false">
      <path
        d="M5 9h12v4a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V9Z"
        className={steam ? 'glyph-fill' : 'glyph-stroke'}
      />
      <path d="M17 10h2a2.5 2.5 0 0 1 0 5h-2" className="glyph-stroke" />
      {steam && (
        <g className="glyph-steam">
          <path d="M8.5 3.5c-.7.8-.7 1.6 0 2.4M12 3c-.7.8-.7 1.6 0 2.4" className="glyph-stroke" />
        </g>
      )}
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" focusable="false">
      <circle cx="12" cy="12" r="4.2" className="glyph-fill" />
      <path
        d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"
        className="glyph-stroke"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" focusable="false">
      <path
        d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z"
        className="glyph-fill"
      />
    </svg>
  );
}

function DropIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" focusable="false" aria-hidden="true">
      <path
        d="M12 3.5c3 4 5 6.4 5 9a5 5 0 0 1-10 0c0-2.6 2-5 5-9Z"
        className="glyph-stroke"
      />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" focusable="false" aria-hidden="true">
      <circle cx="12" cy="12" r="7.5" className="glyph-stroke" />
      <circle cx="12" cy="12" r="2.2" className="glyph-fill" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  App shell.                                                          */
/* ------------------------------------------------------------------ */

const TOGGLES: ToggleSpec[] = [
  { entityId: 'light.living_room', label: 'Living room', icon: 'lamp' },
  { entityId: 'light.kitchen', label: 'Kitchen', icon: 'kitchen' },
  { entityId: 'switch.coffee', label: 'Coffee', icon: 'coffee' },
];

const SCENES: SceneSpec[] = [
  { entityId: 'scene.morning', label: 'Morning', glyph: 'sun' },
  { entityId: 'scene.evening', label: 'Evening', glyph: 'moon' },
];

export function App() {
  return (
    <AppShell stage="spread">
      <Greeting />
      <ClimateStrip
        tempId="sensor.living_room_temperature"
        humidityId="sensor.living_room_humidity"
        climateId="climate.living_room"
      />
      <HistoryCard entityId="sensor.living_room_temperature" />

      <section className="controls" aria-label="Lights and switches">
        <h2 className="section-heading">Room</h2>
        <div className="controls__grid gh-grid">
          {TOGGLES.map((t) => (
            <ToggleTile key={t.entityId} spec={t} />
          ))}
        </div>
      </section>

      <SceneRow scenes={SCENES} />

      <footer className="aria__foot">
        <span className="aria__dot" aria-hidden="true" />
        Aria
      </footer>
    </AppShell>
  );
}
