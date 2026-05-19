# useArea

Resolve all entities and devices belonging to an HA area.

```tsx
import { useArea } from '@/hooks';

function LivingRoom() {
  const { area, entities, devices, loading } = useArea('Living Room');
  if (loading) return <Skeleton />;
  if (!area) return <p>Area not found</p>;
  return (
    <>
      <h2>{area.name}</h2>
      <ul>
        {entities.map((e) => (
          <li key={e.entity_id}>{e.entity_id}: {e.state}</li>
        ))}
      </ul>
    </>
  );
}
```

## Signature

```ts
function useArea(areaIdOrName: string): UseAreaResult;

type UseAreaResult = {
  area: AreaRegistryEntry | null;
  entities: HassEntity[];
  devices: DeviceRegistryEntry[];
  loading: boolean;
  error: string | null;
};
```

The argument matches by `area_id` first, then by name (case-insensitive).

## What "belongs to" means

An entity is part of an area if **either**:

- Its `area_id` equals the area, **or**
- Its `device_id` is a device whose `area_id` equals the area.

This matches HA's own area resolution — moving a device's area moves all its
entities at once.

## Data freshness

- The area registry, device registry, and entity registry are fetched once
  per mount.
- Entity **state** updates live (subscribed to the same stream as
  `useEntity`).
- If areas / devices are reconfigured in HA, remount the component to pick
  up the change (or call your own re-fetch). The registries do not push.

## Example: tile grid per area

```tsx
const areas = ['Kitchen', 'Living Room', 'Bedroom'];

return areas.map((name) => {
  const { entities } = useArea(name);
  return (
    <section key={name}>
      <h3>{name}</h3>
      <Grid>
        {entities
          .filter((e) => e.entity_id.startsWith('light.'))
          .map((e) => <LightTile key={e.entity_id} entity={e} />)}
      </Grid>
    </section>
  );
});
```

Calling `useArea` per area is fine — each fetches the registries (cached at the
network layer) and filters locally.
