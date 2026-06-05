# FAQ

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
