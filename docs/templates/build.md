# Build your own template

A template is a folder with a built React bundle and an optional manifest.
Anything you can build with the scaffold can ship as a template.

## 1. Scaffold

```bash
npx create-tessera my-template
cd my-template
npm install
```

## 2. Develop

```bash
cp .env.example .env.local         # set VITE_HA_URL
npm run dev
# Open http://localhost:5173/?token=YOUR_TOKEN
```

Edit `src/App.tsx` (and add anything else under `src/`). The hooks are in
`@/hooks`. The HA connection is in `@/lib/haConnection`.

## 3. Add a manifest

Create `public/template.json` (Vite copies `public/` into `dist/`):

```json
{
  "id": "my-template",
  "name": "My Template",
  "version": "0.1.0",
  "author": "Your Name",
  "description": "A short one-line description.",
  "preview": "https://example.com/preview.png"
}
```

The `id` becomes the directory name when installed, and the slug that users
reference in the integration UI.

## 4. Build

```bash
npm run build
ls dist/
# index.html
# assets/...
# template.json
```

## 5. Package as a zip

```bash
cd dist
zip -r ../my-template-0.1.0.zip .
```

The zip must contain `index.html` at the root (or inside a single top-level
folder — the install service handles both shapes).

## 6. Host the zip

Pick one:

- **GitHub release** — push a tag, attach the zip via CI.
- **Gumroad / Lemonsqueezy** — for paid templates with license keys.
- **S3 / CloudFront / R2** — for high-volume free templates.

## 7. Install on HA

```yaml
service: ha_react_ui.install_template
data:
  url: https://github.com/you/your-repo/releases/download/v0.1.0/my-template-0.1.0.zip
```

Then **Settings → Devices → Add Integration → HA React UI** and pick your
template.

## Release automation

Tag a release, build, attach the zip:

```yaml
# .github/workflows/release.yml
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

Now your users install with the release URL — no manual upload step.

## Conventions

- **Versioning** — SemVer. Major for breaking entity dependencies; minor for
  added features; patch for fixes.
- **Naming** — `id` matches the folder name once installed. Use lowercase
  letters, digits, `-`, `_`.
- **Preview image** — 16:10, ≤ 1 MB. Lets the registry render a thumbnail.
- **Branding** — your template, your brand. Use the HA React UI mark only when
  describing platform compatibility.

## Submitting to the public registry

Open a PR adding an entry to
[`templates/registry.json`](https://github.com/colopisalvatore/ha-react-ui/blob/main/templates/registry.json).
We'll review for: license clarity, security (no inline tokens), build
reproducibility, and that the preview matches reality.
