import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useEntity, useHistory } from '@/hooks';
import { Sparkline, type Point } from '@/components/Sparkline';
import { RadialGauge } from '@/components/RadialGauge';
import { AppShell } from '@/components/AppShell';

/**
 * Pulse — a quiet sensor + monitoring ops panel for Home Assistant.
 *
 * Data-focused dark. One cool accent. Tabular numerals everywhere readings
 * appear. Each tracked sensor shows a live value, an animated history
 * sparkline, and min / avg / peak over the window. A radial gauge anchors the
 * primary reading; an ops strip summarizes the whole board at a glance.
 *
 * Every entity read is guarded for undefined / unavailable / unknown.
 */

/* ------------------------------------------------------------------ */
/* Sensor model                                                        */
/* ------------------------------------------------------------------ */

type Accent = 'accent' | 'warm' | 'mute';

type SensorConfig = {
  id: string;
  label: string;
  /** Fallback unit if the entity does not report one. */
  unit: string;
  /** Decimal places for the live readout. */
  decimals: number;
  /** Gauge bounds for the bounded reading. */
  gauge?: { min: number; max: number; bands?: Band[] };
  accent?: Accent;
};

type Band = { upTo: number; name: string };

const SENSORS: SensorConfig[] = [
  {
    id: 'sensor.temperature',
    label: 'Temperature',
    unit: '°C',
    decimals: 1,
    gauge: {
      min: 10,
      max: 35,
      bands: [
        { upTo: 18, name: 'Cool' },
        { upTo: 24, name: 'Comfort' },
        { upTo: 28, name: 'Warm' },
        { upTo: Infinity, name: 'Hot' },
      ],
    },
    accent: 'accent',
  },
  {
    id: 'sensor.humidity',
    label: 'Humidity',
    unit: '%',
    decimals: 0,
    gauge: {
      min: 0,
      max: 100,
      bands: [
        { upTo: 30, name: 'Dry' },
        { upTo: 60, name: 'Ideal' },
        { upTo: Infinity, name: 'Humid' },
      ],
    },
    accent: 'accent',
  },
  {
    id: 'sensor.power',
    label: 'Power',
    unit: 'W',
    decimals: 0,
    accent: 'warm',
  },
  {
    id: 'sensor.co2',
    label: 'CO₂',
    unit: 'ppm',
    decimals: 0,
    gauge: {
      min: 400,
      max: 2000,
      bands: [
        { upTo: 800, name: 'Fresh' },
        { upTo: 1200, name: 'Fair' },
        { upTo: Infinity, name: 'Stuffy' },
      ],
    },
    accent: 'mute',
  },
  {
    id: 'sensor.pressure',
    label: 'Pressure',
    unit: 'hPa',
    decimals: 0,
    accent: 'mute',
  },
];

const HOURS_BACK = 24;

/* ------------------------------------------------------------------ */
/* Parsing + formatting helpers                                        */
/* ------------------------------------------------------------------ */

type Reading = { value: number | null; available: boolean };

function parseState(state: string | undefined): Reading {
  if (state === undefined) return { value: null, available: false };
  if (state === 'unavailable' || state === 'unknown') {
    return { value: null, available: false };
  }
  const n = Number(state);
  return Number.isFinite(n)
    ? { value: n, available: true }
    : { value: null, available: false };
}

function fmt(value: number | null, decimals: number): string {
  if (value === null) return '--';
  const factor = 10 ** decimals;
  return (Math.round(value * factor) / factor).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function bandFor(value: number | null, bands: Band[] | undefined): string | undefined {
  if (value === null || !bands) return undefined;
  for (const b of bands) {
    if (value <= b.upTo) return b.name;
  }
  return bands[bands.length - 1]?.name;
}

type Stats = { min: number; avg: number; peak: number } | null;

function statsOf(points: Point[]): Stats {
  if (points.length === 0) return null;
  let min = Infinity;
  let peak = -Infinity;
  let sum = 0;
  for (const p of points) {
    if (p.v < min) min = p.v;
    if (p.v > peak) peak = p.v;
    sum += p.v;
  }
  return { min, avg: sum / points.length, peak };
}

/** First-derivative direction of the recent tail, for the trend chip. */
type Trend = 'up' | 'down' | 'flat';

function trendOf(points: Point[]): Trend {
  if (points.length < 4) return 'flat';
  const tail = points.slice(-Math.max(3, Math.floor(points.length / 6)));
  const first = tail[0].v;
  const last = tail[tail.length - 1].v;
  const span = Math.abs(points[points.length - 1].v - points[0].v) || 1;
  const delta = last - first;
  if (Math.abs(delta) < span * 0.04) return 'flat';
  return delta > 0 ? 'up' : 'down';
}

/* ------------------------------------------------------------------ */
/* Iconography (inline, authored)                                      */
/* ------------------------------------------------------------------ */

function TrendGlyph({ dir }: { dir: Trend }): ReactNode {
  if (dir === 'flat') {
    return (
      <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden focusable="false">
        <path d="M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      </svg>
    );
  }
  const up = dir === 'up';
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden focusable="false">
      <path
        d={up ? 'M3 11l4-4 3 2 3-5' : 'M3 5l4 4 3-2 3 5'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d={up ? 'M11 4h3v3' : 'M11 12h3v-3'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

const TREND_WORD: Record<Trend, string> = {
  up: 'rising',
  down: 'falling',
  flat: 'steady',
};

/* ------------------------------------------------------------------ */
/* Stat readout (min / avg / peak)                                     */
/* ------------------------------------------------------------------ */

function StatRow({
  stats,
  decimals,
  unit,
}: {
  stats: Stats;
  decimals: number;
  unit: string;
}): ReactNode {
  const cells: { key: string; label: string; value: number | null }[] = [
    { key: 'min', label: 'Min', value: stats ? stats.min : null },
    { key: 'avg', label: 'Avg', value: stats ? stats.avg : null },
    { key: 'peak', label: 'Peak', value: stats ? stats.peak : null },
  ];
  return (
    <dl className="stats" aria-label={`Range over ${HOURS_BACK} hours`}>
      {cells.map((c) => (
        <div className="stat" key={c.key} data-kind={c.key}>
          <dt className="stat-label">{c.label}</dt>
          <dd className="stat-value tnum">
            {fmt(c.value, decimals)}
            <span className="stat-unit">{unit}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ------------------------------------------------------------------ */
/* Sensor card                                                         */
/* ------------------------------------------------------------------ */

function SensorCard({ config }: { config: SensorConfig }): ReactNode {
  const entity = useEntity(config.id);
  const history = useHistory(config.id, HOURS_BACK);

  const reading = parseState(entity?.state);
  const unit =
    (entity?.attributes?.['unit_of_measurement'] as string | undefined) ?? config.unit;

  const points = history.data;
  const stats = useMemo(() => statsOf(points), [points]);
  const trend = useMemo(() => trendOf(points), [points]);

  const accent = `var(--${config.accent ?? 'accent'})`;

  const statusLabel = reading.available
    ? `${fmt(reading.value, config.decimals)} ${unit}, ${TREND_WORD[trend]}`
    : 'unavailable';

  return (
    <article
      className="card"
      data-accent={config.accent ?? 'accent'}
      data-available={reading.available ? '' : undefined}
      aria-label={`${config.label}: ${statusLabel}`}
    >
      <header className="card-head">
        <h3 className="card-title">{config.label}</h3>
        {reading.available ? (
          <span className="trend" data-dir={trend} title={TREND_WORD[trend]}>
            <TrendGlyph dir={trend} />
            <span className="trend-word">{TREND_WORD[trend]}</span>
          </span>
        ) : (
          <span className="trend trend--off" title="No live data">
            <span className="dot-off" aria-hidden />
            <span className="trend-word">offline</span>
          </span>
        )}
      </header>

      <div className="card-readout">
        <span className="readout tnum" data-available={reading.available ? '' : undefined}>
          {fmt(reading.value, config.decimals)}
        </span>
        <span className="readout-unit">{unit}</span>
      </div>

      <div className="card-chart">
        {history.loading && points.length === 0 ? (
          <div className="chart-skeleton" aria-hidden />
        ) : history.error ? (
          <p className="chart-error" role="status">
            History unavailable
          </p>
        ) : (
          <Sparkline
            points={points}
            stroke={accent}
            label={`${config.label} over the last ${HOURS_BACK} hours`}
          />
        )}
      </div>

      <StatRow stats={stats} decimals={config.decimals} unit={unit} />
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Hero — primary gauge + its sparkline                                */
/* ------------------------------------------------------------------ */

function Hero({ config }: { config: SensorConfig }): ReactNode {
  const entity = useEntity(config.id);
  const history = useHistory(config.id, HOURS_BACK);
  const reading = parseState(entity?.state);
  const unit =
    (entity?.attributes?.['unit_of_measurement'] as string | undefined) ?? config.unit;

  const points = history.data;
  const stats = useMemo(() => statsOf(points), [points]);
  const trend = useMemo(() => trendOf(points), [points]);
  const band = bandFor(reading.value, config.gauge?.bands);

  const g = config.gauge ?? { min: 0, max: 100 };

  return (
    <section className="hero" aria-label={`${config.label} overview`}>
      <div className="hero-gauge">
        <RadialGauge
          value={reading.value}
          min={g.min}
          max={g.max}
          unit={unit}
          caption={band}
          label={config.label}
        />
      </div>

      <div className="hero-body">
        <div className="hero-heading">
          <h2 className="hero-title">{config.label}</h2>
          <span className="hero-trend" data-dir={trend}>
            <TrendGlyph dir={trend} />
            <span>{reading.available ? TREND_WORD[trend] : 'offline'}</span>
          </span>
        </div>

        <div className="hero-chart">
          {history.loading && points.length === 0 ? (
            <div className="chart-skeleton chart-skeleton--lg" aria-hidden />
          ) : (
            <Sparkline
              points={points}
              width={360}
              height={84}
              stroke="var(--accent)"
              label={`${config.label} trend over ${HOURS_BACK} hours`}
            />
          )}
        </div>

        <StatRow stats={stats} decimals={config.decimals} unit={unit} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Ops strip — quiet board summary                                     */
/* ------------------------------------------------------------------ */

function OpsProbe({
  config,
  onReport,
}: {
  config: SensorConfig;
  onReport: (id: string, available: boolean) => void;
}): ReactNode {
  const entity = useEntity(config.id);
  const reading = parseState(entity?.state);

  useEffect(() => {
    onReport(config.id, reading.available);
  }, [config.id, reading.available, onReport]);

  return null;
}

function OpsStrip({ total, online }: { total: number; online: number }): ReactNode {
  const allUp = online === total;
  const status = total === 0 ? 'idle' : allUp ? 'nominal' : 'degraded';

  return (
    <section className="ops" aria-label="System status">
      <span className="ops-state" data-status={status}>
        <span className="ops-pulse" aria-hidden />
        <span className="ops-state-text">
          {status === 'nominal'
            ? 'All sensors reporting'
            : status === 'degraded'
              ? 'Some sensors offline'
              : 'Awaiting sensors'}
        </span>
      </span>
      <span className="ops-count tnum" aria-label={`${online} of ${total} sensors online`}>
        <span className="ops-count-num">{online}</span>
        <span className="ops-count-sep">/</span>
        <span className="ops-count-den">{total}</span>
        <span className="ops-count-label">online</span>
      </span>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* App shell                                                           */
/* ------------------------------------------------------------------ */

export function App(): ReactNode {
  const [now, setNow] = useState(() => new Date());
  const [statusMap, setStatusMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const report = useMemo(
    () => (id: string, available: boolean) => {
      setStatusMap((prev) => {
        if (prev[id] === available) return prev;
        return { ...prev, [id]: available };
      });
    },
    [],
  );

  const online = useMemo(
    () => Object.values(statusMap).filter(Boolean).length,
    [statusMap],
  );

  const clock = useMemo(
    () =>
      now.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      }),
    [now],
  );

  const hero = SENSORS[0];
  const rest = SENSORS.slice(1);

  const topbar = (
    <>
      <div className="brand">
        <span className="brand-mark" aria-hidden>
          <svg viewBox="0 0 28 28" width="22" height="22" focusable="false">
            <path
              d="M2 14h5l2.5-8 4 18 3-13 2.5 6h6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div className="brand-text">
          <span className="brand-name">Pulse</span>
          <span className="brand-sub">Sensor monitor</span>
        </div>
      </div>
      <div className="topbar-right">
        <span className="window-chip" aria-label={`Window: last ${HOURS_BACK} hours`}>
          {HOURS_BACK}h window
        </span>
        <time className="clock tnum" aria-label={`Time ${clock}`}>
          {clock}
        </time>
      </div>
    </>
  );

  return (
    <AppShell topbar={topbar}>
      {/* Invisible probes keep the ops count live without re-rendering cards. */}
      <div className="probes" aria-hidden>
        {SENSORS.map((s) => (
          <OpsProbe key={s.id} config={s} onReport={report} />
        ))}
      </div>

      <Hero config={hero} />

      <OpsStrip total={SENSORS.length} online={online} />

      <section className="grid gh-grid" aria-label="Sensors">
        {rest.map((s) => (
          <SensorCard key={s.id} config={s} />
        ))}
      </section>

      <footer className="footer">
        <span className="footer-text">
          Readings refresh live. Range shown over the last {HOURS_BACK} hours.
        </span>
      </footer>
    </AppShell>
  );
}

export default App;
