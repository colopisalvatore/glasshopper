# Install via HACS

[HACS](https://hacs.xyz) is the community store for Home Assistant. Until Glasshopper is in the default repository, install it as a custom repository.

## One-click (recommended)

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=colopisalvatore&repository=glasshopper&category=integration)

This opens HACS on your own instance with the repository **and the category already
filled in**, then click **Download**. Nothing to type, no dropdown to fight with.

## Add as custom repository (manual route)

1. Open HACS in your HA sidebar.
2. Click the menu (⋮) → **Custom repositories**.
3. URL: `https://github.com/colopisalvatore/glasshopper`
4. Category / Type: **Integration**
5. Click **Add**.

HACS will index the repo. Search for **Glasshopper** and click **Download** on the latest release.

::: tip The Category / Type dropdown won't open?
It happens on some HACS versions and inside the Companion app. Two ways around it:

- use the **one-click badge** above, which carries the category in the link, or
- open HACS in a desktop browser (not the app) and retry, or
- skip HACS entirely — see [Manual install](#manual-install-no-hacs) below.

The category is always **Integration**, even though Glasshopper ships dashboards:
what you install is the `glasshopper` custom integration, which then serves the
dashboards. It is not a Lovelace plugin/theme, so those categories will reject the repo.
:::

## Manual install (no HACS)

HACS is a convenience, not a requirement. The integration is a plain custom component.

1. Download **`glasshopper.zip`** from the
   [latest release](https://github.com/colopisalvatore/glasshopper/releases/latest).
2. Unzip it. You get a single folder named `glasshopper/`.
3. Copy that folder into your HA config dir under `custom_components/`, so you end up with:

   ```
   <config>/custom_components/glasshopper/manifest.json
   ```

   Use the **Samba**, **SSH & Web Terminal**, or **Studio Code Server** add-on to reach
   `<config>` — it's the folder holding `configuration.yaml`.
4. Restart Home Assistant.
5. Continue with [After download](#after-download) below.

To update a manual install, delete `custom_components/glasshopper/` and repeat with the
newer zip, then restart. Manual installs get no HACS update notifications — watch
[Releases](https://github.com/colopisalvatore/glasshopper/releases) instead.

## After download

1. Restart Home Assistant. (**Developer Tools → YAML → Restart**.)
2. **Settings → Devices → Add Integration → "Glasshopper"** → confirm. This is a
   one-time setup; you do **not** add the integration again per dashboard.

   [![Open your Home Assistant instance and start setting up a new integration.](https://my.home-assistant.io/badges/config_flow_start.svg)](https://my.home-assistant.io/redirect/config_flow_start/?domain=glasshopper)

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

## Connect your entities

Your new dashboard opens with example (demo) entities. The first time you open it
against your Home Assistant, a **Connect your entities** wizard appears — map each
card to your own entities, with no code and no YAML. Reopen it any time from the
⚙️ **Entities** button on the dashboard.

Full walkthrough: [Configure entities](./configure-entities).

## Updating

Open HACS → Glasshopper → **Update**. Restart HA. Existing dashboards keep working — only the integration code changes.
