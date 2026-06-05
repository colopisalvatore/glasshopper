# Quickstart

Get a working React dashboard running inside Home Assistant in under five minutes.

## Prerequisites

- A reachable Home Assistant instance (Core, Supervised, or OS).
- Node.js **20+** and npm.
- File access to HA's config directory (HACS works too — see [Install via HACS](./install-hacs)).

## 1. Scaffold a project

```bash
npx create-glasshopper my-dashboard
cd my-dashboard
npm install
```

## 2. Configure for dev mode

```bash
cp .env.example .env.local
# Edit .env.local — set VITE_HA_URL to your HA URL.
```

Create a long-lived access token in HA: **Profile → Security → Long-lived access tokens**.

## 3. Run the dev server

```bash
npm run dev
# Open http://localhost:5173/?token=YOUR_LONG_LIVED_TOKEN
```

The token is cached in localStorage so you only need it on the URL once.

You should see the scaffold UI with a `connected` status pill, a `sun.sun` card, and area entities.

## 4. Build and ship to HA

```bash
npm run sync
# Builds dist/ and copies it into custom_components/glasshopper/frontend/
```

Copy the `custom_components/glasshopper/` folder into your HA `config/custom_components/`. Restart HA.

## 5. Register the panel

In HA: **Settings → Devices → Add Integration → "Glasshopper"**.

Fill in:

- **Template** — pick `minimal` (or any installed template).
- **Sidebar title** — what shows in the HA sidebar.
- **URL slug** — `react-dashboard` (lowercase, 2–31 chars).
- **Icon** — any `mdi:*` icon.

Submit. A new sidebar entry appears — click it to load your dashboard.

## Next

- [Multi-dashboard setup](./multi-dashboard)
- [Hooks API](/hooks/useEntity)
- [Build a custom template](/templates/build)
