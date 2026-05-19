# Panel vs. standalone

Every installed dashboard has **two URLs** in HA:

| Route                                   | Mode       | Auth                                          | Use                                       |
| --------------------------------------- | ---------- | --------------------------------------------- | ----------------------------------------- |
| `/<slug>` (sidebar entry)               | Panel      | Requires HA login (or admin if configured)    | Day-to-day use inside HA                  |
| `/custom-dashboard/<slug>/`             | Standalone | Optional — controlled by the `public` flag    | Wall tablets, kiosks, PWA on a phone      |

## Panel mode

Loaded inside an iframe by HA's frontend. The dashboard reads
`window.parent.hassConnection` and reuses HA's open WebSocket. All
entities, services, and registry calls go through that connection.

This is what users see when they click the sidebar entry. The route URL is
`/<your-slug>` — for example `/jarvis` or `/control`.

## Standalone mode

Served directly by the integration at `/custom-dashboard/<slug>/`. Useful when
you want to display the dashboard outside HA's chrome — a fullscreen kiosk on
a wall tablet, or a PWA installed from a phone.

By default the route requires authentication. To make it accessible without
login (read-only kiosk, public displays), enable the **Public standalone URL**
toggle in the integration options.

::: warning
A public dashboard exposes whatever state and services the React app uses.
Treat it as read-only and don't include sensitive entities.
:::

## Same code, different URLs

The same React bundle serves both routes. Your code decides what to render —
typically via `window.location.pathname` or a router. The `haConnection`
bridge auto-detects whether it's inside an HA frame and connects accordingly.

```ts
import { isPanelMode } from '@/lib/haConnection';

if (isPanelMode()) {
  // Inherits HA session — full access.
} else {
  // Standalone: must use the long-lived token in dev or HA cookie in standalone prod.
}
```
