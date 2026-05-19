# useEntity

Subscribe to a single Home Assistant entity. Re-renders whenever its state or
attributes change.

```tsx
import { useEntity } from '@/hooks';

const temperature = useEntity('sensor.kitchen_temperature');
// temperature?.state    -> "22.4"
// temperature?.attributes.unit_of_measurement  -> "°C"
```

## Signature

```ts
function useEntity(entityId: string): HassEntity | undefined;
```

`HassEntity` is the type from
[`home-assistant-js-websocket`](https://github.com/home-assistant/home-assistant-js-websocket).

| Field           | Type                       | Notes                                          |
| --------------- | -------------------------- | ---------------------------------------------- |
| `entity_id`     | `string`                   | Always equal to the argument.                  |
| `state`         | `string`                   | `'on'`, `'22.4'`, `'unavailable'`, etc.        |
| `attributes`    | `Record<string, unknown>`  | Domain-specific (e.g. `brightness`, `friendly_name`). |
| `last_changed`  | `string` (ISO 8601)        |                                                |
| `last_updated`  | `string` (ISO 8601)        |                                                |
| `context`       | `{ id, parent_id, user_id }` |                                              |

Returns `undefined` while the connection is still booting, or if the entity
doesn't exist.

## Patterns

### Defensive default

```tsx
const sun = useEntity('sun.sun');
const elevation = sun?.attributes.elevation ?? null;
```

### Multiple entities

```tsx
const temp = useEntity('sensor.temp');
const humidity = useEntity('sensor.humidity');
```

Each `useEntity` call subscribes independently. For groups of related entities
prefer [`useArea`](./useArea).

### Loading state

```tsx
if (!entity) return <Skeleton />;
```

### Detecting unavailability

```tsx
if (entity?.state === 'unavailable' || entity?.state === 'unknown') {
  return <Offline />;
}
```

## Implementation note

Uses `useSyncExternalStore` against the connection's entity stream — every
entity update broadcasts to all subscribed components, but React batches the
re-renders so a one-off entity change doesn't cascade.
