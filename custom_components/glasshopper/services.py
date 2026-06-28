"""Services: install_template, reload_templates, remove_template."""

from __future__ import annotations

import asyncio
import io
import logging
import re
import shutil
import tempfile
import zipfile
from pathlib import Path
from urllib.parse import urlparse

import aiohttp
import voluptuous as vol
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .const import (
    DATA_REGISTRY,
    DATA_SERVICES_REGISTERED,
    DOMAIN,
    FRONTEND_INDEX,
    SERVICE_INSTALL_TEMPLATE,
    SERVICE_RELOAD_TEMPLATES,
    SERVICE_REMOVE_TEMPLATE,
    TEMPLATE_MANIFEST,
)
from .registry import TEMPLATE_ID_RE, TemplateRegistry

_LOGGER = logging.getLogger(__name__)

MAX_ZIP_BYTES = 50 * 1024 * 1024  # 50 MB cap to limit blast radius from bad URLs.
DOWNLOAD_TIMEOUT = 60  # seconds

INSTALL_SCHEMA = vol.Schema(
    {
        vol.Required("url"): vol.All(str, vol.Length(min=1)),
        vol.Optional("template_id"): vol.All(str, vol.Length(min=1, max=64)),
    }
)

REMOVE_SCHEMA = vol.Schema(
    {
        vol.Required("template_id"): vol.All(str, vol.Length(min=1, max=64)),
    }
)

RELOAD_SCHEMA = vol.Schema({})


def _slugify_id(name: str) -> str:
    name = name.lower()
    name = re.sub(r"[^a-z0-9_-]+", "-", name)
    name = name.strip("-_")
    return name[:64] or "template"


async def _download(hass: HomeAssistant, url: str) -> bytes:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise HomeAssistantError(f"Unsupported URL scheme: {parsed.scheme}")

    session = async_get_clientsession(hass)
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=DOWNLOAD_TIMEOUT)) as resp:
            if resp.status != 200:
                raise HomeAssistantError(f"Download failed: HTTP {resp.status}")
            buf = bytearray()
            async for chunk in resp.content.iter_chunked(64 * 1024):
                buf.extend(chunk)
                if len(buf) > MAX_ZIP_BYTES:
                    raise HomeAssistantError(
                        f"Template zip exceeds {MAX_ZIP_BYTES // (1024 * 1024)} MB cap"
                    )
            return bytes(buf)
    except asyncio.TimeoutError as exc:
        raise HomeAssistantError(f"Download timed out after {DOWNLOAD_TIMEOUT}s") from exc
    except aiohttp.ClientError as exc:
        raise HomeAssistantError(f"Download error: {exc}") from exc


def _safe_extract(zip_bytes: bytes, dest: Path) -> None:
    """Extract a zip into dest, rejecting absolute or traversal paths."""
    dest.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        for member in zf.infolist():
            name = member.filename
            if not name or name.endswith("/"):
                continue
            target = (dest / name).resolve()
            try:
                target.relative_to(dest.resolve())
            except ValueError as exc:
                raise HomeAssistantError(f"Unsafe path in zip: {name}") from exc
            target.parent.mkdir(parents=True, exist_ok=True)
            with zf.open(member) as src, open(target, "wb") as out:
                shutil.copyfileobj(src, out)


def _normalize_extracted(staging: Path) -> Path:
    """Locate the dir containing index.html in the extracted staging area.

    Some zips wrap everything in a single top-level dir; handle that gracefully.
    """
    if (staging / FRONTEND_INDEX).is_file():
        return staging
    children = [c for c in staging.iterdir() if c.is_dir()]
    if len(children) == 1 and (children[0] / FRONTEND_INDEX).is_file():
        return children[0]
    # Search one level deeper as a last resort.
    for c in children:
        if (c / FRONTEND_INDEX).is_file():
            return c
    raise HomeAssistantError(f"Zip does not contain {FRONTEND_INDEX} at a usable depth")


def _resolve_template_id(staging_root: Path, override: str | None) -> str:
    if override:
        tid = _slugify_id(override)
        if not TEMPLATE_ID_RE.match(tid):
            raise HomeAssistantError(f"Invalid template_id: {override}")
        return tid

    manifest = staging_root / TEMPLATE_MANIFEST
    if manifest.is_file():
        try:
            import json

            meta = json.loads(manifest.read_text(encoding="utf-8"))
            mid = meta.get("id")
            if isinstance(mid, str) and mid:
                tid = _slugify_id(mid)
                if TEMPLATE_ID_RE.match(tid):
                    return tid
        except (OSError, ValueError):
            pass

    return _slugify_id(staging_root.name)


async def _install_from_bytes(
    hass: HomeAssistant, zip_bytes: bytes, template_id: str | None
) -> str:
    """Extract a template zip (already in memory) into the registry root.

    Shared by URL install (`_install_from_url`) and the HTTP upload endpoint.
    Returns the resolved template id.
    """
    registry: TemplateRegistry = hass.data[DOMAIN][DATA_REGISTRY]
    registry.ensure_root()

    def _do_extract() -> str:
        with tempfile.TemporaryDirectory(prefix="glasshopper_") as tmp:
            tmp_path = Path(tmp)
            _safe_extract(zip_bytes, tmp_path)
            normalized = _normalize_extracted(tmp_path)
            tid = _resolve_template_id(normalized, template_id)
            dest = registry.root / tid
            if dest.exists():
                shutil.rmtree(dest)
            shutil.copytree(normalized, dest)
            return tid

    tid = await hass.async_add_executor_job(_do_extract)
    await hass.async_add_executor_job(registry.scan)
    return tid


async def _install_from_url(
    hass: HomeAssistant, url: str, template_id: str | None
) -> str:
    data = await _download(hass, url)
    tid = await _install_from_bytes(hass, data, template_id)
    _LOGGER.info("glasshopper: installed template %s from %s", tid, url)
    return tid


def register(hass: HomeAssistant) -> None:
    """Idempotent service registration."""
    domain_data = hass.data.setdefault(DOMAIN, {})
    if domain_data.get(DATA_SERVICES_REGISTERED):
        return

    async def install_template(call: ServiceCall) -> None:
        url: str = call.data["url"]
        template_id: str | None = call.data.get("template_id")
        await _install_from_url(hass, url, template_id)

    async def reload_templates(call: ServiceCall) -> None:
        registry: TemplateRegistry = hass.data[DOMAIN][DATA_REGISTRY]
        await hass.async_add_executor_job(registry.scan)

    async def remove_template(call: ServiceCall) -> None:
        tid: str = call.data["template_id"]
        registry: TemplateRegistry = hass.data[DOMAIN][DATA_REGISTRY]
        ok = await hass.async_add_executor_job(registry.remove, tid)
        if not ok:
            raise HomeAssistantError(f"Template not found: {tid}")

    hass.services.async_register(DOMAIN, SERVICE_INSTALL_TEMPLATE, install_template, schema=INSTALL_SCHEMA)
    hass.services.async_register(DOMAIN, SERVICE_RELOAD_TEMPLATES, reload_templates, schema=RELOAD_SCHEMA)
    hass.services.async_register(DOMAIN, SERVICE_REMOVE_TEMPLATE, remove_template, schema=REMOVE_SCHEMA)

    domain_data[DATA_SERVICES_REGISTERED] = True
