"""Built-in catalog of installable templates.

Free entries carry a `url` (a GitHub Release asset) and install 1-click; premium
entries carry a `storeUrl` and link out to the store. Loaded once (off-loop) and
cached.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from homeassistant.core import HomeAssistant

from .const import CATALOG_FILE, DATA_REGISTRY, DOMAIN
from .registry import TemplateRegistry

_LOGGER = logging.getLogger(__name__)

_CACHE: list[dict[str, Any]] | None = None


def _read_catalog() -> list[dict[str, Any]]:
    path = Path(__file__).parent / CATALOG_FILE
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except (OSError, ValueError) as exc:
        _LOGGER.error("glasshopper: failed loading catalog: %s", exc)
        return []


async def async_preload(hass: HomeAssistant) -> None:
    """Read + cache the catalog off the event loop (called once on setup)."""
    global _CACHE
    if _CACHE is None:
        _CACHE = await hass.async_add_executor_job(_read_catalog)


def _entries() -> list[dict[str, Any]]:
    return _CACHE if _CACHE is not None else _read_catalog()


def list_entries(hass: HomeAssistant) -> list[dict[str, Any]]:
    """Catalog entries annotated with `installed` against the live registry."""
    registry: TemplateRegistry = hass.data[DOMAIN][DATA_REGISTRY]
    return [
        {**entry, "installed": registry.get(entry["id"]) is not None}
        for entry in _entries()
    ]


def get(entry_id: str) -> dict[str, Any] | None:
    for entry in _entries():
        if entry.get("id") == entry_id:
            return entry
    return None
