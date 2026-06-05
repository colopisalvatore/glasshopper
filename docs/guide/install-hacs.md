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
2. **Settings → Devices → Add Integration → "Glasshopper"**.
3. The bundled **Minimal** template is already there. Pick it, set a sidebar
   title and a URL slug, submit. Your dashboard appears in the sidebar.

No service calls, no YAML: a fresh install always has the Minimal template
ready, because the integration ships it and seeds it on startup.

## Installing more templates

A premium or community template ships as a `.zip` with a download URL. You do
**not** need YAML:

1. **Settings → Devices → Add Integration → "Glasshopper"**.
2. Paste the URL into **"Install another template from a URL"** and submit.
3. It downloads, then appears in the **Template** dropdown. Pick it, finish the
   form.

Prefer YAML? The `glasshopper.install_template` service still works (see
[Build a custom template](/templates/build)).

## Updating

Open HACS → Glasshopper → **Update**. Restart HA. Existing dashboards keep working — only the integration code changes.
