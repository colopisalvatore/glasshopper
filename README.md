# HA React UI

Build custom Home Assistant dashboards in **React** as native sidebar panels.

> Status: **early development**. APIs may change before 1.0.

`ha-react-ui` is two things in one repo:

- A Home Assistant **custom integration** that registers each React app you ship as a real HA sidebar panel — installable via HACS, configurable from the UI, no `panel_iframe` YAML needed.
- A **frontend scaffold** with React hooks (`useEntity`, `useService`, `useHistory`) that talk to HA over the same WebSocket the rest of the frontend uses. No tokens, no CORS, no extra auth — the panel iframe inherits HA's session.

## Why

Home Assistant's frontend is excellent but opinionated. If you want a dashboard that doesn't look or behave like Lovelace — a kiosk display, a wall tablet, a brand-specific control room — you currently have to choose between writing custom cards (still Lovelace) or hosting a separate web app (auth nightmare). This project gives you the third option: a real React app, served by HA itself, talking to HA's live state with one-line hooks.

## Quick start

```bash
# 1. Clone or use as template
git clone https://github.com/your-org/ha-react-ui.git my-dashboard
cd my-dashboard

# 2. Install + dev
npm install
cp .env.example .env.local   # set VITE_HA_URL to your HA instance
npm run dev                  # http://localhost:5173 with HMR

# 3. Build + deploy
npm run sync                 # builds and copies into custom_components/
# Copy the whole repo into your HA config dir (or install via HACS)
# Restart HA, then: Settings → Devices → Add Integration → "HA React UI"
```

## Architecture

```
ha-react-ui/
├── custom_components/
│   └── ha_react_ui/              # HA Python integration (Apache-2.0)
│       ├── __init__.py           # registers static path + iframe panel per entry
│       ├── config_flow.py        # multi-dashboard ConfigFlow + OptionsFlow
│       ├── manifest.json
│       └── frontend/             # built React bundle (populated by `npm run sync`)
├── src/                          # your React app — edit freely
│   ├── App.tsx
│   ├── hooks/                    # useEntity, useService, useHistory
│   └── lib/haConnection.ts       # bridge to window.parent.hassConnection
├── scripts/sync-panel.mjs        # build + copy dist/ into custom_components/
├── vite.config.ts
└── hacs.json
```

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

| Capability                              | State |
| --------------------------------------- | ----- |
| Iframe panel registration (Python)      | ✅    |
| Multi-dashboard ConfigFlow              | ✅    |
| `useEntity` / `useService` / `useHistory` | ✅    |
| `useArea` (entities per area)           | ⏳    |
| `useTheme` (HA theme tokens)            | ⏳    |
| CLI scaffold (`create-ha-react-ui`)     | ⏳    |
| HACS default repository                 | ⏳    |
| Docs site                               | ⏳    |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Bug reports and PRs welcome — please open an issue before sending large changes so we can align on direction.

## License

[Apache 2.0](./LICENSE).
