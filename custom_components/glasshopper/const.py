"""Constants for the Glasshopper integration."""

DOMAIN = "glasshopper"

URL_STATIC_BASE = "/glasshopper_files"
URL_STANDALONE_BASE = "/custom-dashboard"

USER_TEMPLATES_DIRNAME = "glasshopper_templates"

# Templates shipped inside the integration package and seeded into the user
# templates dir on setup, so a fresh install always has at least one template.
BUNDLED_TEMPLATES_DIRNAME = "bundled"
DEFAULT_TEMPLATE_ID = "minimal"

TEMPLATE_MANIFEST = "template.json"
FRONTEND_INDEX = "index.html"

CONF_TITLE = "title"
CONF_SLUG = "slug"
CONF_ICON = "icon"
CONF_REQUIRE_ADMIN = "require_admin"
CONF_TEMPLATE_ID = "template_id"
CONF_PUBLIC = "public"

DEFAULT_ICON = "mdi:view-dashboard"

# Dashboard slug: lowercase letters/digits/hyphens/underscores, 2–31 chars.
SLUG_PATTERN = r"^[a-z0-9][a-z0-9_-]{1,30}$"

DATA_REGISTRY = "registry"
DATA_REGISTERED_STATICS = "registered_statics"
DATA_STANDALONE_VIEW_REGISTERED = "standalone_view_registered"
DATA_SERVICES_REGISTERED = "services_registered"
DATA_ENTRIES_BY_SLUG = "entries_by_slug"
DATA_STORE = "store"
DATA_WS_REGISTERED = "ws_registered"
DATA_UPLOAD_VIEW_REGISTERED = "upload_view_registered"
DATA_MANAGER_REGISTERED = "manager_registered"

SERVICE_INSTALL_TEMPLATE = "install_template"
SERVICE_RELOAD_TEMPLATES = "reload_templates"
SERVICE_REMOVE_TEMPLATE = "remove_template"

# Hub entry: a single config entry tagged like this owns the manager panel and
# the storage-backed dashboard list (replaces one-entry-per-dashboard).
CONF_HUB = "hub"

# Dashboard storage (helpers.storage.Store) — the canonical dashboard list.
STORE_KEY = "glasshopper.dashboards"
STORE_VERSION = 1

# Manager panel: a single admin sidebar panel (a bundled React app, not a
# user template). Lives in the package's `manager_app/` dir — deliberately NOT
# under `bundled/`, so seed_bundled never copies it into the templates dir.
MANAGER_DIRNAME = "manager_app"
MANAGER_SLUG = "glasshopper"
MANAGER_TITLE = "Glasshopper"
MANAGER_ICON = "mdi:grass"
URL_MANAGER_BASE = "/glasshopper_files/manager"

# HTTP upload endpoint for installing a template from a local .zip.
URL_UPLOAD = "/api/glasshopper/upload"

# Built-in catalog (bundled JSON describing installable templates).
CATALOG_FILE = "catalog.json"

# WebSocket command types (manager ↔ integration).
WS_DASHBOARDS_LIST = "glasshopper/dashboards/list"
WS_DASHBOARDS_CREATE = "glasshopper/dashboards/create"
WS_DASHBOARDS_UPDATE = "glasshopper/dashboards/update"
WS_DASHBOARDS_DELETE = "glasshopper/dashboards/delete"
WS_TEMPLATES_LIST = "glasshopper/templates/list"
WS_TEMPLATES_INSTALL_URL = "glasshopper/templates/install_url"
WS_TEMPLATES_REMOVE = "glasshopper/templates/remove"
WS_CATALOG_LIST = "glasshopper/catalog/list"
WS_CATALOG_INSTALL = "glasshopper/catalog/install"
