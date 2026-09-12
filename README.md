# Glasshopper

**React dashboards for Home Assistant.** Native sidebar panels. Five hooks. No tokens, no CORS.

> Status: **0.x — pre-1.0**. APIs may change before 1.0.

Glasshopper is two things in one repo:

- A Home Assistant **custom integration** (`glasshopper`) that registers each React bundle you ship as a real HA sidebar panel — installable via HACS, configurable from the UI, no `panel_iframe` YAML needed.
- A **frontend scaffold** with five React hooks (`useEntity`, `useService`, `useHistory`, `useArea`, `useTheme`) that talk to HA over the same WebSocket the rest of the frontend uses. No tokens, no CORS, no extra auth — the panel iframe inherits HA's session.

Landing: [glasshopper.dev](https://glasshopper.dev) · Docs: [docs.glasshopper.dev](https://docs.glasshopper.dev)

## Install

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=colopisalvatore&repository=glasshopper&category=integration)

The badge opens HACS with the repository **and the category already filled in** — no dropdown to pick. Then **Download**, restart Home Assistant, and add the integration:

[![Open your Home Assistant instance and start setting up a new integration.](https://my.home-assistant.io/badges/config_flow_start.svg)](https://my.home-assistant.io/redirect/config_flow_start/?domain=glasshopper)

No HACS, or the category dropdown won't cooperate? Download `glasshopper.zip` from the
[latest release](https://github.com/colopisalvatore/glasshopper/releases/latest) and drop the
`glasshopper` folder into `config/custom_components/` —
[manual install guide](https://docs.glasshopper.dev/guide/install-hacs#manual-install-no-hacs).

## Why

Home Assistant's frontend is excellent but opinionated. If you want a dashboard that doesn't look or behave like Lovelace — a kiosk display, a wall tablet, a brand-specific control room — you currently have to choose between writing custom cards (still Lovelace) or hosting a separate web app (auth nightmare). This project gives you the third option: a real React app, served by HA itself, talking to HA's live state with one-line hooks.

## Quick start

```bash
# 1. Scaffold a fresh project
npx create-glasshopper my-dashboard
cd my-dashboard

# 2. Install + dev
npm install
cp .env.example .env.local   # set VITE_HA_URL to your HA instance
npm run dev                  # http://localhost:5173 with HMR

# 3. Build + deploy
npm run sync                 # builds and copies into custom_components/
# Copy the whole repo into your HA config dir (or install via HACS)
# Restart HA, then: Settings → Devices → Add Integration → "Glasshopper"
```

## Architecture

```
glasshopper/
├── custom_components/
│   └── glasshopper/              # HA Python integration (Apache-2.0)
│       ├── __init__.py           # hub setup: registry, panels, services, views, WS, upload
│       ├── config_flow.py        # single hub ConfigFlow (migrates legacy per-dashboard entries)
│       ├── panels.py             # registers each dashboard panel + the Manager admin panel
│       ├── registry.py           # template registry (scan / install / remove)
│       ├── store.py              # dashboard list in HA storage (per-dashboard `public` flag)
│       ├── migration.py          # imports pre-hub per-dashboard entries into the store
│       ├── services.py           # install / reload / remove template services (admin-only)
│       ├── websocket.py          # admin WS commands for dashboards / templates / catalog
│       ├── upload.py             # admin HTTP upload endpoint for template zips
│       ├── views.py              # serves each dashboard full-page at /custom-dashboard/<slug>
│       ├── catalog.py            # free-template 1-click catalog
│       ├── brand/                # in-repo brand icons (served via brands-proxy, HA 2026.3+)
│       ├── bundled/minimal/      # built starter template, seeded on setup
│       └── manager_app/          # built React admin panel (Manager)
├── src/                          # frontend scaffold + Manager app source
│   ├── hooks/                    # useEntity, useService, useHistory, useArea, useTheme
│   └── lib/haConnection.ts       # bridge to window.parent.hassConnection
├── templates/                    # free templates (aria, grid, pulse)
├── vite.config.ts · vite.config.manager.ts
└── hacs.json
```

Dashboards render with the session the panel iframe inherits, so the hooks need
no token or CORS setup. Management actions — installing a template from a URL,
uploading a zip, adding or removing a dashboard — are **admin-only**, enforced
on the services, the WebSocket commands and the upload endpoint alike. Each
dashboard also has a `public` flag controlling whether its standalone
`/custom-dashboard/<slug>` URL is reachable without signing in.

## Hooks

```tsx
import { useEntity, useService, useHistory } from '@/hooks';

function KitchenLight() {
  const light = useEntity('light.kitchen');
  const turnOn = useService('light', 'turn_on');

  return (
    <button onClick={() => turnOn({ entity_id: 'light.kitchen', brightness_pct: 80 })}>
      {light?.state ?? 'unknown'}
    </button>
  );
}

function Temperature() {
  const { data, loading } = useHistory('sensor.kitchen_temperature', 24);
  if (loading) return <span>…</span>;
  return <Chart points={data} />;
}
```

## Multi-dashboard

Each ConfigEntry registers one panel. Add as many as you want from the HA UI — each with its own URL slug, sidebar title, icon, and admin-only flag. All entries share the same bundle (you ship one React app that decides what to render based on `window.location.pathname`).

## Status

| Capability                                | State |
| ----------------------------------------- | ----- |
| Iframe panel registration (Python)        | ✅    |
| Multi-dashboard ConfigFlow + OptionsFlow  | ✅    |
| Standalone `/custom-dashboard/<slug>/`    | ✅    |
| Multi-template registry + install service | ✅    |
| `useEntity` / `useService` / `useHistory` | ✅    |
| `useArea` (entities per area)             | ✅    |
| `useTheme` (HA theme tokens)              | ✅    |
| CLI scaffold (`create-glasshopper`)           | ✅    |
| Docs site (VitePress, `docs/`)            | ✅    |
| Landing page (separate `glasshopper-web`) | ✅    |
| Template library + registry schema        | ✅    |
| HACS custom repository                    | ✅    |
| HACS default repository submission        | ⏳    |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Bug reports and PRs welcome — please open an issue before sending large changes so we can align on direction.

## License

[Apache 2.0](./LICENSE).
