"""Template registry: discover, validate, and describe templates in the user dir."""

from __future__ import annotations

import json
import logging
import re
import shutil
from dataclasses import dataclass, field
from pathlib import Path

from .const import (
    BUNDLED_TEMPLATES_DIRNAME,
    FRONTEND_INDEX,
    TEMPLATE_MANIFEST,
    USER_TEMPLATES_DIRNAME,
)

_LOGGER = logging.getLogger(__name__)

# Same constraints as slug: letters, digits, hyphens, underscores.
TEMPLATE_ID_RE = re.compile(r"^[a-z0-9][a-z0-9_-]{0,63}$")


@dataclass
class Template:
    """A discovered React dashboard template."""

    id: str
    path: Path
    name: str
    version: str = "0.0.0"
    author: str = ""
    description: str = ""
    preview: str | None = None
    extra: dict = field(default_factory=dict)

    @property
    def index_path(self) -> Path:
        return self.path / FRONTEND_INDEX

    def is_valid(self) -> bool:
        return self.index_path.is_file()

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "version": self.version,
            "author": self.author,
            "description": self.description,
            "preview": self.preview,
        }


class TemplateRegistry:
    """Filesystem-backed template registry rooted at <config>/glasshopper_templates."""

    def __init__(self, config_dir: Path) -> None:
        self.root: Path = config_dir / USER_TEMPLATES_DIRNAME
        self._templates: dict[str, Template] = {}

    def ensure_root(self) -> None:
        self.root.mkdir(parents=True, exist_ok=True)

    def seed_bundled(self) -> None:
        """Copy templates shipped inside the package into the user dir.

        Runs on setup so a fresh install always has at least one template and
        the config flow never dead-ends with "no templates". Never overwrites a
        template the user already has (their copy wins).
        """
        bundled = Path(__file__).parent / BUNDLED_TEMPLATES_DIRNAME
        if not bundled.is_dir():
            return
        self.ensure_root()
        for child in sorted(bundled.iterdir()):
            if not child.is_dir() or not (child / FRONTEND_INDEX).is_file():
                continue
            dest = self.root / child.name
            if dest.exists():
                continue
            try:
                shutil.copytree(child, dest)
                _LOGGER.info("glasshopper: seeded bundled template %s", child.name)
            except OSError as exc:
                _LOGGER.error("glasshopper: failed seeding template %s: %s", child.name, exc)

    def scan(self) -> dict[str, Template]:
        """Re-scan filesystem and rebuild the in-memory registry."""
        self.ensure_root()
        found: dict[str, Template] = {}

        for child in sorted(self.root.iterdir()):
            if not child.is_dir():
                continue
            tpl = self._load_one(child)
            if tpl is None:
                continue
            if not tpl.is_valid():
                _LOGGER.warning(
                    "glasshopper: template %s missing %s — skipped",
                    tpl.id,
                    FRONTEND_INDEX,
                )
                continue
            found[tpl.id] = tpl

        self._templates = found
        _LOGGER.info(
            "glasshopper: registry loaded %d template(s): %s",
            len(found),
            ", ".join(sorted(found.keys())) or "(none)",
        )
        return found

    def _load_one(self, path: Path) -> Template | None:
        tid = path.name
        if not TEMPLATE_ID_RE.match(tid):
            _LOGGER.warning("glasshopper: invalid template dir name %s — skipped", tid)
            return None

        manifest_path = path / TEMPLATE_MANIFEST
        meta: dict = {}
        if manifest_path.is_file():
            try:
                meta = json.loads(manifest_path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError) as exc:
                _LOGGER.warning(
                    "glasshopper: bad %s in %s: %s — using defaults",
                    TEMPLATE_MANIFEST,
                    tid,
                    exc,
                )
                meta = {}

        return Template(
            id=tid,
            path=path,
            name=str(meta.get("name") or tid),
            version=str(meta.get("version") or "0.0.0"),
            author=str(meta.get("author") or ""),
            description=str(meta.get("description") or ""),
            preview=meta.get("preview"),
            extra={
                k: v
                for k, v in meta.items()
                if k not in {"id", "name", "version", "author", "description", "preview"}
            },
        )

    @property
    def templates(self) -> dict[str, Template]:
        return dict(self._templates)

    def get(self, template_id: str) -> Template | None:
        return self._templates.get(template_id)

    def remove(self, template_id: str) -> bool:
        """Delete a template directory from disk. Returns True on success."""
        tpl = self._templates.get(template_id)
        if tpl is None:
            return False
        try:
            shutil.rmtree(tpl.path)
        except OSError as exc:
            _LOGGER.error("glasshopper: failed removing template %s: %s", template_id, exc)
            return False
        self._templates.pop(template_id, None)
        return True
