import { useMemo, useState } from 'react';
import {
  isConfigured,
  type GhConfig,
  type GhManifest,
  type SlotDef,
} from '@/lib/ghConfig';
import { EntityPicker } from './EntityPicker';
import './config.css';

/** Seed an editable draft from the saved config: single → string, multi → array. */
function seedDraft(manifest: GhManifest, config: GhConfig): GhConfig {
  const draft: GhConfig = {};
  for (const slot of manifest.slots) {
    const cur = config[slot.key];
    if (slot.kind === 'multi') {
      draft[slot.key] = Array.isArray(cur) ? [...cur] : [];
    } else {
      draft[slot.key] = typeof cur === 'string' ? cur : '';
    }
  }
  return draft;
}

/** Drop empty entries so a saved multi slot holds only real ids. */
function cleanDraft(manifest: GhManifest, draft: GhConfig): GhConfig {
  const out: GhConfig = {};
  for (const slot of manifest.slots) {
    const v = draft[slot.key];
    if (slot.kind === 'multi') {
      out[slot.key] = (Array.isArray(v) ? v : []).filter((id) => !!id);
    } else {
      out[slot.key] = typeof v === 'string' ? v : '';
    }
  }
  return out;
}

/**
 * The entity setup wizard — maps every slot the template declares to real HA
 * entities, no source edit required. Auto-opens on first run; reopenable from
 * the gear button. Saves a per-dashboard mapping the dashboard reads live.
 */
export function SetupWizard({
  manifest,
  config,
  onSave,
  onSkip,
}: {
  manifest: GhManifest;
  config: GhConfig;
  onSave: (config: GhConfig) => void;
  onSkip: () => void;
}) {
  const [draft, setDraft] = useState<GhConfig>(() => seedDraft(manifest, config));

  const ready = useMemo(() => isConfigured(cleanDraft(manifest, draft), manifest), [manifest, draft]);

  const setSingle = (key: string, id: string) => setDraft((d) => ({ ...d, [key]: id }));

  const setMultiAt = (key: string, i: number, id: string) =>
    setDraft((d) => {
      const arr = [...((d[key] as string[]) ?? [])];
      if (!id) arr.splice(i, 1);
      else arr[i] = id;
      return { ...d, [key]: arr };
    });

  const addMulti = (key: string) =>
    setDraft((d) => ({ ...d, [key]: [...((d[key] as string[]) ?? []), ''] }));

  return (
    <div className="gh-setup" role="dialog" aria-modal="true" aria-label="Entity setup">
      <div className="gh-setup__panel">
        <header className="gh-setup__head">
          <h2 className="gh-setup__title">Connect your entities</h2>
          <p className="gh-setup__sub">
            Map each card to an entity from your Home Assistant. Saved to this
            dashboard — no rebuild needed.
          </p>
        </header>

        <div className="gh-setup__body">
          {manifest.slots.map((slot) => (
            <SlotField
              key={slot.key}
              slot={slot}
              draft={draft}
              onSingle={(id) => setSingle(slot.key, id)}
              onMultiAt={(i, id) => setMultiAt(slot.key, i, id)}
              onAdd={() => addMulti(slot.key)}
            />
          ))}
        </div>

        <footer className="gh-setup__foot">
          <button type="button" className="gh-btn gh-btn--ghost" onClick={onSkip}>
            Skip for now
          </button>
          <button
            type="button"
            className="gh-btn gh-btn--primary"
            disabled={!ready}
            onClick={() => onSave(cleanDraft(manifest, draft))}
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}

function SlotField({
  slot,
  draft,
  onSingle,
  onMultiAt,
  onAdd,
}: {
  slot: SlotDef;
  draft: GhConfig;
  onSingle: (id: string) => void;
  onMultiAt: (i: number, id: string) => void;
  onAdd: () => void;
}) {
  const items = (draft[slot.key] as string[]) ?? [];

  return (
    <section className="gh-field">
      <div className="gh-field__head">
        <label className="gh-field__label">
          {slot.label}
          {slot.required && <span className="gh-field__req" aria-label="required"> *</span>}
        </label>
        {slot.help && <p className="gh-field__help">{slot.help}</p>}
      </div>

      {slot.kind === 'single' ? (
        <EntityPicker
          domains={slot.domains}
          value={(draft[slot.key] as string) ?? ''}
          onChange={onSingle}
        />
      ) : (
        <div className="gh-field__multi">
          {items.map((id, i) => (
            <EntityPicker
              key={`${slot.key}-${i}`}
              domains={slot.domains}
              value={id}
              onChange={(next) => onMultiAt(i, next)}
            />
          ))}
          <button type="button" className="gh-btn gh-btn--add" onClick={onAdd}>
            + Add {slot.label.toLowerCase()}
          </button>
        </div>
      )}
    </section>
  );
}
