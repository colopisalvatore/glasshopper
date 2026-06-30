import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import type { HassEntity } from 'home-assistant-js-websocket';
import { getEntities, getEntity, onEntities } from '@/lib/haConnection';

/** Friendly name, falling back to the entity id. */
function entityName(e: HassEntity | undefined, id: string): string {
  const n = e?.attributes?.friendly_name;
  return typeof n === 'string' && n.length > 0 ? n : id;
}

/** Live, domain-filtered, name-sorted entity list from the HA connection. */
function useEntitiesByDomain(domains: string[]): HassEntity[] {
  const all = useSyncExternalStore(
    (cb) => onEntities(() => cb()),
    getEntities,
    getEntities,
  );
  const key = domains.join(',');
  return useMemo(() => {
    const set = new Set(key.split(','));
    return Object.values(all)
      .filter((e) => set.has(e.entity_id.split('.')[0]))
      .sort((a, b) =>
        entityName(a, a.entity_id).localeCompare(entityName(b, b.entity_id)),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, key]);
}

/**
 * A searchable entity combobox. When a value is set it shows a removable chip;
 * otherwise a filter input over the live entity list for the slot's domains.
 */
export function EntityPicker({
  domains,
  value,
  onChange,
  autoFocus,
}: {
  domains: string[];
  value: string;
  onChange: (id: string) => void;
  autoFocus?: boolean;
}) {
  const entities = useEntitiesByDomain(domains);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = needle
      ? entities.filter(
          (e) =>
            e.entity_id.toLowerCase().includes(needle) ||
            entityName(e, e.entity_id).toLowerCase().includes(needle),
        )
      : entities;
    return list.slice(0, 60);
  }, [entities, q]);

  const pick = useCallback(
    (id: string) => {
      onChange(id);
      setQ('');
    },
    [onChange],
  );

  if (value) {
    const e = getEntity(value);
    return (
      <div className="gh-picker gh-picker--set">
        <span className="gh-picker__name">{entityName(e, value)}</span>
        <code className="gh-picker__id">{value}</code>
        <button
          type="button"
          className="gh-picker__clear"
          onClick={() => onChange('')}
          aria-label={`Clear ${value}`}
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div className="gh-picker">
      <input
        type="text"
        className="gh-picker__input"
        value={q}
        onChange={(ev) => setQ(ev.target.value)}
        placeholder={
          entities.length === 0
            ? 'Waiting for Home Assistant…'
            : `Search ${domains.join(' / ')} entities…`
        }
        autoFocus={autoFocus}
        aria-label="Search entities"
      />
      <ul className="gh-picker__list" role="listbox">
        {filtered.map((e) => (
          <li key={e.entity_id}>
            <button type="button" className="gh-picker__opt" onClick={() => pick(e.entity_id)}>
              <span className="gh-picker__opt-name">{entityName(e, e.entity_id)}</span>
              <code className="gh-picker__opt-id">{e.entity_id}</code>
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="gh-picker__empty">
            {entities.length === 0 ? 'No connection yet' : 'No matching entities'}
          </li>
        )}
      </ul>
    </div>
  );
}
