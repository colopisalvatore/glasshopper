"""Glasshopper integration — hub model.

A single "hub" config entry owns the admin **Manager** panel and a
storage-backed list of dashboards. Each dashboard is an iframe sidebar panel
plus a standalone `/custom-dashboard/<slug>` route. Templates live in
`<config>/glasshopper_templates/<id>/`. The Manager (a bundled React app in
`manager_app/`) drives all create/edit/remove via the WebSocket API.
"""

from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.config_entries import SOURCE_IMPORT, ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv

from . import catalog as catalog_module
from . import services as services_module
from . import upload as upload_module
from . import views as views_module
from . import websocket as websocket_module
from .const import (
    CONF_HUB,
    CONF_ICON,
    CONF_PUBLIC,
    CONF_REQUIRE_ADMIN,
    CONF_SLUG,
    CONF_TEMPLATE_ID,
    CONF_TITLE,
    DATA_CONFIG_STORE,
    DATA_ENTRIES_BY_SLUG,
    DATA_REGISTERED_STATICS,
    DATA_REGISTRY,
    DATA_STORE,
    DOMAIN,
)
from .migration import async_migrate_legacy_entries
from .panels import (
    async_register_dashboard_panel,
    async_unregister_dashboard_panel,
    register_manager,
    unregister_manager,
)
from .registry import TemplateRegistry
from .store import EntityConfigStore, GlasshopperStore

_LOGGER = logging.getLogger(__name__)

# No YAML config; set up from the single hub config entry.
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Build registry + store, migrate legacy entries, register shared bits."""
    domain_data = hass.data.setdefault(DOMAIN, {})

    if DATA_REGISTRY not in domain_data:
        registry = TemplateRegistry(Path(hass.config.path()))
        await hass.async_add_executor_job(registry.seed_bundled)
        await hass.async_add_executor_job(registry.scan)
        domain_data[DATA_REGISTRY] = registry
        domain_data[DATA_REGISTERED_STATICS] = set()
        domain_data[DATA_ENTRIES_BY_SLUG] = {}

    if DATA_STORE not in domain_data:
        store = GlasshopperStore(hass)
        await store.async_load()
        domain_data[DATA_STORE] = store
        await async_migrate_legacy_entries(hass, store)

    if DATA_CONFIG_STORE not in domain_data:
        config_store = EntityConfigStore(hass)
        await config_store.async_load()
        domain_data[DATA_CONFIG_STORE] = config_store

    await catalog_module.async_preload(hass)
    services_module.register(hass)
    views_module.register(hass)

    # After migration the hub may not exist yet — create it. On a fresh install
    # the user's "Add integration" flow already created it, so this is a no-op.
    if not hass.config_entries.async_entries(DOMAIN):
        hass.async_create_task(
            hass.config_entries.flow.async_init(
                DOMAIN, context={"source": SOURCE_IMPORT}, data={CONF_HUB: True}
            )
        )
    return True


def _legacy_dashboard_from_entry(entry: ConfigEntry) -> dict | None:
    data = {**entry.data, **entry.options}
    if not data.get(CONF_SLUG) or not data.get(CONF_TEMPLATE_ID):
        return None
    return {
        "id": entry.entry_id,
        CONF_SLUG: data[CONF_SLUG],
        CONF_TITLE: data.get(CONF_TITLE),
        CONF_TEMPLATE_ID: data[CONF_TEMPLATE_ID],
        CONF_ICON: data.get(CONF_ICON),
        CONF_REQUIRE_ADMIN: data.get(CONF_REQUIRE_ADMIN),
        CONF_PUBLIC: data.get(CONF_PUBLIC),
    }


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up the hub entry (manager + WS + upload + all dashboards)."""
    domain_data = hass.data.setdefault(DOMAIN, {})

    # A lingering legacy per-dashboard entry (migration normally removes these):
    # register just its single panel for backward-compat.
    if not entry.data.get(CONF_HUB):
        legacy = _legacy_dashboard_from_entry(entry)
        if legacy:
            await async_register_dashboard_panel(hass, legacy)
        return True

    await register_manager(hass)
    websocket_module.register(hass)
    upload_module.register(hass)

    store: GlasshopperStore = domain_data[DATA_STORE]
    for dash in store.list():
        await async_register_dashboard_panel(hass, dash)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Tear down panels for this entry."""
    domain_data = hass.data.get(DOMAIN, {})

    if not entry.data.get(CONF_HUB):
        data = {**entry.data, **entry.options}
        slug = data.get(CONF_SLUG)
        if slug:
            await async_unregister_dashboard_panel(hass, slug)
        return True

    await unregister_manager(hass)
    store: GlasshopperStore | None = domain_data.get(DATA_STORE)
    if store:
        for dash in store.list():
            await async_unregister_dashboard_panel(hass, dash[CONF_SLUG])
    return True
