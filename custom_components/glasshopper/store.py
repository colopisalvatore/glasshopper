"""Storage-backed dashboard list — the canonical source of truth for dashboards.

Replaces one-config-entry-per-dashboard: a single hub entry + the manager panel
own this list. `DATA_ENTRIES_BY_SLUG` (read by the standalone view) is derived
from it on setup.
"""

from __future__ import annotations

import logging
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import STORE_KEY, STORE_VERSION

_LOGGER = logging.getLogger(__name__)

Dashboard = dict[str, Any]


class GlasshopperStore:
    """Thin wrapper over helpers.storage.Store holding the dashboard list."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._store: Store = Store(hass, STORE_VERSION, STORE_KEY)
        self._data: dict[str, Any] = {"migrated": False, "dashboards": []}

    async def async_load(self) -> None:
        data = await self._store.async_load()
        if data:
            self._data = {
                "migrated": bool(data.get("migrated", False)),
                "dashboards": [dict(d) for d in data.get("dashboards", [])],
            }

    async def async_save(self) -> None:
        await self._store.async_save(self._data)

    @property
    def migrated(self) -> bool:
        return bool(self._data.get("migrated"))

    def set_migrated(self) -> None:
        self._data["migrated"] = True

    def list(self) -> list[Dashboard]:
        return [dict(d) for d in self._data["dashboards"]]

    def get(self, dash_id: str) -> Dashboard | None:
        for d in self._data["dashboards"]:
            if d["id"] == dash_id:
                return dict(d)
        return None

    def slug_exists(self, slug: str, *, exclude_id: str | None = None) -> bool:
        return any(
            d["slug"] == slug and d["id"] != exclude_id
            for d in self._data["dashboards"]
        )

    def add(self, dash: Dashboard) -> None:
        self._data["dashboards"].append(dict(dash))

    def update(self, dash_id: str, patch: dict[str, Any]) -> Dashboard | None:
        for d in self._data["dashboards"]:
            if d["id"] == dash_id:
                d.update(patch)
                return dict(d)
        return None

    def remove(self, dash_id: str) -> Dashboard | None:
        for i, d in enumerate(self._data["dashboards"]):
            if d["id"] == dash_id:
                return self._data["dashboards"].pop(i)
        return None
