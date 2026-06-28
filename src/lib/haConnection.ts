/**
 * HA connection bridge.
 *
 * Two modes:
 * 1. Panel mode (default in production): the bundle is loaded inside an iframe
 *    served by the `glasshopper` custom_component. The parent HA frame exposes
 *    `window.parent.hassConnection` — we reuse it so there is zero auth setup.
 * 2. Standalone mode (dev): provide `VITE_HA_URL` and a long-lived token via
 *    URL `?token=` or `localStorage.glasshopper_token`. Used with `npm run dev`.
 */

import {
  createConnection,
  createLongLivedTokenAuth,
  subscribeEntities,
  callService as wsCallService,
  type Auth,
  type Connection,
  type HassEntities,
  type HassEntity,
} from 'home-assistant-js-websocket';

export type AreaRegistryEntry = {
  area_id: string;
  name: string;
  picture: string | null;
  icon: string | null;
  floor_id: string | null;
  labels: string[];
  aliases: string[];
};

export type DeviceRegistryEntry = {
  id: string;
  name: string | null;
  name_by_user: string | null;
  area_id: string | null;
  manufacturer: string | null;
  model: string | null;
  labels: string[];
};

export type EntityRegistryEntry = {
  entity_id: string;
  area_id: string | null;
  device_id: string | null;
  platform: string;
  name: string | null;
  labels: string[];
  hidden_by: string | null;
  disabled_by: string | null;
};

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

type EntitiesListener = (entities: HassEntities) => void;

const STORAGE_TOKEN_KEY = 'glasshopper_token';

let connection: Connection | null = null;
let entities: HassEntities = {};
let status: ConnectionStatus = 'idle';
let lastError: string | null = null;
let panelMode = false;
let unsubEntities: (() => void) | null = null;
let reconnectTimer: number | null = null;
let attempts = 0;

// Resolves the moment `connection` becomes available, so registry/service/
// history calls made before connect() finishes (e.g. a hook firing on mount)
// wait for the bridge instead of throwing "not established". Rejects after a
// timeout when there is genuinely no connection.
let readyWaiters: Array<(c: Connection) => void> = [];

function markConnected(conn: Connection): void {
  connection = conn;
  const waiters = readyWaiters;
  readyWaiters = [];
  waiters.forEach((resolve) => resolve(conn));
}

function whenConnected(timeoutMs = 10000): Promise<Connection> {
  if (connection) return Promise.resolve(connection);
  return new Promise<Connection>((resolve, reject) => {
    const onReady = (conn: Connection): void => {
      window.clearTimeout(timer);
      resolve(conn);
    };
    const timer = window.setTimeout(() => {
      readyWaiters = readyWaiters.filter((r) => r !== onReady);
      reject(new Error('HA connection is not established'));
    }, timeoutMs);
    readyWaiters.push(onReady);
  });
}

const listeners = new Set<EntitiesListener>();
const statusListeners = new Set<(s: ConnectionStatus) => void>();

const BACKOFF = [1000, 2000, 4000, 8000, 16000, 30000];

type ParentHassWindow = Window & {
  hassConnection?: Promise<{ conn: Connection; auth: Auth }>;
};

function setStatus(next: ConnectionStatus): void {
  if (status === next) return;
  status = next;
  statusListeners.forEach((cb) => cb(next));
}

function setEntities(next: HassEntities): void {
  entities = next;
  listeners.forEach((cb) => cb(next));
}

async function tryParentBridge(): Promise<Connection | null> {
  if (typeof window === 'undefined' || window.parent === window) return null;
  try {
    const bridge = (window.parent as ParentHassWindow).hassConnection;
    if (!bridge) return null;
    const { conn } = await bridge;
    return conn;
  } catch {
    return null;
  }
}

function readToken(): { url: string; token: string } | null {
  const url = import.meta.env.VITE_HA_URL ?? '';
  if (!url) return null;
  const fromQuery = new URLSearchParams(window.location.search).get('token');
  if (fromQuery) {
    try {
      window.localStorage.setItem(STORAGE_TOKEN_KEY, fromQuery);
    } catch {
      /* private mode — ignore */
    }
    return { url, token: fromQuery };
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_TOKEN_KEY);
    if (stored) return { url, token: stored };
  } catch {
    /* ignore */
  }
  return null;
}

function attach(conn: Connection): void {
  unsubEntities = subscribeEntities(conn, (e) => setEntities(e));
  conn.addEventListener('disconnected', () => {
    setStatus('disconnected');
    if (!panelMode) scheduleReconnect();
  });
  conn.addEventListener('reconnect-error', () => setStatus('error'));
}

function scheduleReconnect(): void {
  if (reconnectTimer != null) return;
  const delay = BACKOFF[Math.min(attempts, BACKOFF.length - 1)];
  attempts += 1;
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    void connect();
  }, delay);
}

export async function connect(): Promise<void> {
  if (status === 'connecting' || status === 'connected') return;
  setStatus('connecting');
  lastError = null;

  const parentConn = await tryParentBridge();
  if (parentConn) {
    panelMode = true;
    markConnected(parentConn);
    attempts = 0;
    attach(parentConn);
    setStatus('connected');
    return;
  }

  panelMode = false;
  const creds = readToken();
  if (!creds) {
    setStatus('disconnected');
    lastError = 'Set VITE_HA_URL and provide a long-lived token via ?token=... or localStorage.';
    return;
  }

  try {
    const auth = createLongLivedTokenAuth(creds.url, creds.token);
    markConnected(await createConnection({ auth }));
    attempts = 0;
    attach(connection!);
    setStatus('connected');
  } catch (err) {
    lastError = err instanceof Error ? err.message : String(err);
    setStatus('error');
    scheduleReconnect();
  }
}

export function disconnect(): void {
  if (reconnectTimer != null) {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  unsubEntities?.();
  unsubEntities = null;
  if (!panelMode) connection?.close();
  connection = null;
  panelMode = false;
  setEntities({});
  setStatus('disconnected');
}

export function getConnection(): Connection | null {
  return connection;
}

export function getEntities(): HassEntities {
  return entities;
}

export function getEntity(entityId: string): HassEntity | undefined {
  return entities[entityId];
}

export function onEntities(cb: EntitiesListener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getConnectionStatus(): ConnectionStatus {
  return status;
}

export function getLastError(): string | null {
  return lastError;
}

export function onStatus(cb: (s: ConnectionStatus) => void): () => void {
  statusListeners.add(cb);
  return () => statusListeners.delete(cb);
}

export function isPanelMode(): boolean {
  return panelMode;
}

export async function callHaService(
  domain: string,
  service: string,
  data?: Record<string, unknown>,
): Promise<void> {
  const conn = await whenConnected();
  await wsCallService(conn, domain, service, data);
}

export async function fetchHistory(
  entityId: string,
  hoursBack = 24,
): Promise<Array<{ t: number; v: number }>> {
  // Wait for the bridge so panelMode is set correctly when a hook calls this on
  // mount; if no connection ever comes, fall through (token mode may have creds).
  try {
    await whenConnected();
  } catch {
    /* no live connection */
  }
  const start = new Date(Date.now() - hoursBack * 3600_000).toISOString();
  const end = new Date().toISOString();
  const path = `/api/history/period/${start}?filter_entity_id=${entityId}&end_time=${end}&minimal_response&no_attributes`;

  let res: Response;
  if (panelMode) {
    res = await fetch(path, { credentials: 'same-origin' });
  } else {
    const creds = readToken();
    if (!creds) return [];
    res = await fetch(`${creds.url}${path}`, {
      headers: { Authorization: `Bearer ${creds.token}` },
    });
  }

  if (!res.ok) throw new Error(`History HTTP ${res.status}`);
  const data: Array<Array<{ state: string; last_changed: string }>> = await res.json();
  const series = data[0] ?? [];
  return series
    .map((p) => ({ t: new Date(p.last_changed).getTime(), v: Number(p.state) }))
    .filter((p) => Number.isFinite(p.v));
}

async function sendMessage<T>(type: string): Promise<T> {
  const conn = await whenConnected();
  return conn.sendMessagePromise<T>({ type });
}

export async function fetchAreaRegistry(): Promise<AreaRegistryEntry[]> {
  return sendMessage<AreaRegistryEntry[]>('config/area_registry/list');
}

export async function fetchDeviceRegistry(): Promise<DeviceRegistryEntry[]> {
  return sendMessage<DeviceRegistryEntry[]>('config/device_registry/list');
}

export async function fetchEntityRegistry(): Promise<EntityRegistryEntry[]> {
  return sendMessage<EntityRegistryEntry[]>('config/entity_registry/list');
}
