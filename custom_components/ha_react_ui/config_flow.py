"""Config flow for HA React UI."""

from __future__ import annotations

import re
from typing import Any

import voluptuous as vol
from homeassistant.config_entries import (
    ConfigEntry,
    ConfigFlow,
    OptionsFlow,
)
from homeassistant.core import callback
from homeassistant.data_entry_flow import FlowResult

from .const import (
    CONF_ICON,
    CONF_REQUIRE_ADMIN,
    CONF_SLUG,
    CONF_TITLE,
    DEFAULT_ICON,
    DOMAIN,
)

SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9_-]{1,30}$")


def _user_schema(defaults: dict[str, Any] | None = None) -> vol.Schema:
    d = defaults or {}
    return vol.Schema(
        {
            vol.Required(CONF_TITLE, default=d.get(CONF_TITLE, "React Dashboard")): str,
            vol.Required(CONF_SLUG, default=d.get(CONF_SLUG, "react-dashboard")): str,
            vol.Optional(CONF_ICON, default=d.get(CONF_ICON, DEFAULT_ICON)): str,
            vol.Optional(
                CONF_REQUIRE_ADMIN, default=d.get(CONF_REQUIRE_ADMIN, False)
            ): bool,
        }
    )


class HaReactUiConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for HA React UI dashboards."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        errors: dict[str, str] = {}

        if user_input is not None:
            slug = user_input[CONF_SLUG].strip().lower()
            user_input[CONF_SLUG] = slug

            if not SLUG_RE.match(slug):
                errors[CONF_SLUG] = "invalid_slug"
            else:
                await self.async_set_unique_id(slug)
                self._abort_if_unique_id_configured()

                return self.async_create_entry(
                    title=user_input[CONF_TITLE],
                    data=user_input,
                )

        return self.async_show_form(
            step_id="user",
            data_schema=_user_schema(user_input),
            errors=errors,
        )

    @staticmethod
    @callback
    def async_get_options_flow(entry: ConfigEntry) -> OptionsFlow:
        return HaReactUiOptionsFlow(entry)


class HaReactUiOptionsFlow(OptionsFlow):
    """Edit dashboard title/icon/admin after creation (slug is immutable)."""

    def __init__(self, entry: ConfigEntry) -> None:
        self.entry = entry

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        merged = {**self.entry.data, **self.entry.options}
        schema = vol.Schema(
            {
                vol.Required(CONF_TITLE, default=merged[CONF_TITLE]): str,
                vol.Optional(
                    CONF_ICON, default=merged.get(CONF_ICON, DEFAULT_ICON)
                ): str,
                vol.Optional(
                    CONF_REQUIRE_ADMIN,
                    default=merged.get(CONF_REQUIRE_ADMIN, False),
                ): bool,
            }
        )
        return self.async_show_form(step_id="init", data_schema=schema)
