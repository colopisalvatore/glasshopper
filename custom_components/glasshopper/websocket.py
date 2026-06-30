"""WebSocket API for the Manager panel — dashboards, templates, catalog.

All commands are admin-only. Dashboard mutations go through the Store and the
panel (un)register helpers, then persist.
"""

from __future__ import annotations

import re
import uuid

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError

from .catalog import get as catalog_get
from .catalog import list_entries as catalog_list
from .const import (
    CONF_ICON,
    CONF_PUBLIC,
    CONF_REQUIRE_ADMIN,
    CONF_SLUG,
    CONF_TEMPLATE_ID,
    CONF_TITLE,
    DATA_CONFIG_STORE,
    DATA_REGISTRY,
    DATA_STORE,
    DATA_WS_REGISTERED,
    DEFAULT_ICON,
    DOMAIN,
    MANAGER_SLUG,
    SLUG_PATTERN,
    WS_CATALOG_INSTALL,
    WS_CATALOG_LIST,
    WS_CONFIG_GET,
    WS_CONFIG_SET,
    WS_DASHBOARDS_CREATE,
    WS_DASHBOARDS_DELETE,
    WS_DASHBOARDS_LIST,
    WS_DASHBOARDS_UPDATE,
    WS_TEMPLATES_INSTALL_URL,
    WS_TEMPLATES_LIST,
    WS_TEMPLATES_REMOVE,
)
from .panels import (
    async_register_dashboard_panel,
    async_unregister_dashboard_panel,
)
from .registry import TemplateRegistry
from .services import _install_from_url
from .store import EntityConfigStore, GlasshopperStore

_SLUG_RE = re.compile(SLUG_PATTERN)


def _store(hass: HomeAssistant) -> GlasshopperStore:
    return hass.data[DOMAIN][DATA_STORE]


def _config_store(hass: HomeAssistant) -> EntityConfigStore:
    return hass.data[DOMAIN][DATA_CONFIG_STORE]


def _registry(hass: HomeAssistant) -> TemplateRegistry:
    return hass.data[DOMAIN][DATA_REGISTRY]


# ── Dashboards ──────────────────────────────────────────────────────────────


@websocket_api.websocket_command({vol.Required("type"): WS_DASHBOARDS_LIST})
@websocket_api.require_admin
@callback
def ws_dashboards_list(hass, connection, msg):
    connection.send_result(msg["id"], {"dashboards": _store(hass).list()})


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_DASHBOARDS_CREATE,
        vol.Required("slug"): str,
        vol.Required("title"): str,
        vol.Required("template_id"): str,
        vol.Optional("icon"): str,
        vol.Optional("require_admin"): bool,
        vol.Optional("public"): bool,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_dashboards_create(hass, connection, msg):
    store = _store(hass)
    slug = msg["slug"].strip().lower()
    if not _SLUG_RE.match(slug) or slug == MANAGER_SLUG:
        connection.send_error(msg["id"], "invalid_slug", "Slug must be 2–31 chars: lowercase letters, digits, hyphens or underscores.")
        return
    if store.slug_exists(slug):
        connection.send_error(msg["id"], "slug_exists", f"A dashboard with slug '{slug}' already exists.")
        return
    if _registry(hass).get(msg["template_id"]) is None:
        connection.send_error(msg["id"], "unknown_template", "That template is not installed.")
        return

    dash = {
        "id": uuid.uuid4().hex,
        CONF_SLUG: slug,
        CONF_TITLE: msg["title"],
        CONF_TEMPLATE_ID: msg["template_id"],
        CONF_ICON: msg.get("icon") or DEFAULT_ICON,
        CONF_REQUIRE_ADMIN: bool(msg.get("require_admin", False)),
        CONF_PUBLIC: bool(msg.get("public", False)),
    }
    store.add(dash)
    await store.async_save()
    await async_register_dashboard_panel(hass, dash)
    connection.send_result(msg["id"], {"dashboard": dash})


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_DASHBOARDS_UPDATE,
        vol.Required("dashboard_id"): str,
        vol.Optional("title"): str,
        vol.Optional("template_id"): str,
        vol.Optional("icon"): str,
        vol.Optional("require_admin"): bool,
        vol.Optional("public"): bool,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_dashboards_update(hass, connection, msg):
    store = _store(hass)
    dash = store.get(msg["dashboard_id"])
    if dash is None:
        connection.send_error(msg["id"], "not_found", "Dashboard not found.")
        return

    patch: dict = {}
    for key in (CONF_TITLE, CONF_TEMPLATE_ID, CONF_ICON, CONF_REQUIRE_ADMIN, CONF_PUBLIC):
        if key in msg:
            patch[key] = msg[key]
    if CONF_TEMPLATE_ID in patch and _registry(hass).get(patch[CONF_TEMPLATE_ID]) is None:
        connection.send_error(msg["id"], "unknown_template", "That template is not installed.")
        return

    updated = store.update(msg["dashboard_id"], patch)
    await store.async_save()
    # Re-register the panel so title/icon/template/admin changes take effect.
    await async_unregister_dashboard_panel(hass, updated[CONF_SLUG])
    await async_register_dashboard_panel(hass, updated)
    connection.send_result(msg["id"], {"dashboard": updated})


@websocket_api.websocket_command(
    {vol.Required("type"): WS_DASHBOARDS_DELETE, vol.Required("dashboard_id"): str}
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_dashboards_delete(hass, connection, msg):
    store = _store(hass)
    dash = store.get(msg["dashboard_id"])
    if dash is None:
        connection.send_error(msg["id"], "not_found", "Dashboard not found.")
        return
    await async_unregister_dashboard_panel(hass, dash[CONF_SLUG])
    store.remove(msg["dashboard_id"])
    await store.async_save()
    connection.send_result(msg["id"], {"ok": True})


# ── Templates ───────────────────────────────────────────────────────────────


@websocket_api.websocket_command({vol.Required("type"): WS_TEMPLATES_LIST})
@websocket_api.require_admin
@websocket_api.async_response
async def ws_templates_list(hass, connection, msg):
    registry = _registry(hass)
    await hass.async_add_executor_job(registry.scan)
    used = {d[CONF_TEMPLATE_ID] for d in _store(hass).list()}
    items = [
        {**tpl.to_dict(), "in_use": tpl.id in used}
        for tpl in registry.templates.values()
    ]
    connection.send_result(msg["id"], {"templates": items})


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_TEMPLATES_INSTALL_URL,
        vol.Required("url"): str,
        vol.Optional("template_id"): str,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_templates_install_url(hass, connection, msg):
    try:
        tid = await _install_from_url(hass, msg["url"], msg.get("template_id"))
    except HomeAssistantError as exc:
        connection.send_error(msg["id"], "install_failed", str(exc))
        return
    tpl = _registry(hass).get(tid)
    connection.send_result(msg["id"], {"template": tpl.to_dict() if tpl else None})


@websocket_api.websocket_command(
    {vol.Required("type"): WS_TEMPLATES_REMOVE, vol.Required("template_id"): str}
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_templates_remove(hass, connection, msg):
    tid = msg["template_id"]
    if any(d[CONF_TEMPLATE_ID] == tid for d in _store(hass).list()):
        connection.send_error(msg["id"], "in_use", "A dashboard still uses this template.")
        return
    ok = await hass.async_add_executor_job(_registry(hass).remove, tid)
    if not ok:
        connection.send_error(msg["id"], "not_found", "Template not found.")
        return
    connection.send_result(msg["id"], {"ok": True})


# ── Entity config (per-dashboard slot → entity mapping) ─────────────────────


@websocket_api.websocket_command(
    {vol.Required("type"): WS_CONFIG_GET, vol.Required("slug"): str}
)
@callback
def ws_config_get(hass, connection, msg):
    """Read a dashboard's entity mapping. Any authenticated user (the dashboard
    must render for non-admins too)."""
    connection.send_result(msg["id"], {"config": _config_store(hass).get(msg["slug"])})


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_CONFIG_SET,
        vol.Required("slug"): str,
        vol.Required("map"): dict,
        vol.Optional("seen"): bool,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_config_set(hass, connection, msg):
    """Persist a dashboard's entity mapping. Admin-only — it changes the
    dashboard for everyone who opens it."""
    store = _config_store(hass)
    config = {"map": msg["map"], "seen": bool(msg.get("seen", True))}
    store.set(msg["slug"], config)
    await store.async_save()
    connection.send_result(msg["id"], {"config": config})


# ── Catalog ─────────────────────────────────────────────────────────────────


@websocket_api.websocket_command({vol.Required("type"): WS_CATALOG_LIST})
@websocket_api.require_admin
@callback
def ws_catalog_list(hass, connection, msg):
    connection.send_result(msg["id"], {"catalog": catalog_list(hass)})


@websocket_api.websocket_command(
    {vol.Required("type"): WS_CATALOG_INSTALL, vol.Required("catalog_id"): str}
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_catalog_install(hass, connection, msg):
    entry = catalog_get(msg["catalog_id"])
    if entry is None:
        connection.send_error(msg["id"], "not_found", "Unknown catalog entry.")
        return
    if entry.get("kind") != "free" or not entry.get("url"):
        connection.send_error(msg["id"], "premium", "Buy this template on the store, then install it via URL or upload.")
        return
    try:
        tid = await _install_from_url(hass, entry["url"], entry["id"])
    except HomeAssistantError as exc:
        connection.send_error(msg["id"], "install_failed", str(exc))
        return
    tpl = _registry(hass).get(tid)
    connection.send_result(msg["id"], {"template": tpl.to_dict() if tpl else None})


def register(hass: HomeAssistant) -> None:
    """Idempotent WS command registration."""
    domain_data = hass.data.setdefault(DOMAIN, {})
    if domain_data.get(DATA_WS_REGISTERED):
        return
    for handler in (
        ws_dashboards_list,
        ws_dashboards_create,
        ws_dashboards_update,
        ws_dashboards_delete,
        ws_templates_list,
        ws_templates_install_url,
        ws_templates_remove,
        ws_catalog_list,
        ws_catalog_install,
        ws_config_get,
        ws_config_set,
    ):
        websocket_api.async_register_command(hass, handler)
    domain_data[DATA_WS_REGISTERED] = True
