# Templates

A **template** is a built React bundle served by the integration. Each
ConfigEntry points at one installed template.

## Where templates live

```
<config>/glasshopper_templates/
├── minimal/
│   ├── index.html
│   ├── assets/
│   └── template.json
├── jarvis/
│   ├── index.html
│   ├── assets/
│   └── template.json
└── my-custom/
    ├── index.html
    └── assets/
```

Templates are discovered at startup and re-scanned whenever you call
`glasshopper.reload_templates`.

## Installing

Three options:

1. **Service call** — easiest:

   ```yaml
   service: glasshopper.install_template
   data:
     url: https://example.com/my-template.zip
   ```

2. **Manual drop** — extract a zip into `<config>/glasshopper_templates/<id>/`,
   then call `glasshopper.reload_templates`.

3. **Build locally** — `npm run sync` builds into
   `custom_components/glasshopper/frontend/` for a single-bundled deployment.
   Use this for personal dashboards that don't need to be redistributable.

## Removing

```yaml
service: glasshopper.remove_template
data:
  template_id: my-template
```

Or delete the folder manually and call `reload_templates`.

## Manifest

`template.json` is optional metadata:

```json
{
  "id": "my-template",
  "name": "My Template",
  "version": "0.1.0",
  "author": "you",
  "description": "Short blurb.",
  "preview": "https://example.com/preview.png"
}
```

If absent, the directory name becomes the `id` and `name`.

See [Build your own template](/templates/build) for the full guide.
