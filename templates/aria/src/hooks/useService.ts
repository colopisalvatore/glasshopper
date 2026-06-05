import { useCallback } from 'react';
import { callHaService } from '@/lib/haConnection';

/**
 * Returns a stable callback that invokes the given HA service.
 * Pass `entity_id` and any service-specific data when calling it.
 *
 * @example
 *   const turnOn = useService('light', 'turn_on');
 *   await turnOn({ entity_id: 'light.kitchen', brightness_pct: 80 });
 */
export function useService(
  domain: string,
  service: string,
): (data?: Record<string, unknown>) => Promise<void> {
  return useCallback(
    (data?: Record<string, unknown>) => callHaService(domain, service, data),
    [domain, service],
  );
}
