"""Standalone test for registry.scan() — bypasses HA imports."""

import importlib.util
import sys
import types
from pathlib import Path

repo = Path(__file__).parent
pkg_dir = repo / "custom_components" / "glasshopper"

# Create a fake package so relative imports resolve.
pkg = types.ModuleType("hru")
pkg.__path__ = [str(pkg_dir)]
sys.modules["hru"] = pkg


def _load(modname: str, path: Path):
    spec = importlib.util.spec_from_file_location(f"hru.{modname}", path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[f"hru.{modname}"] = mod
    spec.loader.exec_module(mod)
    return mod


const = _load("const", pkg_dir / "const.py")
registry = _load("registry", pkg_dir / "registry.py")

print(f"USER_TEMPLATES_DIRNAME = {const.USER_TEMPLATES_DIRNAME!r}")
print(f"TEMPLATE_MANIFEST = {const.TEMPLATE_MANIFEST!r}")
print(f"FRONTEND_INDEX = {const.FRONTEND_INDEX!r}")
print()

config_dir = Path("/tmp/ha_test")
root = config_dir / const.USER_TEMPLATES_DIRNAME
print(f"Config dir: {config_dir}")
print(f"Root: {root} (exists={root.is_dir()})")
if root.is_dir():
    print(f"Contents: {[p.name for p in root.iterdir()]}")
print()

r = registry.TemplateRegistry(config_dir)
templates = r.scan()
print(f"Scan returned {len(templates)} template(s)")
for tid, tpl in templates.items():
    print(f"  - {tid}: {tpl.name} v{tpl.version}")
    print(f"    path = {tpl.path}")
    print(f"    index_path = {tpl.index_path}")
    print(f"    index exists = {tpl.index_path.is_file()}")
    print(f"    is_valid = {tpl.is_valid()}")

if not templates:
    print("\nFAILURE: no templates found")
    sys.exit(1)

print("\nOK")
