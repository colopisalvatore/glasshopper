import { useCallback, useSyncExternalStore } from 'react';
import {
  loadConfig,
  saveConfig,
  type GhConfig,
  type GhManifest,
  type StoredConfig,
} from '@/lib/ghConfig';

/**
 * Live per-dashboard entity config. A save in the setup wizard updates every
 * subscriber (the dashboard re-renders against the new mapping immediately).
 *
 * A module-level store per template id keeps the snapshot reference stable for
 * `useSyncExternalStore` and lets the wizard and the dashboard share one source.
 */
type Store = { stored: StoredConfig; listeners: Set<() => void> };

const stores = new Map<string, Store>();

function storeFor(template: string): Store {
  let s = stores.get(template);
  if (!s) {
    s = { stored: loadConfig(template), listeners: new Set() };
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
      saveConfig(manifest.template, next);
      store.listeners.forEach((l) => l());
    },
    [store, manifest.template],
  );

  const setConfig = useCallback(
    (config: GhConfig) => commit({ v: 1, map: config, seen: true }),
    [commit],
  );

  const markSeen = useCallback(() => {
    if (!store.stored.seen) commit({ ...store.stored, seen: true });
  }, [store, commit]);

  return { config: stored.map, seen: stored.seen, setConfig, markSeen };
}
