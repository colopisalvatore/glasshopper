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

DATA_REGISTRY = "registry"
DATA_REGISTERED_STATICS = "registered_statics"
DATA_STANDALONE_VIEW_REGISTERED = "standalone_view_registered"
DATA_SERVICES_REGISTERED = "services_registered"
DATA_ENTRIES_BY_SLUG = "entries_by_slug"

SERVICE_INSTALL_TEMPLATE = "install_template"
SERVICE_RELOAD_TEMPLATES = "reload_templates"
SERVICE_REMOVE_TEMPLATE = "remove_template"
