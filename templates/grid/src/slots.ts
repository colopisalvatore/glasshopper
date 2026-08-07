/**
 * Grid's entity slots — one per board group. The single source of truth for
 * the setup wizard, the runtime mapping (App.tsx), and the generated README.
 */
import type { GhManifest, SlotDef } from '@/lib/ghConfig';

/**
 * The Home Assistant domains this board knows how to render.
 *
 * App.tsx keys its deriver table off this exact list, so the two can't drift:
 * a domain offered in a slot but missing here fails the type-check, and a
 * domain listed here without a deriver in App.tsx fails it too. Before this
 * existed, `cover`, `lock` and `media_player` were offered by the wizard and
 * rendered as dead, uncontrollable tiles.
 */
export const RENDERABLE_DOMAINS = [
  'light',
  'switch',
  'fan',
  'binary_sensor',
  'sensor',
  'climate',
  'cover',
  'lock',
  'media_player',
] as const;

export type RenderableDomain = (typeof RENDERABLE_DOMAINS)[number];

/** A slot may only offer domains the board can actually render. */
type GridSlot = Omit<SlotDef, 'domains'> & { domains: RenderableDomain[] };

const SLOTS: GridSlot[] = [
  {
    key: 'living',
    label: 'Living area',
    kind: 'multi',
    domains: ['light', 'switch', 'fan', 'media_player'],
    help: 'Controllable devices in the Living area group.',
  },
  {
    key: 'climate',
    label: 'Climate',
    kind: 'multi',
    domains: ['sensor', 'climate'],
    help: 'Temperature/humidity sensors and thermostats.',
  },
  {
    key: 'security',
    label: 'Doors & power',
    kind: 'multi',
    domains: ['binary_sensor', 'switch', 'lock', 'cover'],
    help: 'Doors, locks and power switches.',
  },
];

export const GRID_MANIFEST: GhManifest = {
  template: 'grid',
  slots: SLOTS,
};

/** Placeholder ids used only before the user runs setup (demo state). */
export const GRID_DEMO: Record<string, string[]> = {
  living: ['light.living_room', 'light.kitchen', 'switch.tv', 'fan.bedroom'],
  climate: ['sensor.temperature', 'sensor.humidity', 'climate.thermostat'],
  security: ['binary_sensor.front_door', 'switch.porch', 'switch.coffee'],
};

/** Demo ids used to detect a real (non-demo) HA — see App first-run. */
export const GRID_DEMO_PROBE: string[] = [
  ...GRID_DEMO.living,
  ...GRID_DEMO.climate,
  ...GRID_DEMO.security,
];
