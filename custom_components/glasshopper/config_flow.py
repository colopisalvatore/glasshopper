"""Single-instance hub config flow.

Glasshopper now has exactly one config entry (the "hub"); dashboards are managed
from the Manager panel, not from per-dashboard config entries.
"""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.config_entries import ConfigFlow, ConfigFlowResult

from .const import CONF_HUB, DOMAIN, MANAGER_TITLE


class GlasshopperConfigFlow(ConfigFlow, domain=DOMAIN):
    """One entry per HA instance; it owns the Manager panel + dashboard store."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        if user_input is None:
            return self.async_show_form(step_id="user", data_schema=vol.Schema({}))
        return self.async_create_entry(title=MANAGER_TITLE, data={CONF_HUB: True})

    async def async_step_import(
        self, import_data: dict[str, Any]
    ) -> ConfigFlowResult:
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        return self.async_create_entry(title=MANAGER_TITLE, data={CONF_HUB: True})
