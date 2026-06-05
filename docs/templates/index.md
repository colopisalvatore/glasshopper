# Templates

A **template** is a built React bundle that the `glasshopper` integration
serves as a Home Assistant panel.

## First-party templates

| ID        | Tier | What you get                                          |
| --------- | ---- | ----------------------------------------------------- |
| `minimal` | free | Empty scaffold with the five hooks wired. Start here. |

Templates can be free or commercial. Commercial templates are distributed by
their authors as built bundles; they are not part of this repository.

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
