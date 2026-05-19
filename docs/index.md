---
layout: home

hero:
  name: Scry
  text: React dashboards for Home Assistant.
  tagline: See everything. Native panels, five hooks, zero auth.
  actions:
    - theme: brand
      text: Quickstart
      link: /guide/quickstart
    - theme: alt
      text: View on GitHub
      link: https://github.com/colopisalvatore/ha-react-ui

features:
  - title: Real panels, not iframes
    details: Install via HACS, configure from the HA UI. Each dashboard appears in the sidebar like a built-in.
  - title: Inherits HA's session
    details: No long-lived tokens. No CORS. The panel reuses the WebSocket your HA frontend already has open.
  - title: Five hooks, one bundle
    details: useEntity, useService, useHistory, useArea, useTheme. That's the whole API surface.
  - title: Multi-dashboard
    details: One install, many dashboards. Each has its own slug, sidebar icon, and admin gate.
  - title: Local-first dev loop
    details: Vite HMR against your live HA instance over a long-lived token in dev. Same code in panel mode.
  - title: Template ecosystem
    details: Install community or premium templates via a service call. Bring your own bundle.
---
