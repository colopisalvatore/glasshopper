# Pulse — Glasshopper dashboard

A quiet sensor monitoring ops panel for Home Assistant. Live readouts in tabular numerals, animated inline-SVG sparklines, a radial gauge, and min/avg/peak stats over a tinted near-black surface with one cool cyan accent.

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
  The hero gauge sensor.
- **Humidity** — one `sensor` entity
  Optional.
- **Power** — one `sensor` entity
  Optional.
- **CO₂** — one `sensor` entity
  Optional.
- **Pressure** — one `sensor` entity
  Optional.

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
