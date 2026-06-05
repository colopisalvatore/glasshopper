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
3. Pick a template (you need at least one installed — see below).

## Install your first template

Without a template, the integration has nothing to render. The simplest way:

```yaml
# Developer Tools → Services
service: glasshopper.install_template
data:
  url: https://github.com/colopisalvatore/glasshopper/releases/download/v0.1.0/minimal.zip
```

Or build your own — see [Build a custom template](/templates/build).

After installing a template, run **Services → `glasshopper.reload_templates`** so the integration picks it up.

## Updating

Open HACS → Glasshopper → **Update**. Restart HA. Existing dashboards keep working — only the integration code changes.
