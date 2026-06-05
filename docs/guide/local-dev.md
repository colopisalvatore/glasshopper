# Local development

The scaffold runs in two modes:

| Mode       | When                            | Auth                                       | Use                                |
| ---------- | ------------------------------- | ------------------------------------------ | ---------------------------------- |
| Panel      | Loaded inside the HA iframe     | Inherited from parent `hassConnection`     | Production / what users see        |
| Standalone | `npm run dev` outside HA        | Long-lived token (URL or localStorage)     | Hot-reload while building          |

The hooks and the React tree are identical — only the connection bridge differs.

## Setup

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
VITE_HA_URL=http://homeassistant.local:8123
```

This must be the URL your **browser** can reach (not HA's container hostname). For a remote HA, use the public URL.

## Get a token

In HA: **Profile → Security → Long-lived access tokens → Create token**.

Copy the token. You will paste it once in the URL.

## Run

```bash
npm run dev
# Open http://localhost:5173/?token=PASTE_TOKEN_HERE
```

The token is saved to `localStorage` under `glasshopper_token`. Reload without the `?token=` next time.

## Hot reload

Vite proxies `/api`, `/auth`, and `/static` to your HA instance, so the WebSocket and REST calls work through `localhost:5173`. Changes to TS/TSX/CSS hot-reload without a refresh.

## Verifying the connection

The scaffold shows a status pill:

- `connecting` — establishing WebSocket.
- `connected` — entity stream is live.
- `disconnected` — lost connection (auto-reconnects).
- `error` — initial auth failed. Check the console for the message.

## Switching to panel mode

Nothing to switch. The connection logic detects `window.parent.hassConnection`. When you build and ship, panel mode kicks in automatically.

```bash
npm run sync
```

This builds with `VITE_BASE=/glasshopper_files/` so asset URLs resolve under HA's static path.

## Tips

- Edit `src/App.tsx` to start — the scaffold is meant to be replaced.
- The hooks live in `src/hooks/`. Look at `useEntity.ts` to see how `useSyncExternalStore` is wired.
- The connection bridge is in `src/lib/haConnection.ts`. You normally don't need to touch it.
