# Stoke

**React dashboards for Home Assistant.** Native sidebar panels. Five hooks. Zero auth.

> Status: **0.x — pre-1.0**. APIs may change before 1.0.

Stoke is two things in one repo:

- A Home Assistant **custom integration** (`ha_react_ui`) that registers each React bundle you ship as a real HA sidebar panel — installable via HACS, configurable from the UI, no `panel_iframe` YAML needed.
- A **frontend scaffold** with five React hooks (`useEntity`, `useService`, `useHistory`, `useArea`, `useTheme`) that talk to HA over the same WebSocket the rest of the frontend uses. No tokens, no CORS, no extra auth — the panel iframe inherits HA's session.

Landing: [stoke.dev](https://stoke.dev) · Docs: [docs.stoke.dev](https://docs.stoke.dev)

## Why

Home Assistant's frontend is excellent but opinionated. If you want a dashboard that doesn't look or behave like Lovelace — a kiosk display, a wall tablet, a brand-specific control room — you currently have to choose between writing custom cards (still Lovelace) or hosting a separate web app (auth nightmare). This project gives you the third option: a real React app, served by HA itself, talking to HA's live state with one-line hooks.

## Quick start

```bash
# 1. Scaffold a fresh project
npx create-stoke my-dashboard
cd my-dashboard

# 2. Install + dev
npm install
cp .env.example .env.local   # set VITE_HA_URL to your HA instance
npm run dev                  # http://localhost:5173 with HMR

# 3. Build + deploy
npm run sync                 # builds and copies into custom_components/
# Copy the whole repo into your HA config dir (or install via HACS)
# Restart HA, then: Settings → Devices → Add Integration → "Stoke"
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

| Capability                                | State |
| ----------------------------------------- | ----- |
| Iframe panel registration (Python)        | ✅    |
| Multi-dashboard ConfigFlow + OptionsFlow  | ✅    |
| Standalone `/custom-dashboard/<slug>/`    | ✅    |
| Multi-template registry + install service | ✅    |
| `useEntity` / `useService` / `useHistory` | ✅    |
| `useArea` (entities per area)             | ✅    |
| `useTheme` (HA theme tokens)              | ✅    |
| CLI scaffold (`create-stoke`)           | ✅    |
| Docs site (VitePress, `docs/`)            | ✅    |
| Landing page (Astro, `site/`)             | ✅    |
| Template library + registry schema        | ✅    |
| HACS custom repository                    | ✅    |
| HACS default repository submission        | ⏳    |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Bug reports and PRs welcome — please open an issue before sending large changes so we can align on direction.

## License

[Apache 2.0](./LICENSE).
