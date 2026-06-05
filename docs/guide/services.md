# Services

The integration exposes three services under the `glasshopper` domain.

## `glasshopper.install_template`

Download a zip and install it as a template.

| Field         | Type   | Required | Description                                          |
| ------------- | ------ | -------- | ---------------------------------------------------- |
| `url`         | string | yes      | HTTPS URL to a zip file.                             |
| `template_id` | string | no       | Override the auto-derived folder name.               |

Constraints:

- Max zip size: **50 MB**.
- Timeout: **60 s**.
- Path traversal in the zip is rejected.
- Zip must contain `index.html` at root or one level deep.

```yaml
service: glasshopper.install_template
data:
  url: https://github.com/.../releases/download/v0.1.0/template.zip
  template_id: my-dashboard
```

## `glasshopper.reload_templates`

Re-scan `<config>/glasshopper_templates/`. Use after manual file changes.

```yaml
service: glasshopper.reload_templates
```

## `glasshopper.remove_template`

Delete a template directory from disk.

| Field         | Type   | Required | Description              |
| ------------- | ------ | -------- | ------------------------ |
| `template_id` | string | yes      | Folder name to delete.   |

```yaml
service: glasshopper.remove_template
data:
  template_id: my-dashboard
```

::: warning
Removing a template that is still referenced by a ConfigEntry will leave the
panel pointing at a missing template. Delete the integration entry first, or
re-point it via the options flow.
:::
