"""HA React UI integration.

Multi-template platform: discovers user-installed templates from
<config>/ha_react_ui_templates/<id>/, registers a static path per template
under /ha_react_ui_files/<id>/, and creates one iframe sidebar panel per
ConfigEntry. Each entry also gets a standalone full-page route at
/custom-dashboard/<slug> served by the StandaloneDashboardView.
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

from . import services as services_module
from . import views as views_module
from .const import (
    CONF_ICON,
    CONF_PUBLIC,
    CONF_REQUIRE_ADMIN,
    CONF_SLUG,
    CONF_TEMPLATE_ID,
    CONF_TITLE,
    DATA_ENTRIES_BY_SLUG,
    DATA_REGISTERED_STATICS,
    DATA_REGISTRY,
    DEFAULT_ICON,
    DOMAIN,
    FRONTEND_INDEX,
    URL_STATIC_BASE,
)
from .registry import TemplateRegistry

_LOGGER = logging.getLogger(__name__)


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """One-time setup: build registry, register services + standalone view."""
    domain_data = hass.data.setdefault(DOMAIN, {})

    if DATA_REGISTRY not in domain_data:
        registry = TemplateRegistry(Path(hass.config.path()))
        await hass.async_add_executor_job(registry.scan)
        domain_data[DATA_REGISTRY] = registry
        domain_data[DATA_REGISTERED_STATICS] = set()
        domain_data[DATA_ENTRIES_BY_SLUG] = {}

    services_module.register(hass)
    views_module.register(hass)
    return True


async def _ensure_static_for_template(hass: HomeAssistant, template_id: str) -> bool:
    """Register the per-template static path on demand (idempotent)."""
    domain_data = hass.data[DOMAIN]
    registry: TemplateRegistry = domain_data[DATA_REGISTRY]
    statics: set = domain_data[DATA_REGISTERED_STATICS]

    if template_id in statics:
        return True

    tpl = registry.get(template_id)
    if tpl is None:
        _LOGGER.error("ha_react_ui: cannot register static for missing template %s", template_id)
        return False

    url = f"{URL_STATIC_BASE}/{template_id}"
    await hass.http.async_register_static_paths(
        [StaticPathConfig(url, str(tpl.path), cache_headers=False)]
    )
    statics.add(template_id)
    _LOGGER.info("ha_react_ui: registered static %s -> %s", url, tpl.path)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Register an iframe panel + standalone slug for this dashboard entry."""
    data = {**entry.data, **entry.options}

    slug: str = data[CONF_SLUG]
    title: str = data[CONF_TITLE]
    icon: str = data.get(CONF_ICON) or DEFAULT_ICON
    require_admin: bool = bool(data.get(CONF_REQUIRE_ADMIN, False))
    template_id: str = data[CONF_TEMPLATE_ID]
    public: bool = bool(data.get(CONF_PUBLIC, False))

    domain_data = hass.data.setdefault(DOMAIN, {})
    registry: TemplateRegistry = domain_data[DATA_REGISTRY]

    if registry.get(template_id) is None:
        _LOGGER.error(
            "ha_react_ui: entry %s references template %s which is not installed",
            slug,
            template_id,
        )
        return False

    if not await _ensure_static_for_template(hass, template_id):
        return False

    async_register_built_in_panel(
        hass,
        component_name="iframe",
        sidebar_title=title,
        sidebar_icon=icon,
        frontend_url_path=slug,
        config={"url": f"{URL_STATIC_BASE}/{template_id}/{FRONTEND_INDEX}"},
        require_admin=require_admin,
    )

    domain_data[DATA_ENTRIES_BY_SLUG][slug] = {
        "entry_id": entry.entry_id,
        "template_id": template_id,
        "public": public,
    }

    entry.async_on_unload(entry.add_update_listener(_async_update_listener))
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Remove the iframe panel and the slug mapping for this entry."""
    slug = entry.data[CONF_SLUG]
    domain_data = hass.data.get(DOMAIN, {})
    try:
        async_remove_panel(hass, slug)
    except Exception:  # noqa: BLE001
        _LOGGER.exception("ha_react_ui: failed to remove panel %s", slug)
        return False

    entries_by_slug: dict = domain_data.get(DATA_ENTRIES_BY_SLUG, {})
    entries_by_slug.pop(slug, None)
    return True


async def _async_update_listener(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Re-register the panel when options change."""
    await async_unload_entry(hass, entry)
    await async_setup_entry(hass, entry)
