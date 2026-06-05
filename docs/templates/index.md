# Templates

A **template** is a built React bundle that the `glasshopper` integration
serves as a Home Assistant panel.

## First-party templates

| ID        | Tier    | What you get                                              |
| --------- | ------- | --------------------------------------------------------- |
| `minimal` | free    | Empty scaffold with the five hooks wired. Start here.     |
| `jarvis`  | premium | iOS-Home-style premium dashboard. Multi-room, energy, weather. |

Premium templates ship as built bundles only — source stays closed.

## Install a template

See [Services / install_template](/guide/services#glasshopper-install_template):

```yaml
service: glasshopper.install_template
data:
  url: https://example.com/my-template.zip
```

## Build your own

See [Build your own template](./build).

## Submit to the registry

If your template is open-source and you want it listed in the public registry:

1. Fork [`colopisalvatore/glasshopper`](https://github.com/colopisalvatore/glasshopper).
2. Add an entry to `templates/registry.json` with a working `download` URL.
3. Open a PR.

Community templates may live in your own repo — the registry just points at them.
