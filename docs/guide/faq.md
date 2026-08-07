# FAQ

## HACS won't let me pick the Category / Type — can I install another way?

Yes, two ways. Use the one-click badge on
[Install via HACS](./install-hacs#one-click-recommended): it opens the dialog with the
repository *and* the category pre-filled, so the dropdown never comes into play. Or skip
HACS entirely and drop the folder in by hand —
[Manual install](./install-hacs#manual-install-no-hacs).

The category is always **Integration**. Glasshopper ships dashboards, but what you
install is a custom integration that then serves them; it's not a Lovelace plugin or a
theme, so those categories will refuse the repo.

## My dashboard's cards are empty — how do I show my data?

A downloaded dashboard ships compiled and uses example entities until you map it
to yours. Open it inside Home Assistant and use the **Connect your entities**
wizard (it auto-opens on first run; reopen from the ⚙ **Entities** button) to
point each card at your entities. Full steps:
[Configure entities](./configure-entities).

## Why React and not just Lovelace cards?

Lovelace cards are great for tile-based dashboards. If you want a UI that
doesn't look or behave like Lovelace — a kiosk display, a wall tablet, a
brand-specific control room — you're better off with a full React app served
by HA itself than fighting against the card system.

## How is auth handled?

In panel mode the bundle is loaded inside HA's iframe and inherits
`window.parent.hassConnection` — same session as the rest of the frontend. No
tokens, no CORS.

In dev / standalone mode you provide a long-lived access token. It's stored
in `localStorage`. Don't ship a token with your code.

## Does the panel work behind a reverse proxy?

Yes, as long as the proxy forwards WebSocket upgrades (`/api/websocket`).
Same-origin is required for the iframe bridge to work — HA and the panel iframe
must be on the same scheme + host + port from the browser's point of view.

## Does it work on iPad / iPhone?

Yes. The standalone URL (`/custom-dashboard/<slug>/`) can be installed as a
PWA — add to home screen, then it launches fullscreen. The HA companion app
also renders panels in a WebView, so it works there too.

## How do I update without losing my dashboards?

The integration code lives in `custom_components/glasshopper/`. The
ConfigEntries that hold your dashboards live in HA's storage (`.storage/`).
Updating one doesn't affect the other.

When updating: HACS replaces the integration files; ConfigEntries stay
intact; your installed templates in `<config>/glasshopper_templates/` are
untouched.

## How do I update an installed template to a newer build?

::: warning Known limitation
There is no one-click template update yet. Installed templates show as
"Installed" with no update control, so a newer build (for example, one that adds
the entity setup wizard) does **not** arrive automatically. A proper **Update**
button is planned; for now, remove and reinstall.
:::

Workaround — delete the template and download it fresh:

1. Open **Manager → Templates**. If a dashboard still uses the template,
   **Remove** is blocked, so delete that dashboard first (note its slug).
2. **Remove** the template.
3. Open **Manager → Catalog** and **Install** it again — this pulls the latest
   build from the catalog.
4. Recreate the dashboard (reuse the same slug to keep its entity mapping, which
   is stored per-dashboard in HA, not inside the template).
5. Open the dashboard and hard-refresh (`Ctrl+Shift+R`) — the dashboard iframe
   caches the old bundle.

## What's the API stability story?

Pre-1.0 — minor versions may rename hooks or change service signatures. After
1.0, the five hooks and three services are stable. Internal Python details
(class names, module layout) are not part of the public API.

## Where are templates stored?

`<config>/glasshopper_templates/<id>/`. Created automatically by the
integration. Anything you drop there shows up in the template picker after a
`reload_templates` call.

## How is this different from `panel_custom`?

`panel_custom` lets you point HA at a JS file. You handle bundling, auth,
asset paths, multi-dashboard config, and updates yourself.

Glasshopper gives you: HACS install, UI config flow, multi-dashboard,
standalone URLs, public-mode gating, install-from-zip service, and a
TypeScript hook API to call from React. The scaffold and CLI cover the dev
loop.

## Can I share my dashboard with others?

Yes — package your built bundle as a template zip and host the URL. Anyone
running Glasshopper can install it with `glasshopper.install_template`.

See [Build your own template](/templates/build).
