"""Panel (un)registration helpers.

Shared by setup and the WebSocket API so create/edit/delete and startup all take
the same path. Lives in its own module to avoid a circular import with the
package `__init__` (which the websocket/upload modules would otherwise need).
"""

from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components.frontend import (
    async_register_built_in_panel,
    async_remove_panel,
)
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from .const import (
    CONF_ICON,
    CONF_PUBLIC,
    CONF_REQUIRE_ADMIN,
    CONF_SLUG,
    CONF_TEMPLATE_ID,
    CONF_TITLE,
    DATA_ENTRIES_BY_SLUG,
    DATA_MANAGER_REGISTERED,
    DATA_REGISTERED_STATICS,
    DATA_REGISTRY,
    DEFAULT_ICON,
    DOMAIN,
    FRONTEND_INDEX,
    MANAGER_DIRNAME,
    MANAGER_ICON,
    MANAGER_SLUG,
    MANAGER_TITLE,
    URL_MANAGER_BASE,
    URL_STATIC_BASE,
)
from .registry import TemplateRegistry

_LOGGER = logging.getLogger(__name__)


async def ensure_static_for_template(hass: HomeAssistant, template_id: str) -> bool:
    """Register the per-template static path on demand (idempotent)."""
    domain_data = hass.data[DOMAIN]
    registry: TemplateRegistry = domain_data[DATA_REGISTRY]
    statics: set = domain_data[DATA_REGISTERED_STATICS]

    if template_id in statics:
        return True

    tpl = registry.get(template_id)
    if tpl is None:
        _LOGGER.error("glasshopper: cannot register static for missing template %s", template_id)
        return False

    url = f"{URL_STATIC_BASE}/{template_id}"
    await hass.http.async_register_static_paths(
        [StaticPathConfig(url, str(tpl.path), cache_headers=False)]
    )
    statics.add(template_id)
    return True


async def async_register_dashboard_panel(hass: HomeAssistant, dash: dict) -> bool:
    """Register one dashboard's iframe panel + static path (idempotent by slug)."""
    domain_data = hass.data[DOMAIN]
    slug: str = dash[CONF_SLUG]
    if slug in domain_data[DATA_ENTRIES_BY_SLUG]:
        return True

    template_id: str = dash[CONF_TEMPLATE_ID]
    registry: TemplateRegistry = domain_data[DATA_REGISTRY]
    if registry.get(template_id) is None:
        _LOGGER.error("glasshopper: dashboard %s references missing template %s", slug, template_id)
        return False

    if not await ensure_static_for_template(hass, template_id):
        return False

    async_register_built_in_panel(
        hass,
        component_name="iframe",
        sidebar_title=dash.get(CONF_TITLE) or slug,
        sidebar_icon=dash.get(CONF_ICON) or DEFAULT_ICON,
        frontend_url_path=slug,
        config={"url": f"{URL_STATIC_BASE}/{template_id}/{FRONTEND_INDEX}"},
        require_admin=bool(dash.get(CONF_REQUIRE_ADMIN, False)),
    )

    domain_data[DATA_ENTRIES_BY_SLUG][slug] = {
        "id": dash.get("id"),
        "template_id": template_id,
        "public": bool(dash.get(CONF_PUBLIC, False)),
    }
    return True


async def async_unregister_dashboard_panel(hass: HomeAssistant, slug: str) -> None:
    """Remove a dashboard panel + its slug mapping (idempotent)."""
    entries = hass.data.get(DOMAIN, {}).get(DATA_ENTRIES_BY_SLUG, {})
    if slug not in entries:
        return
    try:
        async_remove_panel(hass, slug)
    except Exception:  # noqa: BLE001
        _LOGGER.exception("glasshopper: failed to remove panel %s", slug)
    entries.pop(slug, None)


def manager_dir() -> Path:
    return Path(__file__).parent / MANAGER_DIRNAME


async def register_manager(hass: HomeAssistant) -> None:
    """Register the single admin Manager panel (idempotent)."""
    domain_data = hass.data[DOMAIN]
    if domain_data.get(DATA_MANAGER_REGISTERED):
        return

    path = manager_dir()
    if not (path / FRONTEND_INDEX).is_file():
        _LOGGER.warning(
            "glasshopper: manager app not built at %s — run `npm run sync:manager`", path
        )
        return

    await hass.http.async_register_static_paths(
        [StaticPathConfig(URL_MANAGER_BASE, str(path), cache_headers=False)]
    )
    async_register_built_in_panel(
        hass,
        component_name="iframe",
        sidebar_title=MANAGER_TITLE,
        sidebar_icon=MANAGER_ICON,
        frontend_url_path=MANAGER_SLUG,
        config={"url": f"{URL_MANAGER_BASE}/{FRONTEND_INDEX}"},
        require_admin=True,
    )
    domain_data[DATA_MANAGER_REGISTERED] = True


async def unregister_manager(hass: HomeAssistant) -> None:
    domain_data = hass.data.get(DOMAIN, {})
    try:
        async_remove_panel(hass, MANAGER_SLUG)
    except Exception:  # noqa: BLE001
        _LOGGER.exception("glasshopper: failed removing manager panel")
    domain_data[DATA_MANAGER_REGISTERED] = False
