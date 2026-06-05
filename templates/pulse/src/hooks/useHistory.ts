import { useEffect, useState } from 'react';
import { fetchHistory } from '@/lib/haConnection';

export type HistoryPoint = { t: number; v: number };

export type UseHistoryResult = {
  data: HistoryPoint[];
  loading: boolean;
  error: string | null;
};

/**
 * Fetch the recent history (last `hoursBack` hours) of a numeric entity.
 * Re-fetches when `entityId` or `hoursBack` changes.
 */
export function useHistory(entityId: string, hoursBack = 24): UseHistoryResult {
  const [data, setData] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchHistory(entityId, hoursBack)
      .then((points) => {
        if (!cancelled) setData(points);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entityId, hoursBack]);

  return { data, loading, error };
}
