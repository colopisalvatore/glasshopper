# Aria — Glasshopper dashboard

A calm single-room glance for Home Assistant. Warm neutral and light-first with a dark variant, it pairs a greeting and clock with live climate, a hand-drawn 24h temperature curve, soft light and switch tiles, and a morning/evening scene row over one amber clay accent.

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

- **Temperature** — one `sensor` entity · **required**
  The room temperature sensor shown big in the climate strip.
- **Humidity** — one `sensor` entity
  Optional. A humidity sensor for the climate strip.
- **Thermostat** — one `climate` entity
  Optional. A climate entity — shows the target setpoint and mode.
- **24h history** — one `sensor` entity
  Optional. The sensor plotted over 24 hours. Defaults to Temperature.
- **Lights & switches** — any number of `light` / `switch` entities
  The toggle tiles in the Room grid.
- **Scenes** — any number of `scene` entities
  The scene buttons.

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
