import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppShell } from '@/components/AppShell';
import { getConnectionStatus, onStatus, type ConnectionStatus } from '@/lib/haConnection';
import { Icon, type IconName } from './icons';
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

// Real brand mark, bundled from the integration's brand assets (Vite resolves
// and hashes it; works under the panel's relative base).
const GH_LOGO = new URL('../../custom_components/glasshopper/brand/icon@2x.png', import.meta.url).href;

type Tab = 'dashboards' | 'catalog' | 'templates';
type Toast = { kind: 'ok' | 'err'; text: string };

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'dashboards', label: 'Dashboards', icon: 'dashboard' },
  { id: 'catalog', label: 'Catalog', icon: 'store' },
  { id: 'templates', label: 'Templates', icon: 'layers' },
];

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  idle: 'Connecting…',
  connecting: 'Connecting…',
  connected: 'Connected',
  disconnected: 'Offline',
  error: 'Connection error',
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 31);
}

export function ManagerApp() {
  const [tab, setTab] = useState<Tab>('dashboards');
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>(() => getConnectionStatus());

  useEffect(() => onStatus(setStatus), []);

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
    } finally {
      setLoaded(true);
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

  const counts: Record<Tab, number> = {
    dashboards: dashboards.length,
    catalog: catalog.length,
    templates: templates.length,
  };

  return (
    <AppShell
      topbar={
        <>
          <div className="mgr-brand">
            <span className="mgr-logo" style={{ backgroundImage: `url(${GH_LOGO})` }} aria-hidden />
            <span className="mgr-brand__name">Glasshopper</span>
            <span className="mgr-brand__tag">Manager</span>
          </div>

          <nav className="mgr-tabs" role="tablist" aria-label="Manager sections">
            {TABS.map(({ id, label, icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`mgr-tab-${id}`}
                aria-selected={tab === id}
                aria-controls={`mgr-panel-${id}`}
                className={`mgr-tab${tab === id ? ' mgr-tab--on' : ''}`}
                onClick={() => setTab(id)}
              >
                <Icon name={icon} size={17} />
                {label}
                {loaded && <span className="mgr-tab__count">{counts[id]}</span>}
              </button>
            ))}
          </nav>

          <div className={`mgr-status mgr-status--${status}`}>
            <span className="mgr-status__dot" />
            {STATUS_LABEL[status]}
          </div>
        </>
      }
    >
      {tab === 'dashboards' && (
        <DashboardsTab
          dashboards={dashboards}
          templates={templates}
          loaded={loaded}
          busy={busy}
          onCreate={(d) => run('Dashboard created', () => createDashboard(d))}
          onUpdate={(id, p) => run('Dashboard updated', () => updateDashboard(id, p))}
          onDelete={(id) => run('Dashboard deleted', () => deleteDashboard(id))}
        />
      )}

      {tab === 'catalog' && (
        <CatalogTab
          catalog={catalog}
          loaded={loaded}
          busy={busy}
          onInstall={(id) => run('Template installed', () => installCatalog(id))}
        />
      )}

      {tab === 'templates' && (
        <TemplatesTab
          templates={templates}
          loaded={loaded}
          busy={busy}
          onInstallUrl={(url) => run('Template installed', () => installUrl(url))}
          onUpload={(file) => run('Template uploaded', () => uploadZip(file))}
          onRemove={(id) => run('Template removed', () => removeTemplate(id))}
        />
      )}

      {toast && (
        <div className={`mgr-toast mgr-toast--${toast.kind}`} role="status" aria-live="polite">
          <span className="mgr-toast__icon">
            <Icon name={toast.kind === 'ok' ? 'check' : 'alert'} size={15} />
          </span>
          <span className="mgr-toast__text">{toast.text}</span>
          <button type="button" className="mgr-toast__close" aria-label="Dismiss" onClick={() => setToast(null)}>
            <Icon name="x" size={16} />
          </button>
        </div>
      )}
    </AppShell>
  );
}

export default ManagerApp;

function Panel({ id, children }: { id: Tab; children: ReactNode }) {
  return (
    <section
      className="mgr-panel gh-stack"
      role="tabpanel"
      id={`mgr-panel-${id}`}
      aria-labelledby={`mgr-tab-${id}`}
      tabIndex={0}
    >
      {children}
    </section>
  );
}

function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="mgr-surface" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div className="mgr-skel-row" key={i}>
          <span className="mgr-skel mgr-skel--icon" />
          <div className="gh-stack" style={{ flex: 1, gap: 8 }}>
            <span className="mgr-skel mgr-skel--line" style={{ width: '42%' }} />
            <span className="mgr-skel mgr-skel--line" style={{ width: '26%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Dashboards ───────────────────────────────────────────────────────────────

type FormMode = { mode: 'create' } | { mode: 'edit'; dash: Dashboard } | null;

export function DashboardsTab(props: {
  dashboards: Dashboard[];
  templates: Template[];
  loaded: boolean;
  busy: boolean;
  onCreate: (d: DashboardInput) => void;
  onUpdate: (id: string, patch: Partial<DashboardInput>) => void;
  onDelete: (id: string) => void;
}) {
  const { dashboards, templates, loaded, busy, onCreate, onUpdate, onDelete } = props;
  const [form, setForm] = useState<FormMode>(null);
  const editingId = form?.mode === 'edit' ? form.dash.id : null;
  const noTemplates = templates.length === 0;

  return (
    <Panel id="dashboards">
      <div className="mgr-panel__head">
        <div className="mgr-panel__titles">
          <span className="mgr-panel__eyebrow">Sidebar panels</span>
          <h2>Dashboards</h2>
          <p className="mgr-panel__desc">Each dashboard becomes a panel in the Home Assistant sidebar.</p>
        </div>
        <button
          type="button"
          className="mgr-btn mgr-btn--primary"
          disabled={busy || noTemplates}
          aria-expanded={form?.mode === 'create'}
          onClick={() => setForm((f) => (f?.mode === 'create' ? null : { mode: 'create' }))}
        >
          <Icon name="plus" size={18} />
          {form?.mode === 'create' ? 'Close' : 'Add dashboard'}
        </button>
      </div>

      {form && (
        <DashboardForm
          templates={templates}
          busy={busy}
          initial={form.mode === 'edit' ? form.dash : undefined}
          editing={form.mode === 'edit'}
          onSubmit={(d) => {
            if (form.mode === 'edit') {
              onUpdate(form.dash.id, {
                title: d.title,
                template_id: d.template_id,
                icon: d.icon,
                require_admin: d.require_admin,
                public: d.public,
              });
            } else {
              onCreate(d);
            }
            setForm(null);
          }}
          onCancel={() => setForm(null)}
        />
      )}

      {!loaded ? (
        <SkeletonList />
      ) : dashboards.length === 0 ? (
        <div className="mgr-empty">
          <span className="mgr-empty__icon">
            <Icon name="dashboard" size={26} />
          </span>
          <h3>No dashboards yet</h3>
          <p>
            {noTemplates
              ? 'Install a template first, from the Catalog or Templates tab, then create your first dashboard.'
              : 'Create your first dashboard to add a live panel to the sidebar.'}
          </p>
          {!noTemplates && (
            <button type="button" className="mgr-btn mgr-btn--primary" disabled={busy} onClick={() => setForm({ mode: 'create' })}>
              <Icon name="plus" size={18} />
              Add dashboard
            </button>
          )}
        </div>
      ) : (
        <div className="mgr-surface">
          <div className="mgr-list">
            {dashboards.map((d) => (
              <DashboardRow
                key={d.id}
                dash={d}
                busy={busy}
                editing={editingId === d.id}
                onEdit={() => setForm({ mode: 'edit', dash: d })}
                onDelete={() => onDelete(d.id)}
              />
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}

function DashboardRow(props: {
  dash: Dashboard;
  busy: boolean;
  editing: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { dash, busy, editing, onEdit, onDelete } = props;
  return (
    <div className="mgr-item" aria-current={editing || undefined}>
      <span className="mgr-item__icon">
        <Icon name="dashboard" size={22} />
      </span>
      <div className="mgr-item__body">
        <div className="mgr-item__title">
          <strong>{dash.title}</strong>
          <code className="mgr-slug">/{dash.slug}</code>
        </div>
        <div className="mgr-item__meta">
          <span className="mgr-badge">{dash.template_id}</span>
          {dash.public && (
            <span className="mgr-badge mgr-badge--public">
              <Icon name="globe" /> Public
            </span>
          )}
          {dash.require_admin && (
            <span className="mgr-badge mgr-badge--admin">
              <Icon name="shield" /> Admin only
            </span>
          )}
        </div>
      </div>
      <div className="mgr-item__actions">
        <a className="mgr-btn mgr-btn--ghost mgr-btn--sm" href={`/${dash.slug}`} target="_top">
          <Icon name="open" size={16} /> Open
        </a>
        <button type="button" className="mgr-btn mgr-btn--sm" disabled={busy} onClick={onEdit}>
          <Icon name="pencil" size={16} /> {editing ? 'Editing' : 'Edit'}
        </button>
        <button type="button" className="mgr-btn mgr-btn--danger mgr-btn--sm" disabled={busy} onClick={onDelete} aria-label={`Delete ${dash.title}`}>
          <Icon name="trash" size={16} />
        </button>
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
      className="mgr-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({ title: title.trim(), slug: slug.trim(), template_id: templateId, icon: icon.trim(), public: pub, require_admin: admin });
      }}
    >
      <label className="mgr-field">
        <span>Title</span>
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!slugManual && !editing) setSlug(slugify(e.target.value));
          }}
          placeholder="Living Room"
          autoFocus
          required
        />
      </label>
      <label className="mgr-field">
        <span>URL slug</span>
        <input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="living-room" required disabled={editing} />
        <span className="mgr-field__hint">
          Opens at <b>/{slug || 'living-room'}</b>
        </span>
      </label>
      <label className="mgr-field">
        <span>Template</span>
        <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.id})
            </option>
          ))}
        </select>
      </label>
      <label className="mgr-field">
        <span>Sidebar icon</span>
        <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="mdi:sofa" />
        <span className="mgr-field__hint">Any Material Design Icons name.</span>
      </label>
      <label className="mgr-check mgr-form__full">
        <input type="checkbox" checked={pub} onChange={(e) => setPub(e.target.checked)} />
        Public standalone URL (reachable without signing in)
      </label>
      <label className="mgr-check mgr-form__full">
        <input type="checkbox" checked={admin} onChange={(e) => setAdmin(e.target.checked)} />
        Visible to admin users only
      </label>
      <div className="mgr-form__foot mgr-form__full">
        <button type="submit" className="mgr-btn mgr-btn--primary" disabled={busy || !canSubmit}>
          <Icon name="check" size={18} />
          {editing ? 'Save changes' : 'Create dashboard'}
        </button>
        {onCancel && (
          <button type="button" className="mgr-btn mgr-btn--ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

// ── Catalog ──────────────────────────────────────────────────────────────────

export function CatalogTab(props: { catalog: CatalogEntry[]; loaded: boolean; busy: boolean; onInstall: (id: string) => void }) {
  const { catalog, loaded, busy, onInstall } = props;
  return (
    <Panel id="catalog">
      <div className="mgr-panel__head">
        <div className="mgr-panel__titles">
          <span className="mgr-panel__eyebrow">Template store</span>
          <h2>Catalog</h2>
          <p className="mgr-panel__desc">Ready-made dashboard templates. Install a free one in a click, or browse the premium store.</p>
        </div>
      </div>

      {!loaded ? (
        <SkeletonList />
      ) : catalog.length === 0 ? (
        <div className="mgr-empty">
          <span className="mgr-empty__icon">
            <Icon name="store" size={26} />
          </span>
          <h3>Catalog unavailable</h3>
          <p>No templates to show right now. Check your connection, or install a template by URL from the Templates tab.</p>
        </div>
      ) : (
        <div className="gh-grid gh-grid--wide mgr-cards">
          {catalog.map((e) => (
            <article key={e.id} className={`mgr-card${e.kind === 'premium' ? ' mgr-card--premium' : ''}`}>
              <div className="mgr-card__preview">
                {e.preview ? <img src={e.preview} alt="" /> : <Icon name="layers" size={30} />}
                <span className={`mgr-tag mgr-tag--${e.kind} mgr-card__tag`}>{e.kind}</span>
              </div>
              <div className="mgr-card__body">
                <strong>{e.name}</strong>
                <p>{e.description}</p>
              </div>
              <div className="mgr-card__foot">
                {e.installed ? (
                  <span className="mgr-installed">
                    <Icon name="check" size={16} /> Installed
                  </span>
                ) : e.kind === 'free' ? (
                  <button type="button" className="mgr-btn mgr-btn--primary mgr-btn--sm" disabled={busy} onClick={() => onInstall(e.id)}>
                    <Icon name="plus" size={16} /> Install
                  </button>
                ) : (
                  <a className="mgr-btn mgr-btn--sm" href={e.storeUrl} target="_blank" rel="noopener noreferrer">
                    <Icon name="open" size={16} /> Get on store
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}

// ── Templates ────────────────────────────────────────────────────────────────

export function TemplatesTab(props: {
  templates: Template[];
  loaded: boolean;
  busy: boolean;
  onInstallUrl: (url: string) => void;
  onUpload: (file: File) => void;
  onRemove: (id: string) => void;
}) {
  const { templates, loaded, busy, onInstallUrl, onUpload, onRemove } = props;
  const [url, setUrl] = useState('');
  const [uploadingName, setUploadingName] = useState<string | null>(null);

  useEffect(() => {
    if (!busy) setUploadingName(null);
  }, [busy]);

  return (
    <Panel id="templates">
      <div className="mgr-panel__head">
        <div className="mgr-panel__titles">
          <span className="mgr-panel__eyebrow">Installed library</span>
          <h2>Templates</h2>
          <p className="mgr-panel__desc">Installed templates power your dashboards. Add more from a URL or a .zip file.</p>
        </div>
      </div>

      <div className="mgr-form mgr-install">
        <div className="mgr-field">
          <span>Install from URL</span>
          <div className="mgr-row">
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…/template.zip" />
            <button
              type="button"
              className="mgr-btn mgr-btn--primary"
              disabled={busy || !url.trim()}
              onClick={() => {
                onInstallUrl(url.trim());
                setUrl('');
              }}
            >
              <Icon name="link" size={18} /> Install
            </button>
          </div>
        </div>
        <label className="mgr-field">
          <span>Or upload a .zip</span>
          <input
            type="file"
            accept=".zip,application/zip"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setUploadingName(f.name);
                onUpload(f);
              }
              e.target.value = '';
            }}
          />
        </label>
        {uploadingName && busy && (
          <p className="mgr-uploading">
            <Icon name="spinner" size={16} /> Uploading <b>{uploadingName}</b>…
          </p>
        )}
      </div>

      {!loaded ? (
        <SkeletonList />
      ) : templates.length === 0 ? (
        <div className="mgr-empty">
          <span className="mgr-empty__icon">
            <Icon name="layers" size={26} />
          </span>
          <h3>No templates installed</h3>
          <p>Install one from the Catalog, paste a URL above, or upload a .zip you built with create-glasshopper.</p>
        </div>
      ) : (
        <div className="mgr-surface">
          <div className="mgr-list">
            {templates.map((t) => (
              <div key={t.id} className="mgr-item">
                <span className="mgr-item__icon">
                  <Icon name="layers" size={22} />
                </span>
                <div className="mgr-item__body">
                  <div className="mgr-item__title">
                    <strong>{t.name}</strong>
                    <code className="mgr-slug">{t.id}</code>
                  </div>
                  <div className="mgr-item__meta">
                    <span className="mgr-panel__desc" style={{ margin: 0 }}>
                      {t.description || `Version ${t.version}`}
                    </span>
                  </div>
                </div>
                <div className="mgr-item__actions">
                  {t.in_use ? (
                    <span className="mgr-badge mgr-badge--public">In use</span>
                  ) : (
                    <button type="button" className="mgr-btn mgr-btn--danger mgr-btn--sm" disabled={busy} onClick={() => onRemove(t.id)}>
                      <Icon name="trash" size={16} /> Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}
