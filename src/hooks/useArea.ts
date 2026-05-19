import { useEffect, useState } from 'react';
import type { HassEntity } from 'home-assistant-js-websocket';
import {
  fetchAreaRegistry,
  fetchDeviceRegistry,
  fetchEntityRegistry,
  getEntities,
  onEntities,
  type AreaRegistryEntry,
  type DeviceRegistryEntry,
} from '@/lib/haConnection';

export type UseAreaResult = {
  area: AreaRegistryEntry | null;
  entities: HassEntity[];
  devices: DeviceRegistryEntry[];
  loading: boolean;
  error: string | null;
};

/**
 * Resolve entities + devices belonging to an HA area, by area_id or by name.
 * Subscribes to live entity state updates; area/device registry is fetched once.
 */
export function useArea(areaIdOrName: string): UseAreaResult {
  const [area, setArea] = useState<AreaRegistryEntry | null>(null);
  const [devices, setDevices] = useState<DeviceRegistryEntry[]>([]);
  const [entityIds, setEntityIds] = useState<Set<string>>(new Set());
  const [liveEntities, setLiveEntities] = useState<HassEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [areas, allDevices, allEntities] = await Promise.all([
          fetchAreaRegistry(),
          fetchDeviceRegistry(),
          fetchEntityRegistry(),
        ]);
        if (cancelled) return;

        const matched =
          areas.find((a) => a.area_id === areaIdOrName) ??
          areas.find(
            (a) => a.name.toLowerCase() === areaIdOrName.toLowerCase(),
          ) ??
          null;

        if (!matched) {
          setArea(null);
          setDevices([]);
          setEntityIds(new Set());
          setLoading(false);
          return;
        }

        const areaDevices = allDevices.filter(
          (d) => d.area_id === matched.area_id,
        );
        const deviceIds = new Set(areaDevices.map((d) => d.id));

        const ids = new Set<string>();
        for (const e of allEntities) {
          if (
            e.area_id === matched.area_id ||
            (e.device_id && deviceIds.has(e.device_id))
          ) {
            ids.add(e.entity_id);
          }
        }

        setArea(matched);
        setDevices(areaDevices);
        setEntityIds(ids);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [areaIdOrName]);

  useEffect(() => {
    const sync = () => {
      const all = getEntities();
      const next: HassEntity[] = [];
      for (const id of entityIds) {
        const e = all[id];
        if (e) next.push(e);
      }
      setLiveEntities(next);
    };
    sync();
    return onEntities(sync);
  }, [entityIds]);

  return { area, entities: liveEntities, devices, loading, error };
}
