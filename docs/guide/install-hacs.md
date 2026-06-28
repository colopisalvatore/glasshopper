# Install via HACS

[HACS](https://hacs.xyz) is the community store for Home Assistant. Until Glasshopper is in the default repository, install it as a custom repository.

## Add as custom repository

1. Open HACS in your HA sidebar.
2. Click the menu (⋮) → **Custom repositories**.
3. URL: `https://github.com/colopisalvatore/glasshopper`
4. Category: **Integration**
5. Click **Add**.

HACS will index the repo. Search for **Glasshopper** and click **Download** on the latest release.

## After download

1. Restart Home Assistant. (**Developer Tools → YAML → Restart**.)
2. **Settings → Devices → Add Integration → "Glasshopper"** → confirm. This is a
   one-time setup; you do **not** add the integration again per dashboard.
3. A **Glasshopper** entry appears in your sidebar — that's the **Manager**.

## Manage everything from the Manager panel

Open **Glasshopper** in the sidebar (admin only). Three tabs:

- **Dashboards** — *Add dashboard*: pick a template, set a title, slug and icon,
  and it appears in the sidebar instantly. Edit or delete any dashboard inline.
- **Catalog** — install the free templates (Aria, Grid, Pulse) with one click;
  premium templates link out to the store.
- **Templates** — install from a `.zip` **URL** or **upload a `.zip`** directly;
  remove templates you no longer use.

No YAML, no per-dashboard "Add integration", no service calls. (The
`glasshopper.install_template` / `reload_templates` / `remove_template` services
still work for power users and automations.)

## Updating

Open HACS → Glasshopper → **Update**. Restart HA. Existing dashboards keep working — only the integration code changes.
