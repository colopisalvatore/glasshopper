# useService

Build a stable callback that calls a Home Assistant service.

```tsx
import { useService } from '@/hooks';

const turnOn = useService('light', 'turn_on');

<button onClick={() => turnOn({ entity_id: 'light.kitchen', brightness_pct: 80 })}>
  On
</button>;
```

## Signature

```ts
function useService(
  domain: string,
  service: string,
): (data?: Record<string, unknown>) => Promise<void>;
```

The returned function is memoized on `[domain, service]` — safe to pass as a
prop or include in `useEffect` deps.

## Examples

### Toggle a switch

```tsx
const toggle = useService('switch', 'toggle');
await toggle({ entity_id: 'switch.coffee_machine' });
```

### Call a script

```tsx
const runGoodMorning = useService('script', 'good_morning');
await runGoodMorning();
```

### Trigger an automation

```tsx
const fireAlarm = useService('automation', 'trigger');
await fireAlarm({ entity_id: 'automation.front_door_alarm' });
```

### Set a climate temperature

```tsx
const setTemp = useService('climate', 'set_temperature');
await setTemp({ entity_id: 'climate.living_room', temperature: 21 });
```

## Error handling

The promise rejects if the connection is not yet established or HA returns an
error. Wrap in try/catch when the failure mode matters to the user:

```tsx
try {
  await turnOn({ entity_id: 'light.kitchen' });
} catch (err) {
  toast.error(`Failed: ${(err as Error).message}`);
}
```

## What service to call?

In HA: **Developer Tools → Services**. Pick a service, fill in entities and
data, and the panel shows you the exact YAML you'd write in an automation —
that maps 1:1 to `useService(domain, service)({ ...data })`.
