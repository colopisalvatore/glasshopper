/**
 * Pulse's entity slots — one per tracked sensor. The single source of truth for
 * the setup wizard, the runtime mapping (App.tsx), and the generated README.
 *
 * Each sensor's display config (unit, gauge bands, accent) lives in App.tsx and
 * is fixed; only the entity behind each slot is user-mapped.
 */
import type { GhManifest } from '@/lib/ghConfig';

export const PULSE_MANIFEST: GhManifest = {
  template: 'pulse',
  slots: [
    {
      key: 'temperature',
      label: 'Temperature',
      kind: 'single',
      domains: ['sensor'],
      help: 'The hero gauge sensor.',
      required: true,
    },
    { key: 'humidity', label: 'Humidity', kind: 'single', domains: ['sensor'], help: 'Optional.' },
    { key: 'power', label: 'Power', kind: 'single', domains: ['sensor'], help: 'Optional.' },
    { key: 'co2', label: 'CO₂', kind: 'single', domains: ['sensor'], help: 'Optional.' },
    { key: 'pressure', label: 'Pressure', kind: 'single', domains: ['sensor'], help: 'Optional.' },
  ],
};

/** Placeholder ids used only before setup (demo state). */
export const PULSE_DEMO: Record<string, string> = {
  temperature: 'sensor.temperature',
  humidity: 'sensor.humidity',
  power: 'sensor.power',
  co2: 'sensor.co2',
  pressure: 'sensor.pressure',
};

/** Demo ids used to detect a real (non-demo) HA — see App first-run. */
export const PULSE_DEMO_PROBE: string[] = Object.values(PULSE_DEMO);
