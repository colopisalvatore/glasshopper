"""HA React UI integration.

Registers a static path serving the bundled React frontend and creates one
iframe panel per ConfigEntry. Each entry maps to a sidebar item the user
can configure via the UI (title, slug, icon, admin-only).
"""

from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components.frontend import (
    async_register_built_in_panel,
    async_remove_panel,
)
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import (
    CONF_ICON,
    CONF_REQUIRE_ADMIN,
    CONF_SLUG,
    CONF_TITLE,
    DEFAULT_ICON,
    DOMAIN,
    FRONTEND_FOLDER,
    FRONTEND_INDEX,
    URL_STATIC_BASE,
)

_LOGGER = logging.getLogger(__name__)

_STATIC_REGISTERED = "static_registered"


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Register the static asset path once for all dashboards."""
    hass.data.setdefault(DOMAIN, {})

    if hass.data[DOMAIN].get(_STATIC_REGISTERED):
        return True

    frontend_dir = Path(__file__).parent / FRONTEND_FOLDER
    if not (frontend_dir / FRONTEND_INDEX).is_file():
        _LOGGER.warning(
            "ha_react_ui: frontend bundle missing at %s. "
            "Run `npm run sync` to build and copy the React app.",
            frontend_dir,
        )

    await hass.http.async_register_static_paths(
        [StaticPathConfig(URL_STATIC_BASE, str(frontend_dir), cache_headers=False)]
    )
    hass.data[DOMAIN][_STATIC_REGISTERED] = True
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Register an iframe panel for this dashboard entry."""
    data = {**entry.data, **entry.options}

    slug: str = data[CONF_SLUG]
    title: str = data[CONF_TITLE]
    icon: str = data.get(CONF_ICON) or DEFAULT_ICON
    require_admin: bool = bool(data.get(CONF_REQUIRE_ADMIN, False))

    async_register_built_in_panel(
        hass,
        component_name="iframe",
        sidebar_title=title,
        sidebar_icon=icon,
        frontend_url_path=slug,
        config={"url": f"{URL_STATIC_BASE}/{FRONTEND_INDEX}"},
        require_admin=require_admin,
    )

    entry.async_on_unload(entry.add_update_listener(_async_update_listener))
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Remove the iframe panel for this entry."""
    slug = entry.data[CONF_SLUG]
    try:
        async_remove_panel(hass, slug)
    except Exception:  # noqa: BLE001
        _LOGGER.exception("ha_react_ui: failed to remove panel %s", slug)
        return False
    return True


async def _async_update_listener(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Re-register the panel when options change."""
    await async_unload_entry(hass, entry)
    await async_setup_entry(hass, entry)
