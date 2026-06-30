# Grid — Glasshopper dashboard

A compact Material 3 tile grid for Home Assistant. Many devices at a glance on dynamic tonal surfaces, with rounded responsive auto-fit tiles, inline-SVG icons, live state, area group headers, and one dynamic accent. Tap to toggle. Light and dark.

A React dashboard for Home Assistant. This is a compiled build: you point it at
**your** Home Assistant entities from inside the dashboard — no code edit, no
rebuild.

## Connect your entities

1. Open the dashboard. On first run the **Connect your entities** wizard opens
   automatically. Reopen it any time from the ⚙ **Entities** button.
2. Pick an entity for each card (search by friendly name or entity id).
3. Press **Done**. The dashboard shows your live data, and the mapping is saved
   to this dashboard.

Until you map them, the cards use example entities — so a fresh install reads as
a demo to customise, not an empty screen.

## Entities this dashboard maps

- **Living area** — any number of `light` / `switch` / `fan` / `media_player` entities
  Controllable devices in the Living area group.
- **Climate** — any number of `sensor` / `climate` entities
  Temperature/humidity sensors and thermostats.
- **Doors & power** — any number of `binary_sensor` / `switch` / `lock` / `cover` entities
  Doors, locks and power switches.

## Troubleshooting

- **A card is empty or shows `--`** — the mapped entity is missing or
  unavailable in your Home Assistant. Open ⚙ **Entities** and re-pick it.
- **The wizard didn't open** — it auto-opens only once per dashboard. Click
  ⚙ **Entities** to open it again.
- **Wrong room / want to change one** — open ⚙ **Entities**, clear the field
  (×) and pick another.

The mapping is stored per dashboard, in this dashboard's browser storage. A
different dashboard (different sidebar entry) keeps its own mapping.

---

Full guide: <https://docs.glasshopper.dev/guide/configure-entities>
