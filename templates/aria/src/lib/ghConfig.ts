/**
 * Per-dashboard entity configuration for Glasshopper templates.
 *
 * A template declares its SLOTS — the logical roles its UI fills ("temperature",
 * "lights", ...). The user maps each slot to real Home Assistant entity ids via
 * the in-app setup wizard. The mapping is persisted per dashboard and read at
 * runtime, so a downloaded (already-compiled) template shows live data with no
 * source edit and no rebuild.
 *
 * Storage today is `localStorage`, namespaced by template id + dashboard slug.
 * Phase 2 swaps the {@link loadConfig}/{@link saveConfig} pair for HA storage
 * over the websocket bridge — without touching any template.
 */

export type SlotKind = 'single' | 'multi';

export type SlotDef = {
  /** Stable key, used in the saved config and in template code. */
  key: string;
  /** Human label shown in the wizard. */
  label: string;
  /** `single` = one entity id; `multi` = an ordered list. */
  kind: SlotKind;
  /** HA domains offered for this slot, e.g. `['light', 'switch']`. */
  domains: string[];
  /** One-line hint shown under the field. */
  help?: string;
  /** When true, the wizard blocks "Done" until this slot is filled. */
  required?: boolean;
};

export type GhManifest = {
  /** Template id — namespaces the saved config. */
  template: string;
  slots: SlotDef[];
};

/** Resolved mapping: slot key -> entity id (single) or ids (multi). */
export type GhConfig = Record<string, string | string[]>;

/** Persisted shape. `seen` tracks whether the user has dismissed/finished setup. */
export type StoredConfig = { v: 1; map: GhConfig; seen: boolean };

const EMPTY: StoredConfig = { v: 1, map: {}, seen: false };

/* ------------------------------------------------------------------ */
/*  Storage key — per template, per dashboard.                         */
/* ------------------------------------------------------------------ */

/**
 * The dashboard slug. In panel mode the iframe is served at one static URL per
 * template, so its own pathname can't tell two dashboards apart — but the
 * parent HA frame sits at `/<slug>` (same-origin, required by the bridge), so
 * we read the slug from there. Standalone mode (`/custom-dashboard/<slug>/`)
 * has no parent frame and falls back to its own path.
 */
function dashboardSlug(): string {
  try {
    const path =
      window.parent !== window
        ? window.parent.location.pathname
        : window.location.pathname;
    const segs = path.split('/').filter(Boolean);
    return segs[segs.length - 1] || 'default';
  } catch {
    // Cross-origin parent (should not happen — bridge needs same-origin).
    return 'default';
  }
}

function storageKey(template: string): string {
  return `gh:config:${template}:${dashboardSlug()}`;
}

/* ------------------------------------------------------------------ */
/*  Load / save — the only seam Phase 2 replaces with HA storage.      */
/* ------------------------------------------------------------------ */

export function loadConfig(template: string): StoredConfig {
  try {
    const raw = window.localStorage.getItem(storageKey(template));
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<StoredConfig>;
    if (parsed && parsed.v === 1 && parsed.map && typeof parsed.map === 'object') {
      return { v: 1, map: parsed.map, seen: Boolean(parsed.seen) };
    }
  } catch {
    /* unreadable / private mode — fall through to empty */
  }
  return { ...EMPTY };
}

export function saveConfig(template: string, stored: StoredConfig): void {
  try {
    window.localStorage.setItem(storageKey(template), JSON.stringify(stored));
  } catch {
    /* private mode / quota — config stays in memory only for this session */
  }
}

/* ------------------------------------------------------------------ */
/*  Resolution helpers — config value, else the demo fallback.         */
/* ------------------------------------------------------------------ */

/** A configured single id, or `fallback` when the slot was never set. */
export function resolveSingle(config: GhConfig, key: string, fallback: string): string {
  const v = config[key];
  return typeof v === 'string' && v.length > 0 ? v : fallback;
}

/**
 * A configured id list. Once the slot key exists (even as an empty array, i.e.
 * the user finished setup and chose none), it wins — so a configured dashboard
 * never falls back to demo entities. Only a never-touched slot uses `fallback`.
 */
export function resolveMulti(config: GhConfig, key: string, fallback: string[]): string[] {
  const v = config[key];
  if (Array.isArray(v)) return v;
  return fallback;
}

/** True when every required slot in the manifest is filled. */
export function isConfigured(config: GhConfig, manifest: GhManifest): boolean {
  return manifest.slots.every((s) => {
    if (!s.required) return true;
    const v = config[s.key];
    return s.kind === 'multi' ? Array.isArray(v) && v.length > 0 : typeof v === 'string' && v.length > 0;
  });
}

/** A readable fallback name from an entity id: `light.living_room` → `Living room`. */
export function humanize(entityId: string): string {
  const local = entityId.includes('.') ? entityId.slice(entityId.indexOf('.') + 1) : entityId;
  const words = local.replace(/_/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
