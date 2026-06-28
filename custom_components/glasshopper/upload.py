"""HTTP endpoint to install a template from an uploaded .zip (admin only).

Reuses the same extract/normalize/resolve pipeline as URL install.
"""

from __future__ import annotations

import logging

from aiohttp import web
from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError

from .const import (
    DATA_REGISTRY,
    DATA_UPLOAD_VIEW_REGISTERED,
    DOMAIN,
    URL_UPLOAD,
)
from .services import MAX_ZIP_BYTES, _install_from_bytes

_LOGGER = logging.getLogger(__name__)


class TemplateUploadView(HomeAssistantView):
    """POST a multipart `file` (.zip) + optional `template_id` → installs it."""

    url = URL_UPLOAD
    name = "api:glasshopper:upload"
    requires_auth = True

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    async def post(self, request: web.Request) -> web.Response:
        user = request.get("hass_user")
        if user is None or not user.is_admin:
            raise web.HTTPUnauthorized()

        reader = await request.multipart()
        zip_bytes = bytearray()
        template_id: str | None = None

        async for part in reader:
            if part.name == "template_id":
                template_id = (await part.text()).strip() or None
            elif part.name == "file":
                while True:
                    chunk = await part.read_chunk()
                    if not chunk:
                        break
                    zip_bytes.extend(chunk)
                    if len(zip_bytes) > MAX_ZIP_BYTES:
                        raise web.HTTPRequestEntityTooLarge(MAX_ZIP_BYTES, len(zip_bytes))

        if not zip_bytes:
            raise web.HTTPBadRequest(text="No file uploaded")

        try:
            tid = await _install_from_bytes(self.hass, bytes(zip_bytes), template_id)
        except HomeAssistantError as exc:
            raise web.HTTPBadRequest(text=str(exc)) from exc

        tpl = self.hass.data[DOMAIN][DATA_REGISTRY].get(tid)
        _LOGGER.info("glasshopper: installed template %s from upload", tid)
        return self.json({"template": tpl.to_dict() if tpl else None})


def register(hass: HomeAssistant) -> None:
    """Idempotent upload-view registration."""
    domain_data = hass.data.setdefault(DOMAIN, {})
    if domain_data.get(DATA_UPLOAD_VIEW_REGISTERED):
        return
    hass.http.register_view(TemplateUploadView(hass))
    domain_data[DATA_UPLOAD_VIEW_REGISTERED] = True
