# Templates

A **template** is a built React dashboard that the `glasshopper` integration
serves as a Home Assistant panel. Users install templates by dropping a folder
into `<config>/glasshopper_templates/<id>/` or calling the
`glasshopper.install_template` service with a URL to a zip.

This directory holds the **template registry** and **first-party templates**.

## Registry

[`registry.json`](./registry.json) is a public list of known templates that
docs and the landing page can render. It is **not** consumed by the HA
integration at runtime — installation is always explicit.

Schema:

```jsonc
{
  "templates": [
    {
      "id": "minimal",                    // matches the directory name once installed
      "name": "Minimal",                  // human-readable
      "version": "0.1.0",
      "author": "glasshopper",
      "license": "Apache-2.0",
      "tier": "free",                     // "free" | "premium"
      "description": "...",
      "preview": "https://.../preview.png",
      "download": "https://github.com/.../releases/download/v0.1.0/minimal.zip"
    }
  ]
}
```

## Template shape

A template is a directory containing at minimum:

```
<id>/
├── index.html         # entry point served by the panel
├── assets/            # JS, CSS, images (Vite output)
└── template.json      # metadata (id, name, version, author, description, preview)
```

`template.json` is optional; if missing the folder name becomes the id.

### Building a template from a scaffold

```bash
# In your scaffold project:
npm run build                         # produces dist/
mkdir -p custom_components/glasshopper_templates_dev/my-template
cp -r dist/* custom_components/glasshopper_templates_dev/my-template/
cat > custom_components/glasshopper_templates_dev/my-template/template.json <<EOF
{
  "id": "my-template",
  "name": "My Template",
  "version": "0.1.0",
  "author": "you",
  "description": "What this dashboard is for."
}
EOF

# Zip it
cd custom_components/glasshopper_templates_dev
zip -r my-template.zip my-template/
```

Upload the zip to a public URL (GitHub release, Gumroad download, S3) and ship
the URL to your users — they install it via the service or the integration UI.

## First-party templates

| ID        | Tier | Source                               |
| --------- | ---- | ------------------------------------ |
| `minimal` | free | Repo root (use `create-glasshopper`) |

Commercial templates are distributed by their authors and are not part of this
repository. The registry only lists open templates.

## Contributing a template

1. Fork this repo.
2. Add an entry to `registry.json` with a working `download` URL.
3. Open a PR. We'll review for: license clarity, security (no inline tokens),
   build reproducibility, and that the preview matches reality.

Community templates may live in your own repo — the registry just lists them.
