import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { useTheme } from '@/hooks';
import {
  type CatalogEntry,
  type Dashboard,
  type DashboardInput,
  type Template,
  createDashboard,
  deleteDashboard,
  errText,
  installCatalog,
  installUrl,
  listCatalog,
  listDashboards,
  listTemplates,
  removeTemplate,
  updateDashboard,
  uploadZip,
} from './api';

type Tab = 'dashboards' | 'catalog' | 'templates';
type Toast = { kind: 'ok' | 'err'; text: string };

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 31);
}

export function ManagerApp() {
  const theme = useTheme();
  const [tab, setTab] = useState<Tab>('dashboards');
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const c = theme['primary-color'];
    const root = document.documentElement;
    if (c) root.style.setProperty('--accent', c);
  }, [theme]);

  const flash = useCallback((kind: Toast['kind'], text: string) => {
    setToast({ kind, text });
    window.setTimeout(() => setToast((t) => (t?.text === text ? null : t)), 4000);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [d, t, c] = await Promise.all([listDashboards(), listTemplates(), listCatalog()]);
      setDashboards(d);
      setTemplates(t);
      setCatalog(c);
    } catch (e) {
      flash('err', errText(e));
    }
  }, [flash]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const run = useCallback(
    async (label: string, fn: () => Promise<unknown>) => {
      setBusy(true);
      try {
        await fn();
        await refresh();
        flash('ok', label);
      } catch (e) {
        flash('err', errText(e));
      } finally {
        setBusy(false);
      }
    },
    [refresh, flash],
  );

  return (
    <AppShell
      topbar={
        <>
          <div className="mgr__brand">
            <span className="mgr__mark" aria-hidden>🦗</span>
            <strong>Glasshopper</strong>
            <span className="mgr__sub">Manager</span>
          </div>
          <nav className="mgr__tabs">
            {(['dashboards', 'catalog', 'templates'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                className={`mgr__tab${tab === t ? ' mgr__tab--on' : ''}`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </nav>
        </>
      }
    >
      {toast && <div className={`mgr__toast mgr__toast--${toast.kind}`}>{toast.text}</div>}

      {tab === 'dashboards' && (
        <DashboardsTab
          dashboards={dashboards}
          templates={templates}
          busy={busy}
          onCreate={(d) => run('Dashboard created', () => createDashboard(d))}
          onUpdate={(id, p) => run('Dashboard updated', () => updateDashboard(id, p))}
          onDelete={(id) => run('Dashboard deleted', () => deleteDashboard(id))}
        />
      )}

      {tab === 'catalog' && (
        <CatalogTab
          catalog={catalog}
          busy={busy}
          onInstall={(id) => run('Template installed', () => installCatalog(id))}
        />
      )}

      {tab === 'templates' && (
        <TemplatesTab
          templates={templates}
          busy={busy}
          onInstallUrl={(url) => run('Template installed', () => installUrl(url))}
          onUpload={(file) => run('Template uploaded', () => uploadZip(file))}
          onRemove={(id) => run('Template removed', () => removeTemplate(id))}
        />
      )}
    </AppShell>
  );
}

export default ManagerApp;

// ── Dashboards ───────────────────────────────────────────────────────────────

function DashboardsTab(props: {
  dashboards: Dashboard[];
  templates: Template[];
  busy: boolean;
  onCreate: (d: DashboardInput) => void;
  onUpdate: (id: string, patch: Partial<DashboardInput>) => void;
  onDelete: (id: string) => void;
}) {
  const { dashboards, templates, busy, onCreate, onUpdate, onDelete } = props;
  const [adding, setAdding] = useState(false);

  return (
    <section className="mgr__section gh-stack">
      <div className="mgr__head">
        <h2>Dashboards</h2>
        <button type="button" className="mgr__btn mgr__btn--primary" disabled={busy} onClick={() => setAdding((v) => !v)}>
          {adding ? 'Close' : '+ Add dashboard'}
        </button>
      </div>

      {adding && (
        <DashboardForm
          templates={templates}
          busy={busy}
          onSubmit={(d) => {
            onCreate(d);
            setAdding(false);
          }}
        />
      )}

      {dashboards.length === 0 && <p className="mgr__empty">No dashboards yet. Add one above.</p>}

      <div className="gh-grid gh-grid--wide">
        {dashboards.map((d) => (
          <DashboardCard
            key={d.id}
            dash={d}
            templates={templates}
            busy={busy}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}

function DashboardCard(props: {
  dash: Dashboard;
  templates: Template[];
  busy: boolean;
  onUpdate: (id: string, patch: Partial<DashboardInput>) => void;
  onDelete: (id: string) => void;
}) {
  const { dash, templates, busy, onUpdate, onDelete } = props;
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="gh-card">
        <DashboardForm
          templates={templates}
          busy={busy}
          initial={dash}
          editing
          onSubmit={(d) => {
            onUpdate(dash.id, { title: d.title, template_id: d.template_id, icon: d.icon, require_admin: d.require_admin, public: d.public });
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="gh-card mgr__dash">
      <div className="mgr__dash-main">
        <strong>{dash.title}</strong>
        <code>/{dash.slug}</code>
        <span className="mgr__muted">{dash.template_id}{dash.public ? ' · public' : ''}{dash.require_admin ? ' · admin' : ''}</span>
      </div>
      <div className="mgr__row">
        <a className="mgr__btn" href={`/${dash.slug}`} target="_top">Open</a>
        <button type="button" className="mgr__btn" disabled={busy} onClick={() => setEditing(true)}>Edit</button>
        <button type="button" className="mgr__btn mgr__btn--danger" disabled={busy} onClick={() => onDelete(dash.id)}>Delete</button>
      </div>
    </div>
  );
}

function DashboardForm(props: {
  templates: Template[];
  busy: boolean;
  initial?: Dashboard;
  editing?: boolean;
  onSubmit: (d: DashboardInput) => void;
  onCancel?: () => void;
}) {
  const { templates, busy, initial, editing, onSubmit, onCancel } = props;
  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [templateId, setTemplateId] = useState(initial?.template_id ?? templates[0]?.id ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? 'mdi:view-dashboard');
  const [pub, setPub] = useState(initial?.public ?? false);
  const [admin, setAdmin] = useState(initial?.require_admin ?? false);
  const slugManual = useMemo(() => initial != null, [initial]);

  const canSubmit = title.trim() && slug.trim() && templateId;

  return (
    <form
      className="gh-card mgr__form gh-stack"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({ title: title.trim(), slug: slug.trim(), template_id: templateId, icon: icon.trim(), public: pub, require_admin: admin });
      }}
    >
      <label className="mgr__field">
        <span>Title</span>
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!slugManual && !editing) setSlug(slugify(e.target.value));
          }}
          placeholder="Living Room"
          required
        />
      </label>
      <label className="mgr__field">
        <span>URL slug</span>
        <input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="living-room" required disabled={editing} />
      </label>
      <label className="mgr__field">
        <span>Template</span>
        <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
          ))}
        </select>
      </label>
      <label className="mgr__field">
        <span>MDI icon</span>
        <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="mdi:sofa" />
      </label>
      <label className="mgr__check"><input type="checkbox" checked={pub} onChange={(e) => setPub(e.target.checked)} /> Public standalone URL</label>
      <label className="mgr__check"><input type="checkbox" checked={admin} onChange={(e) => setAdmin(e.target.checked)} /> Admin users only</label>
      <div className="mgr__row">
        <button type="submit" className="mgr__btn mgr__btn--primary" disabled={busy || !canSubmit}>{editing ? 'Save' : 'Create'}</button>
        {onCancel && <button type="button" className="mgr__btn" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

// ── Catalog ──────────────────────────────────────────────────────────────────

function CatalogTab(props: { catalog: CatalogEntry[]; busy: boolean; onInstall: (id: string) => void }) {
  const { catalog, busy, onInstall } = props;
  return (
    <section className="mgr__section gh-stack">
      <div className="mgr__head"><h2>Catalog</h2></div>
      <div className="gh-grid gh-grid--wide">
        {catalog.map((e) => (
          <div key={e.id} className="gh-card mgr__cat">
            <div className="mgr__dash-main">
              <strong>{e.name}</strong>
              <span className={`mgr__pill mgr__pill--${e.kind}`}>{e.kind}</span>
              <span className="mgr__muted">{e.description}</span>
            </div>
            <div className="mgr__row">
              {e.installed ? (
                <span className="mgr__muted">Installed ✓</span>
              ) : e.kind === 'free' ? (
                <button type="button" className="mgr__btn mgr__btn--primary" disabled={busy} onClick={() => onInstall(e.id)}>Install</button>
              ) : (
                <a className="mgr__btn mgr__btn--primary" href={e.storeUrl} target="_blank" rel="noopener noreferrer">Get on store →</a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Templates ────────────────────────────────────────────────────────────────

function TemplatesTab(props: {
  templates: Template[];
  busy: boolean;
  onInstallUrl: (url: string) => void;
  onUpload: (file: File) => void;
  onRemove: (id: string) => void;
}) {
  const { templates, busy, onInstallUrl, onUpload, onRemove } = props;
  const [url, setUrl] = useState('');

  return (
    <section className="mgr__section gh-stack">
      <div className="mgr__head"><h2>Templates</h2></div>

      <div className="gh-card mgr__install gh-stack">
        <div className="mgr__field">
          <span>Install from URL</span>
          <div className="mgr__row">
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…/template.zip" />
            <button
              type="button"
              className="mgr__btn mgr__btn--primary"
              disabled={busy || !url.trim()}
              onClick={() => {
                onInstallUrl(url.trim());
                setUrl('');
              }}
            >
              Install
            </button>
          </div>
        </div>
        <label className="mgr__field">
          <span>Or upload a .zip</span>
          <input
            type="file"
            accept=".zip,application/zip"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
              e.target.value = '';
            }}
          />
        </label>
      </div>

      <div className="gh-grid gh-grid--wide">
        {templates.map((t) => (
          <div key={t.id} className="gh-card mgr__dash">
            <div className="mgr__dash-main">
              <strong>{t.name}</strong>
              <code>{t.id}</code>
              <span className="mgr__muted">{t.description || t.version}</span>
            </div>
            <div className="mgr__row">
              {t.in_use ? (
                <span className="mgr__muted">In use</span>
              ) : (
                <button type="button" className="mgr__btn mgr__btn--danger" disabled={busy} onClick={() => onRemove(t.id)}>Remove</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
