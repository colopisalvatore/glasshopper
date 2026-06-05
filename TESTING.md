# Testing Guide

How to deploy `glasshopper` to a Home Assistant instance running in Docker on a remote server and verify the integration works end-to-end.

## Prerequisites

- Home Assistant Core or HA OS, running in Docker on a reachable host (miniserver, NAS, VPS).
- SSH access to that host, or a shared volume mounted into the HA container.
- Local repo at `C:\Dev\glasshopper` with a built bundle in `custom_components/glasshopper/frontend/`.
  - If missing, run `npm run sync` from the repo root.

## 1. Copy the integration into HA's `config/` directory

The HA container expects custom integrations under `<config_dir>/custom_components/`. Copy only the `glasshopper` folder — not the whole repo.

### Option A — `scp` from Windows PowerShell

```powershell
scp -r C:\Dev\glasshopper\custom_components\glasshopper `
    user@miniserver:/path/to/ha/config/custom_components/
```

### Option B — `rsync` (faster on incremental updates)

```bash
rsync -avz --delete `
  C:/Dev/glasshopper/custom_components/glasshopper/ `
  user@miniserver:/path/to/ha/config/custom_components/glasshopper/
```

### Option C — shared volume

If the HA `config` dir is a Docker volume mounted from a path you can write to (e.g. a Samba share), copy the folder there directly.

## 2. Restart Home Assistant

```bash
ssh user@miniserver "docker restart homeassistant"
```

Wait ~30s for HA to fully start. Watch the log if needed:

```bash
ssh user@miniserver "docker logs -f homeassistant" | grep -i glasshopper
```

## 3. Add the integration from the HA UI

1. Open HA in your browser.
2. **Settings → Devices & Services → + Add Integration**.
3. Search for **"Glasshopper"** and select it.
4. Fill in the ConfigFlow:
   - **Sidebar title**: `React Dashboard` (whatever you want)
   - **URL slug**: `react-dashboard` (lowercase, 2–31 chars, letters/digits/`-`/`_`)
   - **Icon**: `mdi:view-dashboard` (any MDI icon name)
   - **Admin only**: leave off for a first test
5. Submit. A new sidebar entry appears with the title and icon you chose.

## 4. Open the dashboard

Click the new sidebar entry. You should see the scaffold demo:

- A status badge (`connected` once the WebSocket bridge is up).
- A card for `sun.sun` showing state + elevation.
- A card for `light.living_room` with a turn-on / turn-off button.

If `light.living_room` does not exist on your HA instance, the card will say `entity not found`. To swap entities, edit `src/App.tsx` in the repo, then re-run `npm run sync` and re-copy `custom_components/glasshopper/frontend/` to the server.

## 5. Add more dashboards (multi-panel)

Repeat step 3 with a different slug. Each ConfigEntry registers its own sidebar panel pointing at the same bundle. The React app sees `window.location.pathname` and can route accordingly.

## Troubleshooting

### Integration not found in the "Add Integration" search

- HA didn't pick up the new component. Check `docker logs homeassistant` for errors mentioning `glasshopper`.
- Verify `manifest.json` exists at `<config>/custom_components/glasshopper/manifest.json`.
- Make sure you copied the folder, not just its contents.

### Panel loads but shows "App non avviata" / blank

- The bundle didn't load. Open browser DevTools → Network → look for failed requests to `/glasshopper_files/...`.
- Verify `<config>/custom_components/glasshopper/frontend/index.html` exists and references `/glasshopper_files/assets/...`.
- If asset paths look wrong, re-run `npm run sync` locally and recopy.

### Status badge stuck on `connecting`

- The bridge to `window.parent.hassConnection` failed. The iframe is probably cross-origin (HA behind a reverse proxy on a different domain than the panel).
- Check the browser console — there should be a CORS / cross-origin frame access error.
- Same-origin requires HA and the iframe served from the same scheme+host+port. Use HA's built-in URL, not an external proxy with a different domain.

### "entity not found" for every entity

- The connection isn't producing state updates. Check the status badge — if it's `error`, look at `getLastError()` in the console.
- Confirm the user that loaded the dashboard has permission to see those entities (admin-only entity? domain restriction?).

### Logs to enable

In `configuration.yaml`:

```yaml
logger:
  default: info
  logs:
    custom_components.glasshopper: debug
```

Restart HA after editing.

## Iterating on the React app

```bash
# 1. Edit src/App.tsx (or anything else)
# 2. Build + copy
npm run sync
# 3. Recopy frontend/ to the server
rsync -avz --delete `
  C:/Dev/glasshopper/custom_components/glasshopper/frontend/ `
  user@miniserver:/path/to/ha/config/custom_components/glasshopper/frontend/
# 4. Hard-refresh the panel (Ctrl+Shift+R) — no HA restart needed for frontend-only changes
```

If you change Python (`__init__.py`, `config_flow.py`, etc.) you must restart HA for the changes to take effect.

## Local dev (no HA round-trip)

Set up a long-lived access token in HA (profile → security → long-lived tokens), then:

```bash
cp .env.example .env.local
# edit .env.local: VITE_HA_URL=http://miniserver:8123
npm run dev
# open http://localhost:5173/?token=YOUR_LONG_LIVED_TOKEN
```

The token gets cached in `localStorage` so you only need it on the URL once.
