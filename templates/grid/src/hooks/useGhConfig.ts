import { useCallback, useEffect, useSyncExternalStore } from 'react';
import {
  dashboardSlug,
  loadConfig,
  loadRemote,
  saveConfig,
  saveRemote,
  type GhConfig,
  type GhManifest,
  type StoredConfig,
} from '@/lib/ghConfig';

/**
 * Live per-dashboard entity config. A save in the setup wizard updates every
 * subscriber (the dashboard re-renders against the new mapping immediately).
 *
 * The store is seeded synchronously from the localStorage cache for an instant
 * first paint, then reconciled once against Home Assistant storage (the synced
 * source of truth). Saves write through to both layers.
 *
 * A module-level store per template id keeps the snapshot reference stable for
 * `useSyncExternalStore` and lets the wizard and the dashboard share one source.
 */
type Store = { stored: StoredConfig; listeners: Set<() => void>; reconciled: boolean };

const stores = new Map<string, Store>();

function storeFor(template: string): Store {
  let s = stores.get(template);
  if (!s) {
    s = { stored: loadConfig(template), listeners: new Set(), reconciled: false };
    stores.set(template, s);
  }
  return s;
}

export type UseGhConfig = {
  /** Current slot -> entity id(s) mapping. */
  config: GhConfig;
  /** Whether the user has finished or dismissed setup. */
  seen: boolean;
  /** Persist a new mapping and mark setup seen. */
  setConfig: (config: GhConfig) => void;
  /** Mark setup dismissed without changing the mapping (the "Skip" path). */
  markSeen: () => void;
};

export function useGhConfig(manifest: GhManifest): UseGhConfig {
  const store = storeFor(manifest.template);

  const stored = useSyncExternalStore(
    (cb) => {
      store.listeners.add(cb);
      return () => store.listeners.delete(cb);
    },
    () => store.stored,
    () => store.stored,
  );

  const commit = useCallback(
    (next: StoredConfig) => {
      store.stored = next;
      saveConfig(manifest.template, next); // instant local cache
      void saveRemote(dashboardSlug(), next); // best-effort HA sync
      store.listeners.forEach((l) => l());
    },
    [store, manifest.template],
  );

  // Reconcile once against HA storage: adopt the remote mapping if present, or
  // migrate an existing local-only mapping up to HA.
  useEffect(() => {
    if (store.reconciled) return;
    store.reconciled = true;
    const slug = dashboardSlug();
    void (async () => {
      const remote = await loadRemote(slug);
      if (remote) {
        store.stored = remote;
        saveConfig(manifest.template, remote);
        store.listeners.forEach((l) => l());
      } else if (store.stored.seen && Object.keys(store.stored.map).length > 0) {
        void saveRemote(slug, store.stored);
      }
    })();
  }, [store, manifest.template]);

  const setConfig = useCallback(
    (config: GhConfig) => commit({ v: 1, map: config, seen: true }),
    [commit],
  );

  const markSeen = useCallback(() => {
    if (!store.stored.seen) commit({ ...store.stored, seen: true });
  }, [store, commit]);

  return { config: stored.map, seen: stored.seen, setConfig, markSeen };
}
