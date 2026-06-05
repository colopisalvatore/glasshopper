# Build & deploy

You have two distribution paths: bundle your dashboard **into the integration** (private, single user) or **publish as a template** (zip download, multi-user).

## Path A — Bundled with the integration

For a one-off personal dashboard, build it as the bundled **minimal** template.

```bash
npm run sync
```

This runs `tsc -b && vite build` with a relative base (`VITE_BASE=./`), then copies `dist/` into `custom_components/glasshopper/bundled/minimal/` and writes its `template.json`.

Copy the whole `custom_components/glasshopper/` folder into HA's config dir and restart HA. The integration seeds the template into `<config>/glasshopper_templates/minimal/` on startup, so it shows up in the Add Integration dialog. Or commit it to a private HACS repo.

## Path B — Publish as a template

For a dashboard you want others to install, build a template zip.

```bash
VITE_BASE=./ npm run build    # relative base, builds into dist/
# author dist/template.json (see below)
cd dist
zip -r my-template.zip .
```

`template.json`:

```json
{
  "id": "my-template",
  "name": "My Dashboard",
  "version": "0.1.0",
  "author": "you",
  "description": "Short description."
}
```

Host the zip on a public URL (GitHub release, S3, Gumroad). Users install with:

```yaml
service: glasshopper.install_template
data:
  url: https://example.com/my-template.zip
```

## Versioning

Follow [SemVer](https://semver.org):

- Major — breaking change to the dashboard's behavior or API surface.
- Minor — new entities, new screens, additive.
- Patch — fixes only.

Tag releases in your repo: `git tag v0.2.0 && git push --tags`.

## CI build for releases

Add a workflow that builds on tag push and attaches the zip to the GitHub release:

```yaml
name: Release
on:
  push:
    tags: ['v*']
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run build
      - run: cd dist && zip -r ../my-template-${{ github.ref_name }}.zip .
      - uses: softprops/action-gh-release@v2
        with:
          files: my-template-*.zip
```
