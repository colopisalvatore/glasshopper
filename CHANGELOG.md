# Changelog

All notable changes to this project are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning follows [SemVer](https://semver.org/).

## [Unreleased]

### Added
- HA custom integration `glasshopper`: multi-dashboard ConfigFlow + OptionsFlow, an install-a-template-from-URL step in the Add Integration wizard (no YAML needed), services (`install_template`, `reload_templates`, `remove_template`), and a standalone `/custom-dashboard/<slug>/` view.
- A bundled `minimal` template seeded into `<config>/glasshopper_templates/` on setup, so a fresh install always has a working template (no chicken-and-egg dead end).
- Five React hooks: `useEntity`, `useService`, `useHistory`, `useArea`, `useTheme`.
- Same-origin bridge to `window.parent.hassConnection` for zero-auth panel mode; standalone dev mode with a long-lived token.
- `create-glasshopper` CLI scaffold and a VitePress documentation site.
- Three free dashboard templates (Aria, Grid, Pulse) plus the template registry and its JSON schema.

### Changed
- Templates now build with a relative base (`VITE_BASE=./`) so assets resolve under `/glasshopper_files/<id>/` at any mount point.
- Build output moved from `custom_components/glasshopper/frontend/` to `custom_components/glasshopper/bundled/minimal/` (seeded at runtime), aligning the dev build with the registry the integration actually reads.
