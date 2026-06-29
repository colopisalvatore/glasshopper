import { useEffect, useState } from 'react';
import { getEntities, onEntities } from '@/lib/haConnection';

/**
 * A dismissible notice shown when none of this dashboard's example entities
 * exist in the connected Home Assistant — so a fresh install reads as a demo to
 * customize, not as broken/empty. Layout-agnostic fixed overlay.
 */
export function DemoBanner({ probe }: { probe: string[] }) {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const sync = () => {
      const all = getEntities();
      const loaded = Object.keys(all).length > 0;
      const anyMine = probe.some((id) => Boolean(all[id]));
      setShow(loaded && !anyMine);
    };
    sync();
    return onEntities(sync);
  }, [probe]);

  if (dismissed || !show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        insetInline: 0,
        top: 0,
        zIndex: 9999,
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        padding: '9px 16px',
        background: 'oklch(80% 0.16 156 / 0.16)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: '1px solid oklch(80% 0.16 156 / 0.35)',
        color: 'var(--ink, #e8eef0)',
        font: '500 13px/1.4 system-ui, -apple-system, sans-serif',
        textAlign: 'center',
      }}
    >
      <span>
        Demo dashboard — these cards use example entities not in your Home
        Assistant. Edit the entity ids in <code>src/App.tsx</code> to use your own.
      </span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        style={{
          flex: 'none',
          padding: '4px 12px',
          borderRadius: '999px',
          border: '1px solid oklch(80% 0.16 156 / 0.4)',
          background: 'transparent',
          color: 'inherit',
          cursor: 'pointer',
          font: 'inherit',
        }}
      >
        Dismiss
      </button>
    </div>
  );
}
