/**
 * Aria's entity slots — the single source of truth for what this dashboard maps.
 *
 * Drives the setup wizard, the runtime mapping (App.tsx), and the generated
 * README / wiki table. Add or rename a slot here and everything downstream
 * follows.
 */
import type { GhManifest } from '@/lib/ghConfig';

export const ARIA_MANIFEST: GhManifest = {
  template: 'aria',
  slots: [
    {
      key: 'temperature',
      label: 'Temperature',
      kind: 'single',
      domains: ['sensor'],
      help: 'The room temperature sensor shown big in the climate strip.',
      required: true,
    },
    {
      key: 'humidity',
      label: 'Humidity',
      kind: 'single',
      domains: ['sensor'],
      help: 'Optional. A humidity sensor for the climate strip.',
    },
    {
      key: 'thermostat',
      label: 'Thermostat',
      kind: 'single',
      domains: ['climate'],
      help: 'Optional. A climate entity — shows the target setpoint and mode.',
    },
    {
      key: 'history',
      label: '24h history',
      kind: 'single',
      domains: ['sensor'],
      help: 'Optional. The sensor plotted over 24 hours. Defaults to Temperature.',
    },
    {
      key: 'lights',
      label: 'Lights & switches',
      kind: 'multi',
      domains: ['light', 'switch'],
      help: 'The toggle tiles in the Room grid.',
    },
    {
      key: 'scenes',
      label: 'Scenes',
      kind: 'multi',
      domains: ['scene'],
      help: 'The scene buttons.',
    },
  ],
};

/**
 * Placeholder entity ids used ONLY before the user runs setup, so a fresh
 * install reads as a demo to customise rather than an empty screen. Once the
 * wizard saves, the user's mapping replaces these entirely.
 */
export const ARIA_DEMO = {
  temperature: 'sensor.living_room_temperature',
  humidity: 'sensor.living_room_humidity',
  thermostat: 'climate.living_room',
  lights: ['light.living_room', 'light.kitchen', 'switch.coffee'],
  scenes: ['scene.morning', 'scene.evening'],
} as const;

/** Demo entity ids used to detect a real (non-demo) HA — see App first-run. */
export const ARIA_DEMO_PROBE: string[] = [
  ARIA_DEMO.temperature,
  ...ARIA_DEMO.lights,
  ...ARIA_DEMO.scenes,
];
