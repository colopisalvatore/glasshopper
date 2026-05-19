# useHistory

Fetch a numeric entity's recent values for charts.

```tsx
import { useHistory } from '@/hooks';

function Temperature() {
  const { data, loading, error } = useHistory('sensor.kitchen_temp', 24);
  if (loading) return <span>…</span>;
  if (error) return <span>err</span>;
  return <Chart points={data} />;
}
```

## Signature

```ts
function useHistory(entityId: string, hoursBack?: number): UseHistoryResult;

type UseHistoryResult = {
  data: HistoryPoint[];
  loading: boolean;
  error: string | null;
};

type HistoryPoint = {
  t: number;   // ms since epoch
  v: number;   // numeric state — non-numeric points are filtered out
};
```

Defaults to `hoursBack = 24`. Re-fetches when either argument changes.

## What it queries

Hits HA's REST endpoint `/api/history/period/<start>?filter_entity_id=<id>&end_time=<end>&minimal_response&no_attributes`.

Non-numeric states (`unavailable`, `unknown`, text states) are filtered out.

## Aggregation

`useHistory` returns raw points. For multi-day windows that would be too dense
to render, aggregate client-side:

```tsx
const { data } = useHistory('sensor.energy', 24 * 7);

// Bucket into hourly averages:
const hourly = useMemo(() => bucketByHour(data), [data]);
```

For very long ranges, prefer HA's `history/statistics_during_period`
WebSocket command directly — it returns pre-aggregated hourly/daily values
maintained by the recorder. (A `useStatistics` hook is on the roadmap.)

## Performance

- One call per `useHistory` invocation. Don't put it inside a tight loop.
- Cached at the network layer by HA (a few seconds). Don't poll faster than
  every ~30 s for the same entity.
- Cancellation is internal — unmount during fetch is safe.
