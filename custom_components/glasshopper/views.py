"""HTTP views: standalone full-page dashboard at /custom-dashboard/<slug>."""

from __future__ import annotations

import logging
import mimetypes
from pathlib import Path

from aiohttp import web
from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant

from .const import (
    DATA_ENTRIES_BY_SLUG,
    DATA_REGISTRY,
    DOMAIN,
    FRONTEND_INDEX,
    URL_STANDALONE_BASE,
)

_LOGGER = logging.getLogger(__name__)


class StandaloneDashboardView(HomeAssistantView):
    """Serve template index.html and assets at /custom-dashboard/<slug>[/<path>].

    Each dashboard slug (defined by a ConfigEntry) maps to a template_id; this
    view rewrites the URL to the template's filesystem location and streams
    the file back. Auth is gated by the entry's `public` flag.
    """

    url = URL_STANDALONE_BASE + "/{slug}"
    extra_urls = [URL_STANDALONE_BASE + "/{slug}/{path:.+}"]
    name = "api:glasshopper:standalone"
    # Always allow unauthenticated requests at the view layer; we re-check per
    # request based on the dashboard's `public` flag.
    requires_auth = False

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    async def get(self, request: web.Request, slug: str, path: str = "") -> web.StreamResponse:
        domain_data = self.hass.data.get(DOMAIN, {})
        entries: dict = domain_data.get(DATA_ENTRIES_BY_SLUG, {})
        registry = domain_data.get(DATA_REGISTRY)

        entry_info = entries.get(slug)
        if entry_info is None or registry is None:
            raise web.HTTPNotFound()

        # Without a trailing slash after the slug, browsers resolve relative
        # asset URLs against /custom-dashboard/ instead of /custom-dashboard/<slug>/,
        # which 404s. Redirect once so subsequent loads use the correct base.
        if not path and not request.path.endswith("/"):
            raise web.HTTPMovedPermanently(location=request.path + "/")

        template_id: str = entry_info["template_id"]
        public: bool = bool(entry_info.get("public", False))

        tpl = registry.get(template_id)
        if tpl is None:
            _LOGGER.warning(
                "glasshopper: slug %s references missing template %s",
                slug,
                template_id,
            )
            raise web.HTTPNotFound()

        if not public:
            if not request.get("hass_user") and not request.get("hass_refresh_token_id"):
                raise web.HTTPUnauthorized()

        rel = path or FRONTEND_INDEX
        # Reject path traversal.
        if ".." in rel.split("/"):
            raise web.HTTPForbidden()

        target = (tpl.path / rel).resolve()
        try:
            target.relative_to(tpl.path.resolve())
        except ValueError:
            raise web.HTTPForbidden()

        if not target.is_file():
            # SPA fallback: unknown paths return index.html so client router can handle them.
            target = tpl.index_path
            if not target.is_file():
                raise web.HTTPNotFound()

        content_type, _ = mimetypes.guess_type(str(target))
        return web.FileResponse(
            target,
            headers={
                "Content-Type": content_type or "application/octet-stream",
                "Cache-Control": "no-cache",
            },
        )


def register(hass: HomeAssistant) -> None:
    """Idempotent registration of the standalone view."""
    domain_data = hass.data.setdefault(DOMAIN, {})
    from .const import DATA_STANDALONE_VIEW_REGISTERED

    if domain_data.get(DATA_STANDALONE_VIEW_REGISTERED):
        return
    hass.http.register_view(StandaloneDashboardView(hass))
    domain_data[DATA_STANDALONE_VIEW_REGISTERED] = True
