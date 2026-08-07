import { useEffect, useMemo, useState, useSyncExternalStore, type JSX } from 'react';
import type { HassEntity } from 'home-assistant-js-websocket';
import { useEntity, useService, useGhConfig } from '@/hooks';
import { AppShell } from '@/components/AppShell';
import { GridIcon, type IconName } from '@/components/GridIcons';
import { SetupWizard } from '@/config/SetupWizard';
import { getEntities, onEntities } from '@/lib/haConnection';
import { humanize, resolveMulti, type GhConfig } from '@/lib/ghConfig';
import {
  GRID_DEMO,
  GRID_DEMO_PROBE,
  GRID_MANIFEST,
  RENDERABLE_DOMAINS,
  type RenderableDomain,
} from './slots';

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
  /** Optional override. Left unset, the tile shows the entity's Home Assistant
   *  friendly name — the name the user already curated in HA. */
  readonly label?: string;
}

interface GroupDef {
  readonly id: string;
  readonly title: string;
  readonly tiles: readonly TileDef[];
}

/** Build the board groups from the slot manifest + the user's mapping (demo
 *  ids until setup is done). Group order follows the manifest. */
function groupsFromConfig(config: GhConfig): readonly GroupDef[] {
  return GRID_MANIFEST.slots.map((slot) => ({
    id: slot.key,
    title: slot.label,
    // No label here: the tile prefers the entity's friendly_name and only
    // humanizes the id when Home Assistant offers no name.
    tiles: resolveMulti(config, slot.key, GRID_DEMO[slot.key] ?? []).map((id) => ({
      entityId: id,
    })),
  }));
}

/* -------------------------------------------------------------------------- */
/*  State derivation                                                          */
/* -------------------------------------------------------------------------- */

type Availability = 'on' | 'off' | 'value' | 'unavailable';

/**
 * How the tile is operated. `toggle` makes the whole tile a button; the domain
 * kinds render an inline control row instead (a tile-wide button may not nest
 * buttons). `none` is read-only.
 */
type ControlKind = 'none' | 'toggle' | 'cover' | 'lock' | 'media';

interface DerivedTile {
  readonly icon: IconName;
  /** Primary line: friendly state ("On", "23.5 C", "72% open"). */
  readonly primary: string;
  /** Secondary line: stable context ("Light", "Motion sensor"). */
  readonly secondary: string;
  readonly availability: Availability;
  /** Which controls the tile offers. */
  readonly control: ControlKind;
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

/** `cover` feature bits (HA core CoverEntityFeature). */
const COVER_FEATURE = { open: 1, close: 2, setPosition: 4, stop: 8 } as const;
/** `media_player` feature bits (HA core MediaPlayerEntityFeature). */
const MEDIA_FEATURE = { pause: 1, previous: 16, next: 32, play: 16384 } as const;

/**
 * The `supported_features` bitmask, or null when the integration publishes
 * none. Null means *unknown*, never "supports nothing" — a missing mask must
 * not silently strip every control off the tile (that is the failure this
 * template shipped with).
 */
function featureMask(entity: HassEntity | undefined): number | null {
  const f = entity?.attributes.supported_features;
  return typeof f === 'number' ? f : null;
}

/** True when `bit` is supported. An unknown mask falls back to `whenUnknown`. */
function supports(mask: number | null, bit: number, whenUnknown: boolean): boolean {
  return mask === null ? whenUnknown : (mask & bit) !== 0;
}

/** Cover travel, 0 = closed … 100 = fully open, or null when not reported. */
function coverPosition(entity: HassEntity | undefined): number | null {
  const p = entity?.attributes.current_position;
  return typeof p === 'number' ? Math.round(Math.min(100, Math.max(0, p))) : null;
}

function iconForCover(deviceClass: string | undefined, open: boolean): IconName {
  switch (deviceClass) {
    case 'door':
    case 'garage':
    case 'gate':
      return open ? 'door-open' : 'door-closed';
    case 'window':
      return 'window';
    default:
      return 'cover';
  }
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

/** What a deriver is handed. `entity` may be missing, unavailable or unknown,
 *  so every deriver re-checks liveness before touching the state. */
interface DeriveCtx {
  readonly def: TileDef;
  readonly entity: HassEntity | undefined;
  readonly domain: string;
  readonly deviceClass: string | undefined;
}

type Deriver = (ctx: DeriveCtx) => DerivedTile;

/** light / switch / fan — one tap toggles the whole tile. */
const deriveSwitchable: Deriver = ({ def, entity, domain, deviceClass }) => {
  const icon: IconName =
    domain === 'light' ? 'light' : domain === 'fan' ? 'fan' : pickSwitchIcon(def.entityId, deviceClass);
  const secondary = domain === 'fan' ? 'Fan' : domain === 'light' ? 'Light' : 'Switch';
  if (!isLive(entity)) {
    return { icon, primary: 'Unavailable', secondary, availability: 'unavailable', control: 'none' };
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
  return { icon, primary, secondary, availability: on ? 'on' : 'off', control: 'toggle' };
};

const deriveBinarySensor: Deriver = ({ entity, deviceClass }) => {
  const live = isLive(entity);
  const active = live && ACTIVE_BINARY.has(entity.state);
  const icon = iconForBinarySensor(deviceClass, active);
  const secondary = deviceClass ? `${titleCase(deviceClass)} sensor` : 'Sensor';
  if (!live) {
    return { icon, primary: 'Unavailable', secondary, availability: 'unavailable', control: 'none' };
  }
  const opening = deviceClass === 'door' || deviceClass === 'window' || deviceClass === 'opening';
  const primary = opening ? (active ? 'Open' : 'Closed') : active ? 'Detected' : 'Clear';
  return { icon, primary, secondary, availability: active ? 'on' : 'off', control: 'none' };
};

const deriveSensor: Deriver = ({ entity, deviceClass }) => {
  const icon: IconName =
    deviceClass === 'humidity' ? 'humidity' : deviceClass === 'power' ? 'power' : 'thermometer';
  const secondary = deviceClass ? titleCase(deviceClass) : 'Sensor';
  if (!isLive(entity)) {
    return { icon, primary: 'Unavailable', secondary, availability: 'unavailable', control: 'none' };
  }
  const num = Number(entity.state);
  const unit = unitFor(entity, deviceClass);
  const primary = Number.isFinite(num)
    ? `${trimNumber(num)}${unit ? ` ${unit}` : ''}`
    : titleCase(entity.state);
  return { icon, primary, secondary, availability: 'value', control: 'none' };
};

const deriveClimate: Deriver = ({ entity }) => {
  const secondary = 'Thermostat';
  if (!isLive(entity)) {
    return { icon: 'climate', primary: 'Unavailable', secondary, availability: 'unavailable', control: 'none' };
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
    control: 'none',
  };
};

const deriveCover: Deriver = ({ entity, deviceClass }) => {
  const secondary = deviceClass ? titleCase(deviceClass) : 'Cover';
  if (!isLive(entity)) {
    return {
      icon: iconForCover(deviceClass, false),
      primary: 'Unavailable',
      secondary,
      availability: 'unavailable',
      control: 'none',
    };
  }
  const pos = coverPosition(entity);
  const moving = entity.state === 'opening' || entity.state === 'closing';
  // A cover reports position OR just open/closed; treat any travel > 0 as open.
  const open = pos !== null ? pos > 0 : entity.state !== 'closed';
  const primary = moving
    ? `${entity.state === 'opening' ? 'Opening' : 'Closing'}${pos !== null ? ` · ${pos}%` : ''}`
    : pos === null || pos === 0 || pos === 100
      ? open
        ? 'Open'
        : 'Closed'
      : `${pos}% open`;
  return {
    icon: iconForCover(deviceClass, open),
    primary,
    secondary,
    availability: open ? 'on' : 'off',
    control: 'cover',
  };
};

const deriveLock: Deriver = ({ entity }) => {
  const secondary = 'Lock';
  if (!isLive(entity)) {
    return { icon: 'lock', primary: 'Unavailable', secondary, availability: 'unavailable', control: 'none' };
  }
  const locked = entity.state === 'locked';
  return {
    icon: locked ? 'lock' : 'unlock',
    primary: titleCase(entity.state),
    secondary,
    // Unlocked is the state worth noticing, so it carries the accent.
    availability: locked ? 'off' : 'on',
    control: 'lock',
  };
};

const deriveMediaPlayer: Deriver = ({ entity }) => {
  const secondary = 'Media player';
  if (!isLive(entity)) {
    return { icon: 'media', primary: 'Unavailable', secondary, availability: 'unavailable', control: 'none' };
  }
  const title = entity.attributes.media_title;
  const artist = entity.attributes.media_artist;
  const hasTitle = typeof title === 'string' && title.length > 0;
  const playing = entity.state === 'playing';
  const idle = entity.state === 'off' || entity.state === 'standby';
  return {
    icon: 'media',
    primary: hasTitle ? title : titleCase(entity.state),
    secondary: hasTitle
      ? typeof artist === 'string' && artist.length > 0
        ? artist
        : titleCase(entity.state)
      : secondary,
    availability: playing ? 'on' : 'off',
    // A player that is off has nothing to transport — tapping it powers it on.
    control: idle ? 'toggle' : 'media',
  };
};

/** Read-only last resort for a domain the board doesn't model. */
const deriveUnknown: Deriver = ({ entity, domain }) => {
  const secondary = titleCase(domain);
  if (!isLive(entity)) {
    return { icon: 'unknown', primary: 'Unavailable', secondary, availability: 'unavailable', control: 'none' };
  }
  return { icon: 'unknown', primary: titleCase(entity.state), secondary, availability: 'value', control: 'none' };
};

/**
 * The board's domain table. `Record<RenderableDomain, …>` is the guard that
 * keeps the wizard and the renderer in step: a domain listed in slots.ts with
 * no deriver here fails the type-check, and a deriver for a domain no slot
 * offers has to be added to RENDERABLE_DOMAINS to compile. Neither can drift
 * into a tile that shows a bare state and no controls.
 */
const DERIVERS: Record<RenderableDomain, Deriver> = {
  light: deriveSwitchable,
  switch: deriveSwitchable,
  fan: deriveSwitchable,
  binary_sensor: deriveBinarySensor,
  sensor: deriveSensor,
  climate: deriveClimate,
  cover: deriveCover,
  lock: deriveLock,
  media_player: deriveMediaPlayer,
};

function isRenderable(domain: string): domain is RenderableDomain {
  return (RENDERABLE_DOMAINS as readonly string[]).includes(domain);
}

/**
 * Collapse a raw HassEntity into everything a tile needs to render. Pure and
 * total: an undefined or unavailable entity yields a stable "unavailable" tile
 * whose icon still reflects the intended domain.
 */
function derive(def: TileDef, entity: HassEntity | undefined): DerivedTile {
  const domain = domainOf(def.entityId);
  const ctx: DeriveCtx = { def, entity, domain, deviceClass: deviceClassOf(entity) };
  return isRenderable(domain) ? DERIVERS[domain](ctx) : deriveUnknown(ctx);
}

/* -------------------------------------------------------------------------- */
/*  Tile                                                                      */
/* -------------------------------------------------------------------------- */

interface ControlProps {
  readonly entityId: string;
  readonly entity: HassEntity | undefined;
}

function CtrlButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  readonly icon: IconName;
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled?: boolean;
}): JSX.Element {
  return (
    <button type="button" className="tile__ctrl" aria-label={label} title={label} disabled={disabled} onClick={onClick}>
      <GridIcon name={icon} className="tile__ctrl-icon" />
    </button>
  );
}

const SLIDER_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown']);

/**
 * Open / stop / close, plus a travel slider when the cover reports a position.
 * The slider is optimistic while dragging and hands back to the entity's own
 * position once the command is sent, so a slow motor doesn't fight the thumb.
 */
function CoverControls({ entityId, entity }: ControlProps): JSX.Element {
  const openCover = useService('cover', 'open_cover');
  const closeCover = useService('cover', 'close_cover');
  const stopCover = useService('cover', 'stop_cover');
  const setPosition = useService('cover', 'set_cover_position');

  const mask = featureMask(entity);
  const position = coverPosition(entity);
  const [drag, setDrag] = useState<number | null>(null);
  const shown = drag ?? position ?? 0;

  const commit = (value: number) => {
    setDrag(null);
    void setPosition({ entity_id: entityId, position: value });
  };

  return (
    <div className="tile__controls">
      <div className="tile__ctrlrow">
        {supports(mask, COVER_FEATURE.open, true) && (
          <CtrlButton
            icon="chevron-up"
            label="Open"
            disabled={position === 100}
            onClick={() => void openCover({ entity_id: entityId })}
          />
        )}
        {supports(mask, COVER_FEATURE.stop, true) && (
          <CtrlButton icon="stop" label="Stop" onClick={() => void stopCover({ entity_id: entityId })} />
        )}
        {supports(mask, COVER_FEATURE.close, true) && (
          <CtrlButton
            icon="chevron-down"
            label="Close"
            disabled={position === 0}
            onClick={() => void closeCover({ entity_id: entityId })}
          />
        )}
      </div>
      {supports(mask, COVER_FEATURE.setPosition, position !== null) && (
        <input
          type="range"
          className="tile__slider"
          min={0}
          max={100}
          step={1}
          value={shown}
          aria-label="Position"
          aria-valuetext={`${shown}% open`}
          onChange={(e) => setDrag(Number(e.target.value))}
          onPointerUp={(e) => commit(Number((e.target as HTMLInputElement).value))}
          onKeyUp={(e) => {
            if (SLIDER_KEYS.has(e.key)) commit(Number((e.target as HTMLInputElement).value));
          }}
        />
      )}
    </div>
  );
}

/** Explicit lock / unlock — never a tap-to-toggle, so a stray tap can't unlock a door. */
function LockControls({ entityId, entity }: ControlProps): JSX.Element {
  const lock = useService('lock', 'lock');
  const unlock = useService('lock', 'unlock');

  const state = entity?.state;
  const locked = state === 'locked';
  const busy = state === 'locking' || state === 'unlocking';

  return (
    <div className="tile__controls">
      <div className="tile__ctrlrow">
        <button
          type="button"
          className="tile__ctrl tile__ctrl--wide"
          disabled={locked || busy}
          onClick={() => void lock({ entity_id: entityId })}
        >
          Lock
        </button>
        <button
          type="button"
          className="tile__ctrl tile__ctrl--wide"
          disabled={state === 'unlocked' || state === 'open' || busy}
          onClick={() => void unlock({ entity_id: entityId })}
        >
          Unlock
        </button>
      </div>
    </div>
  );
}

/** Transport controls. Prev/next only when advertised; play/pause is assumed. */
function MediaControls({ entityId, entity }: ControlProps): JSX.Element {
  const previous = useService('media_player', 'media_previous_track');
  const next = useService('media_player', 'media_next_track');
  const playPause = useService('media_player', 'media_play_pause');

  const mask = featureMask(entity);
  const playing = entity?.state === 'playing';

  return (
    <div className="tile__controls">
      <div className="tile__ctrlrow">
        {supports(mask, MEDIA_FEATURE.previous, false) && (
          <CtrlButton icon="prev" label="Previous track" onClick={() => void previous({ entity_id: entityId })} />
        )}
        {supports(mask, MEDIA_FEATURE.play | MEDIA_FEATURE.pause, true) && (
          <CtrlButton
            icon={playing ? 'pause' : 'play'}
            label={playing ? 'Pause' : 'Play'}
            onClick={() => void playPause({ entity_id: entityId })}
          />
        )}
        {supports(mask, MEDIA_FEATURE.next, false) && (
          <CtrlButton icon="next" label="Next track" onClick={() => void next({ entity_id: entityId })} />
        )}
      </div>
    </div>
  );
}

interface TileProps {
  readonly def: TileDef;
}

function Tile({ def }: TileProps): JSX.Element {
  const entity = useEntity(def.entityId);
  const tile = useMemo(() => derive(def, entity), [def, entity]);
  const toggle = useService('homeassistant', 'toggle');

  const friendly =
    typeof entity?.attributes.friendly_name === 'string' ? entity.attributes.friendly_name : undefined;
  const name = def.label ?? friendly ?? humanize(def.entityId);

  const isOn = tile.availability === 'on';
  const live = tile.availability !== 'unavailable';
  const stateClass = `tile tile--${tile.availability}`;

  const head = (
    <>
      <span className="tile__topline">
        <span className="tile__iconwrap">
          <GridIcon name={tile.icon} className="tile__icon" />
        </span>
        {live && tile.control !== 'none' ? (
          <span className={`tile__pip${isOn ? ' tile__pip--on' : ''}`} aria-hidden="true" />
        ) : null}
      </span>
      <span className="tile__name" title={name}>
        {name}
      </span>
      <span className="tile__state" title={tile.primary}>
        {tile.primary}
      </span>
    </>
  );
  const meta = <span className="tile__meta">{tile.secondary}</span>;

  if (tile.control === 'toggle' && live) {
    return (
      <button
        type="button"
        className={`${stateClass} tile--button`}
        aria-pressed={isOn}
        onClick={() => void toggle({ entity_id: def.entityId })}
      >
        {head}
        {meta}
      </button>
    );
  }

  // Domains with their own controls render a static shell: a tile-wide button
  // may not nest the control buttons.
  const controls = !live ? null : tile.control === 'cover' ? (
    <CoverControls entityId={def.entityId} entity={entity} />
  ) : tile.control === 'lock' ? (
    <LockControls entityId={def.entityId} entity={entity} />
  ) : tile.control === 'media' ? (
    <MediaControls entityId={def.entityId} entity={entity} />
  ) : null;

  return (
    <div
      className={`${stateClass} tile--static${controls ? ' tile--rich' : ''}`}
      role="group"
      aria-label={`${name}: ${tile.primary}`}
    >
      {head}
      {controls}
      {meta}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Summary strip                                                             */
/* -------------------------------------------------------------------------- */

/** Live snapshot of all entities — one subscription, so the count works with a
 *  config-driven (variable-length) id list without breaking the rules of hooks. */
function useAllEntities() {
  return useSyncExternalStore((cb) => onEntities(() => cb()), getEntities, getEntities);
}

/** States that read as "this device is doing something" across the domains the
 *  board renders — a cover at 40% or a playing speaker counts, same as a lamp. */
const ACTIVE_STATES = new Set(['on', 'open', 'opening', 'closing', 'playing', 'unlocked']);

function ActiveCount({ ids }: { ids: readonly string[] }): JSX.Element {
  const all = useAllEntities();
  const states = ids.map((id) => all[id]?.state);
  const onCount = states.filter((s) => s !== undefined && ACTIVE_STATES.has(s)).length;
  const reporting = states.filter((s) => s !== undefined && s !== 'unavailable' && s !== 'unknown').length;

  return (
    <div className="summary" aria-live="polite">
      <span className="summary__count">{onCount}</span>
      <span className="summary__label">
        {onCount === 1 ? 'device active' : 'devices active'}
        <span className="summary__sub">{reporting} reporting</span>
      </span>
    </div>
  );
}

/** True when a real HA is connected but none of the demo entities exist — an
 *  end user who still needs to map their own. Keeps the marketing demo clean. */
function useNeedsSetup(probe: string[]): boolean {
  const [needs, setNeeds] = useState(false);
  useEffect(() => {
    const sync = () => {
      const all = getEntities();
      const loaded = Object.keys(all).length > 0;
      const anyDemo = probe.some((id) => Boolean(all[id]));
      setNeeds(loaded && !anyDemo);
    };
    sync();
    return onEntities(sync);
  }, [probe]);
  return needs;
}

/* -------------------------------------------------------------------------- */
/*  App                                                                       */
/* -------------------------------------------------------------------------- */

export function App(): JSX.Element {
  const { config, seen, setConfig, markSeen } = useGhConfig(GRID_MANIFEST);
  const needsSetup = useNeedsSetup(GRID_DEMO_PROBE);
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    if (needsSetup && !seen) setWizardOpen(true);
  }, [needsSetup, seen]);

  const groups = useMemo(() => groupsFromConfig(config), [config]);
  const visibleGroups = groups.filter((g) => g.tiles.length > 0);
  const allIds = useMemo(() => visibleGroups.flatMap((g) => g.tiles.map((t) => t.entityId)), [visibleGroups]);

  const showGear = needsSetup || Object.keys(config).length > 0;

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
      <ActiveCount ids={allIds} />
    </>
  );

  return (
    <AppShell topbar={topbar}>
      <div className="board gh-fill">
        {visibleGroups.map((group) => (
          <section key={group.id} className="group" aria-labelledby={`group-${group.id}`}>
            <div className="group__header">
              <h2 id={`group-${group.id}`}>{group.title}</h2>
              <span className="group__rule" aria-hidden="true" />
              <span className="group__count">{group.tiles.length}</span>
            </div>
            <div className="group__grid gh-grid gh-grid--dense">
              {group.tiles.map((tile, i) => (
                <Tile key={`${tile.entityId}-${i}`} def={tile} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <footer className="footer">
        <span>Grid template</span>
        <span aria-hidden="true">·</span>
        <span>Tap a control tile to toggle · use the buttons on covers, locks and players</span>
      </footer>

      {showGear && (
        <button
          type="button"
          className="gh-config-btn"
          onClick={() => setWizardOpen(true)}
          aria-label="Configure entities"
        >
          <GridIcon name="switch" className="tile__icon" /> Entities
        </button>
      )}

      {wizardOpen && (
        <SetupWizard
          manifest={GRID_MANIFEST}
          config={config}
          onSave={(next: GhConfig) => {
            setConfig(next);
            setWizardOpen(false);
          }}
          onSkip={() => {
            markSeen();
            setWizardOpen(false);
          }}
        />
      )}
    </AppShell>
  );
}
