# Changelog

All notable changes to this project are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning follows [SemVer](https://semver.org/).

## [Unreleased]

### Added
- Initial scaffold.
- HA custom integration `ha_react_ui` with multi-dashboard ConfigFlow.
- React hooks: `useEntity`, `useService`, `useHistory`.
- Same-origin bridge to `window.parent.hassConnection` for zero-auth panel mode.
- Standalone dev mode with long-lived token.
- `npm run sync` build pipeline copying the bundle into `custom_components/ha_react_ui/frontend/`.
