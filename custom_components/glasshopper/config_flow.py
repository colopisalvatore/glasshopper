"""Config flow for Glasshopper."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import voluptuous as vol
from homeassistant.config_entries import ConfigEntry, ConfigFlow, OptionsFlow
from homeassistant.core import HomeAssistant, callback
from homeassistant.data_entry_flow import FlowResult
from homeassistant.helpers.selector import (
    SelectOptionDict,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
)

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
)
from .registry import TemplateRegistry

SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9_-]{1,30}$")


def _get_or_init_registry(hass: HomeAssistant) -> TemplateRegistry:
    """Return the registry, initializing it if async_setup hasn't run yet.

    Custom integrations with no yaml entry and no entries don't run
    async_setup until first entry creation — but config_flow starts before
    that. Build the registry on demand so the flow can list templates.
    """
    domain_data = hass.data.setdefault(DOMAIN, {})
    registry: TemplateRegistry | None = domain_data.get(DATA_REGISTRY)
    if registry is None:
        registry = TemplateRegistry(Path(hass.config.path()))
        registry.scan()
        domain_data[DATA_REGISTRY] = registry
        domain_data.setdefault(DATA_REGISTERED_STATICS, set())
        domain_data.setdefault(DATA_ENTRIES_BY_SLUG, {})

        # Also lazy-register services + view, otherwise they're unavailable
        # before first entry exists.
        from . import services as services_module
        from . import views as views_module

        services_module.register(hass)
        views_module.register(hass)
    return registry


def _template_options(hass: HomeAssistant) -> list[SelectOptionDict]:
    registry = _get_or_init_registry(hass)
    # Re-scan on each invocation so newly-dropped folders show up without
    # needing an explicit reload_templates call.
    registry.scan()
    return [
        SelectOptionDict(
            value=t.id,
            label=f"{t.name} ({t.id}) — v{t.version}" if t.version else f"{t.name} ({t.id})",
        )
        for t in sorted(registry.templates.values(), key=lambda x: x.name.lower())
    ]


def _template_selector(hass: HomeAssistant) -> SelectSelector:
    return SelectSelector(
        SelectSelectorConfig(
            options=_template_options(hass),
            mode=SelectSelectorMode.DROPDOWN,
            multiple=False,
        )
    )


class HaReactUiConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Glasshopper dashboards."""

    VERSION = 2

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        errors: dict[str, str] = {}
        options = _template_options(self.hass)

        if not options:
            return self.async_abort(reason="no_templates")

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

        defaults = user_input or {}
        schema = vol.Schema(
            {
                vol.Required(
                    CONF_TEMPLATE_ID, default=defaults.get(CONF_TEMPLATE_ID, options[0]["value"])
                ): _template_selector(self.hass),
                vol.Required(
                    CONF_TITLE, default=defaults.get(CONF_TITLE, "React Dashboard")
                ): str,
                vol.Required(
                    CONF_SLUG, default=defaults.get(CONF_SLUG, "react-dashboard")
                ): str,
                vol.Optional(
                    CONF_ICON, default=defaults.get(CONF_ICON, DEFAULT_ICON)
                ): str,
                vol.Optional(
                    CONF_REQUIRE_ADMIN, default=defaults.get(CONF_REQUIRE_ADMIN, False)
                ): bool,
                vol.Optional(
                    CONF_PUBLIC, default=defaults.get(CONF_PUBLIC, False)
                ): bool,
            }
        )

        return self.async_show_form(
            step_id="user",
            data_schema=schema,
            errors=errors,
        )

    @staticmethod
    @callback
    def async_get_options_flow(entry: ConfigEntry) -> OptionsFlow:
        return HaReactUiOptionsFlow(entry)


class HaReactUiOptionsFlow(OptionsFlow):
    """Edit dashboard metadata after creation (slug is immutable)."""

    def __init__(self, entry: ConfigEntry) -> None:
        self.entry = entry

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        options = _template_options(self.hass)
        if not options:
            return self.async_abort(reason="no_templates")

        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        merged = {**self.entry.data, **self.entry.options}
        schema = vol.Schema(
            {
                vol.Required(
                    CONF_TEMPLATE_ID,
                    default=merged.get(CONF_TEMPLATE_ID, options[0]["value"]),
                ): _template_selector(self.hass),
                vol.Required(CONF_TITLE, default=merged[CONF_TITLE]): str,
                vol.Optional(
                    CONF_ICON, default=merged.get(CONF_ICON, DEFAULT_ICON)
                ): str,
                vol.Optional(
                    CONF_REQUIRE_ADMIN, default=merged.get(CONF_REQUIRE_ADMIN, False)
                ): bool,
                vol.Optional(
                    CONF_PUBLIC, default=merged.get(CONF_PUBLIC, False)
                ): bool,
            }
        )
        return self.async_show_form(step_id="init", data_schema=schema)
