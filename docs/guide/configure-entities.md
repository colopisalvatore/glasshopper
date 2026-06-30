# Configure entities

A Glasshopper dashboard ships as a **compiled build**. It doesn't know your
Home Assistant entity ids ahead of time, so out of the box its cards show
example (demo) entities. You map each card to **your** entities from inside the
dashboard — no source edit, no rebuild.

This is the supported way to make a downloaded dashboard show your data. (Older
templates told you to edit `src/App.tsx`; that only worked if you built from
source. The setup wizard replaces it.)

## The setup wizard

1. Open the dashboard. The first time it loads against your Home Assistant, the
   **Connect your entities** wizard opens automatically.
2. For each card, pick an entity. Type to search by friendly name or entity id;
   the list is filtered to the domains that card accepts (e.g. a light tile
   offers `light` and `switch` entities).
3. Some cards take **one** entity (temperature, thermostat); others take **any
   number** (lights, scenes) — use **+ Add** to append rows, **×** to remove one.
4. Press **Done**. The dashboard immediately re-renders against your entities,
   and the mapping is saved.

Required cards are marked with `*`; **Done** stays disabled until they're filled.

## Changing the mapping later

The wizard auto-opens only once per dashboard. To change entities afterwards,
click the ⚙ **Entities** button (bottom-right of the dashboard). Clear a field
with **×** and pick another, then **Done**.

## Before you set up

Until you finish (or skip) setup, the cards use the template's example
entities, so a fresh install reads as a demo to customise — not a broken, empty
screen. The demo entities almost certainly don't exist in your Home Assistant,
so those cards will read as unavailable until you map your own.

## One mapping per dashboard

Each dashboard keeps its **own** mapping. If you add the same template twice
(say a "Living room" panel and a "Bedroom" panel, see
[Multi-dashboard](./multi-dashboard)), each one is configured independently —
map "Living room" to your living-room entities and "Bedroom" to the bedroom's.

## Where the mapping is saved

The mapping is stored in the dashboard's **browser storage**, keyed per
dashboard. Practically:

- It persists across reloads and restarts on that browser/device.
- It is **not** yet synced across browsers or devices — set up each device once.
  (Moving the mapping into Home Assistant storage so it syncs everywhere is on
  the roadmap.)
- Clearing site data for your Home Assistant origin clears it; just re-run the
  wizard.

## Troubleshooting

- **A card is empty or shows `--`.** The mapped entity is missing or
  unavailable in Home Assistant. Open ⚙ **Entities** and re-pick it, or check
  the entity exists under **Developer Tools → States**.
- **The wizard didn't open.** It auto-opens only once per dashboard. Click
  ⚙ **Entities**.
- **The picker says "Waiting for Home Assistant…".** The dashboard hasn't
  connected yet. In a panel it shares HA's session automatically; standalone/dev
  needs a token (see [Local development](./local-dev)).
- **I don't see the ⚙ button.** It appears once a real Home Assistant is
  connected (so it stays off the public demo). Open the dashboard inside your HA.

## Which templates support this

The in-dashboard setup wizard is rolling out across the template library, one
template at a time. A template supports it when its download contains a
`README.md` listing the entities it maps. Templates without it still work, but
are configured by editing the source and rebuilding.

## For template authors

A template declares the entities it maps in `src/slots.ts` — the single source
of truth that drives the wizard, the runtime mapping, and the generated
`README.md`. See [Build your own template](/templates/build) for the slot
schema and how to wire a template onto the config system.
