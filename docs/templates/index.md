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
