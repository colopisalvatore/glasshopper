import { useMemo, type JSX } from 'react';
import type { HassEntity } from 'home-assistant-js-websocket';
import { useEntity, useService } from '@/hooks';
import { AppShell } from '@/components/AppShell';
import { GridIcon, type IconName } from '@/components/GridIcons';

/* -------------------------------------------------------------------------- */
/*  Domain model                                                              */
/* -------------------------------------------------------------------------- */

/**
 * The Grid is a curated, static layout. We assume these entities exist but
 * guard every read: useEntity may return undefined, and state may be
 * 'unavailable' / 'unknown'. Grouping by area keeps a wall tablet legible.
 */
interface TileDef {
  readonly entityId: string;
  /** Optional override; otherwise the friendly_name attribute is used. */
  readonly label?: string;
}

interface GroupDef {
  readonly id: string;
  readonly title: string;
  readonly tiles: readonly TileDef[];
}

const GROUPS: readonly GroupDef[] = [
  {
    id: 'living',
    title: 'Living area',
    tiles: [
      { entityId: 'light.living_room', label: 'Living room' },
      { entityId: 'light.kitchen', label: 'Kitchen' },
      { entityId: 'switch.tv', label: 'TV' },
      { entityId: 'fan.bedroom', label: 'Bedroom fan' },
    ],
  },
  {
    id: 'comfort',
    title: 'Climate',
    tiles: [
      { entityId: 'sensor.temperature', label: 'Temperature' },
      { entityId: 'sensor.humidity', label: 'Humidity' },
      { entityId: 'climate.thermostat', label: 'Thermostat' },
    ],
  },
  {
    id: 'security',
    title: 'Doors & power',
    tiles: [
      { entityId: 'binary_sensor.front_door', label: 'Front door' },
      { entityId: 'switch.porch', label: 'Porch light' },
      { entityId: 'switch.coffee', label: 'Coffee maker' },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  State derivation                                                          */
/* -------------------------------------------------------------------------- */

type Availability = 'on' | 'off' | 'value' | 'unavailable';

interface DerivedTile {
  readonly icon: IconName;
  /** Primary line: friendly state ("On", "23.5 C", "Open"). */
  readonly primary: string;
  /** Secondary line: stable context ("Light", "Motion sensor"). */
  readonly secondary: string;
  readonly availability: Availability;
  /** Whether tapping the tile performs a toggle. */
  readonly toggleable: boolean;
}

function domainOf(entityId: string): string {
  const dot = entityId.indexOf('.');
  return dot === -1 ? entityId : entityId.slice(0, dot);
}

function titleCase(value: string): string {
  return value
    .replace(/[._]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const ACTIVE_BINARY = new Set(['on', 'open', 'detected', 'home', 'motion', 'unlocked', 'wet']);

/** True when the entity is present and reporting a usable state. */
function isLive(entity: HassEntity | undefined): entity is HassEntity {
  return (
    entity !== undefined &&
    entity.state !== 'unavailable' &&
    entity.state !== 'unknown' &&
    entity.state.length > 0
  );
}

function deviceClassOf(entity: HassEntity | undefined): string | undefined {
  const dc = entity?.attributes.device_class;
  return typeof dc === 'string' ? dc : undefined;
}

function iconForBinarySensor(deviceClass: string | undefined, active: boolean): IconName {
  switch (deviceClass) {
    case 'door':
    case 'garage_door':
    case 'opening':
      return active ? 'door-open' : 'door-closed';
    case 'window':
      return 'window';
    case 'motion':
    case 'occupancy':
    case 'presence':
      return 'motion';
    case 'lock':
      return active ? 'unlock' : 'lock';
    default:
      return 'motion';
  }
}

function pickSwitchIcon(entityId: string, deviceClass: string | undefined): IconName {
  if (deviceClass === 'outlet') return 'plug';
  if (/plug|outlet|coffee|tv|porch/.test(entityId)) return 'plug';
  return 'switch';
}

function trimNumber(n: number): string {
  // One decimal max, but drop a trailing ".0" so "23" reads cleaner than "23.0".
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function unitFor(entity: HassEntity, deviceClass: string | undefined): string {
  const unit = entity.attributes.unit_of_measurement;
  if (typeof unit === 'string' && unit.length > 0) return unit;
  if (deviceClass === 'humidity') return '%';
  return '';
}

/**
 * Collapse a raw HassEntity into everything a tile needs to render. Pure and
 * total: an undefined or unavailable entity yields a stable "unavailable" tile
 * whose icon still reflects the intended domain.
 */
function derive(def: TileDef, entity: HassEntity | undefined): DerivedTile {
  const domain = domainOf(def.entityId);
  const deviceClass = deviceClassOf(entity);
  const live = isLive(entity);

  if (domain === 'light' || domain === 'switch' || domain === 'fan') {
    const icon: IconName =
      domain === 'light' ? 'light' : domain === 'fan' ? 'fan' : pickSwitchIcon(def.entityId, deviceClass);
    const secondary = domain === 'fan' ? 'Fan' : domain === 'light' ? 'Light' : 'Switch';
    if (!live) {
      return { icon, primary: 'Unavailable', secondary, availability: 'unavailable', toggleable: false };
    }
    const on = entity.state === 'on';
    let primary = on ? 'On' : 'Off';
    const pct = entity.attributes.percentage;
    const brightness = entity.attributes.brightness;
    if (domain === 'fan' && on && typeof pct === 'number') {
      primary = `${Math.round(pct)}%`;
    } else if (domain === 'light' && on && typeof brightness === 'number') {
      primary = `${Math.round((brightness / 255) * 100)}%`;
    }
    return { icon, primary, secondary, availability: on ? 'on' : 'off', toggleable: true };
  }

  if (domain === 'binary_sensor') {
    const active = live && ACTIVE_BINARY.has(entity.state);
    const icon = iconForBinarySensor(deviceClass, active);
    const secondary = deviceClass ? `${titleCase(deviceClass)} sensor` : 'Sensor';
    if (!live) {
      return { icon, primary: 'Unavailable', secondary, availability: 'unavailable', toggleable: false };
    }
    const opening = deviceClass === 'door' || deviceClass === 'window' || deviceClass === 'opening';
    const primary = opening ? (active ? 'Open' : 'Closed') : active ? 'Detected' : 'Clear';
    return { icon, primary, secondary, availability: active ? 'on' : 'off', toggleable: false };
  }

  if (domain === 'sensor') {
    const icon: IconName =
      deviceClass === 'humidity' ? 'humidity' : deviceClass === 'power' ? 'power' : 'thermometer';
    const secondary = deviceClass ? titleCase(deviceClass) : 'Sensor';
    if (!live) {
      return { icon, primary: 'Unavailable', secondary, availability: 'unavailable', toggleable: false };
    }
    const num = Number(entity.state);
    const unit = unitFor(entity, deviceClass);
    const primary = Number.isFinite(num)
      ? `${trimNumber(num)}${unit ? ` ${unit}` : ''}`
      : titleCase(entity.state);
    return { icon, primary, secondary, availability: 'value', toggleable: false };
  }

  if (domain === 'climate') {
    const secondary = 'Thermostat';
    if (!live) {
      return { icon: 'climate', primary: 'Unavailable', secondary, availability: 'unavailable', toggleable: false };
    }
    const target = entity.attributes.temperature;
    const current = entity.attributes.current_temperature;
    const targetStr = typeof target === 'number' ? `${trimNumber(target)}°` : titleCase(entity.state);
    const currentStr = typeof current === 'number' ? ` · now ${trimNumber(current)}°` : '';
    const active = entity.state !== 'off';
    return {
      icon: 'climate',
      primary: `${targetStr}${currentStr}`,
      secondary: titleCase(entity.state),
      availability: active ? 'on' : 'off',
      toggleable: false,
    };
  }

  // Generic fallback for any other domain.
  const secondary = titleCase(domain);
  if (!live) {
    return { icon: 'unknown', primary: 'Unavailable', secondary, availability: 'unavailable', toggleable: false };
  }
  return { icon: 'unknown', primary: titleCase(entity.state), secondary, availability: 'value', toggleable: false };
}

/* -------------------------------------------------------------------------- */
/*  Tile                                                                      */
/* -------------------------------------------------------------------------- */

interface TileProps {
  readonly def: TileDef;
}

function Tile({ def }: TileProps): JSX.Element {
  const entity = useEntity(def.entityId);
  const tile = useMemo(() => derive(def, entity), [def, entity]);
  const toggle = useService('homeassistant', 'toggle');

  const friendly =
    typeof entity?.attributes.friendly_name === 'string' ? entity.attributes.friendly_name : undefined;
  const name = def.label ?? friendly ?? titleCase(def.entityId.slice(def.entityId.indexOf('.') + 1));

  const isOn = tile.availability === 'on';
  const interactive = tile.toggleable && tile.availability !== 'unavailable';
  const stateClass = `tile tile--${tile.availability}`;

  const body = (
    <>
      <span className="tile__topline">
        <span className="tile__iconwrap">
          <GridIcon name={tile.icon} className="tile__icon" />
        </span>
        {interactive ? (
          <span className={`tile__pip${isOn ? ' tile__pip--on' : ''}`} aria-hidden="true" />
        ) : null}
      </span>
      <span className="tile__name" title={name}>
        {name}
      </span>
      <span className="tile__state">{tile.primary}</span>
      <span className="tile__meta">{tile.secondary}</span>
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        className={`${stateClass} tile--button`}
        aria-pressed={isOn}
        onClick={() => void toggle({ entity_id: def.entityId })}
      >
        {body}
      </button>
    );
  }

  return (
    <div className={`${stateClass} tile--static`} role="group" aria-label={`${name}: ${tile.primary}`}>
      {body}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Summary strip                                                             */
/* -------------------------------------------------------------------------- */

const ALL_IDS: readonly string[] = GROUPS.flatMap((g) => g.tiles.map((t) => t.entityId));

function ActiveCount(): JSX.Element {
  // GROUPS is a module-level constant, so this list never changes length and
  // hook order stays stable across renders.
  const states = ALL_IDS.map((id) => useEntity(id)?.state);
  const onCount = states.filter((s) => s === 'on').length;
  const reporting = states.filter((s) => s !== undefined && s !== 'unavailable' && s !== 'unknown').length;

  return (
    <div className="summary" aria-live="polite">
      <span className="summary__count">{onCount}</span>
      <span className="summary__label">
        {onCount === 1 ? 'device on' : 'devices on'}
        <span className="summary__sub">{reporting} reporting</span>
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  App                                                                       */
/* -------------------------------------------------------------------------- */

export function App(): JSX.Element {
  const topbar = (
    <>
      <div className="topbar__title">
        <span className="brand-mark" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </span>
        <div className="topbar__heading">
          <h1>Grid</h1>
          <p>Every device, at a glance</p>
        </div>
      </div>
      <ActiveCount />
    </>
  );

  return (
    <AppShell topbar={topbar}>
      <div className="board gh-fill">
        {GROUPS.map((group) => (
          <section key={group.id} className="group" aria-labelledby={`group-${group.id}`}>
            <div className="group__header">
              <h2 id={`group-${group.id}`}>{group.title}</h2>
              <span className="group__rule" aria-hidden="true" />
              <span className="group__count">{group.tiles.length}</span>
            </div>
            <div className="group__grid gh-grid gh-grid--dense">
              {group.tiles.map((tile) => (
                <Tile key={tile.entityId} def={tile} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <footer className="footer">
        <span>Grid template</span>
        <span aria-hidden="true">·</span>
        <span>Tap a control tile to toggle</span>
      </footer>
    </AppShell>
  );
}
