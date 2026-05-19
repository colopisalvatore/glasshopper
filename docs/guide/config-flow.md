# Config flow

Adding the integration runs a small form-based flow. All fields are editable
after creation via the **Configure** button on the integration card — except
the slug, which is immutable (it would break the panel URL).

## Fields

| Field            | Type    | Editable   | Notes                                                          |
| ---------------- | ------- | ---------- | -------------------------------------------------------------- |
| Template         | enum    | yes        | Must be an installed template.                                 |
| Sidebar title    | string  | yes        | Free text. Shows next to the icon in the sidebar.              |
| URL slug         | string  | **no**     | `^[a-z0-9][a-z0-9_-]{1,30}$`. Used in `/<slug>` and `/custom-dashboard/<slug>/`. |
| MDI icon         | string  | yes        | `mdi:*` icon name. Default `mdi:view-dashboard`.               |
| Admin only       | bool    | yes        | If true, only HA admin users can open the panel.               |
| Public standalone | bool   | yes        | If true, `/custom-dashboard/<slug>/` is reachable without login. |

## Aborts

- `already_configured` — a dashboard with this slug already exists.
- `no_templates` — the integration has no templates installed yet. Install one first.

## Programmatic creation

There is no YAML config flow — everything is UI-driven. To automate, use the
HA REST API:

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     "$HA/api/config/config_entries/flow" \
     -d '{"handler": "ha_react_ui"}'
```

Then continue with the returned flow_id.
