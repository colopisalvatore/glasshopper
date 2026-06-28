"""One-time migration: legacy per-dashboard config entries -> Store list.

Pre-0.3.0 every dashboard was its own config entry. From 0.3.0 dashboards live
in a single Store list owned by the hub entry. This imports the legacy entries
once, then removes them. Idempotent: guarded by the Store `migrated` flag and
slug dedupe, and entries are only removed after the Store is saved.
"""

from __future__ import annotations

import logging
import uuid

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import (
    CONF_HUB,
    CONF_ICON,
    CONF_PUBLIC,
    CONF_REQUIRE_ADMIN,
    CONF_SLUG,
    CONF_TEMPLATE_ID,
    CONF_TITLE,
    DEFAULT_ICON,
    DOMAIN,
)
from .store import GlasshopperStore

_LOGGER = logging.getLogger(__name__)


def _is_legacy_dashboard(entry: ConfigEntry) -> bool:
    if entry.data.get(CONF_HUB):
        return False
    merged = {**entry.data, **entry.options}
    return bool(merged.get(CONF_SLUG)) and bool(merged.get(CONF_TEMPLATE_ID))


async def async_migrate_legacy_entries(
    hass: HomeAssistant, store: GlasshopperStore
) -> None:
    """Import legacy per-dashboard entries into the Store, then remove them."""
    if store.migrated:
        return

    legacy = [
        e
        for e in hass.config_entries.async_entries(DOMAIN)
        if _is_legacy_dashboard(e)
    ]

    for entry in legacy:
        merged = {**entry.data, **entry.options}
        slug = merged[CONF_SLUG]
        if store.slug_exists(slug):
            continue
        store.add(
            {
                "id": uuid.uuid4().hex,
                CONF_SLUG: slug,
                CONF_TITLE: merged.get(CONF_TITLE) or slug,
                CONF_TEMPLATE_ID: merged[CONF_TEMPLATE_ID],
                CONF_ICON: merged.get(CONF_ICON) or DEFAULT_ICON,
                CONF_REQUIRE_ADMIN: bool(merged.get(CONF_REQUIRE_ADMIN, False)),
                CONF_PUBLIC: bool(merged.get(CONF_PUBLIC, False)),
            }
        )
        _LOGGER.info("glasshopper: migrated legacy dashboard %s", slug)

    store.set_migrated()
    await store.async_save()

    # Remove legacy entries only after the Store is safely persisted, so a crash
    # mid-migration leaves the entries intact and the run can repeat.
    for entry in legacy:
        await hass.config_entries.async_remove(entry.entry_id)
