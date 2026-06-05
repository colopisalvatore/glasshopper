import { useSyncExternalStore } from 'react';
import type { HassEntity } from 'home-assistant-js-websocket';
import { getEntity, onEntities } from '@/lib/haConnection';

/**
 * Subscribe to a single HA entity. Returns `undefined` until the entity is
 * known by the connection (or if it does not exist).
 */
export function useEntity(entityId: string): HassEntity | undefined {
  return useSyncExternalStore(
    (cb) => onEntities(() => cb()),
    () => getEntity(entityId),
    () => undefined,
  );
}
