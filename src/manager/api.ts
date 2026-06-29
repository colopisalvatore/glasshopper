// Manager ↔ integration API: WebSocket commands + the HTTP upload endpoint.
import { sendCommand, getAccessToken } from '@/lib/haConnection';

export type Dashboard = {
  id: string;
  slug: string;
  title: string;
  template_id: string;
  icon: string;
  require_admin: boolean;
  public: boolean;
};

export type Template = {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  preview: string | null;
  in_use?: boolean;
};

export type CatalogEntry = {
  id: string;
  name: string;
  description: string;
  preview: string | null;
  kind: 'free' | 'premium';
  url?: string;
  storeUrl?: string;
  installed: boolean;
};

export type DashboardInput = {
  slug: string;
  title: string;
  template_id: string;
  icon?: string;
  require_admin?: boolean;
  public?: boolean;
};

export const listDashboards = () =>
  sendCommand<{ dashboards: Dashboard[] }>('glasshopper/dashboards/list').then((r) => r.dashboards);

export const createDashboard = (d: DashboardInput) =>
  sendCommand<{ dashboard: Dashboard }>('glasshopper/dashboards/create', d).then((r) => r.dashboard);

export const updateDashboard = (id: string, patch: Partial<DashboardInput>) =>
  sendCommand<{ dashboard: Dashboard }>('glasshopper/dashboards/update', { dashboard_id: id, ...patch }).then((r) => r.dashboard);

export const deleteDashboard = (id: string) =>
  sendCommand<{ ok: boolean }>('glasshopper/dashboards/delete', { dashboard_id: id });

export const listTemplates = () =>
  sendCommand<{ templates: Template[] }>('glasshopper/templates/list').then((r) => r.templates);

export const installUrl = (url: string, template_id?: string) =>
  sendCommand<{ template: Template | null }>('glasshopper/templates/install_url', { url, template_id }).then((r) => r.template);

export const removeTemplate = (template_id: string) =>
  sendCommand<{ ok: boolean }>('glasshopper/templates/remove', { template_id });

export const listCatalog = () =>
  sendCommand<{ catalog: CatalogEntry[] }>('glasshopper/catalog/list').then((r) => r.catalog);

export const installCatalog = (id: string) =>
  sendCommand<{ template: Template | null }>('glasshopper/catalog/install', { catalog_id: id }).then((r) => r.template);

export async function uploadZip(file: File, template_id?: string): Promise<Template | null> {
  const token = await getAccessToken();
  const fd = new FormData();
  fd.append('file', file);
  if (template_id) fd.append('template_id', template_id);
  const res = await fetch('/api/glasshopper/upload', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
    credentials: 'same-origin',
  });
  if (!res.ok) {
    throw new Error((await res.text()) || `Upload failed (${res.status})`);
  }
  const data = (await res.json()) as { template: Template | null };
  return data.template;
}

/** Normalize a thrown WS/HTTP error into a readable message. */
export function errText(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { message?: string; error?: { message?: string } };
    return e.error?.message ?? e.message ?? String(err);
  }
  return String(err);
}
