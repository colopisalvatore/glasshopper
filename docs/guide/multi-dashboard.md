# Multi-dashboard

Each call to **Settings → Devices → Add Integration → Glasshopper** creates one
*ConfigEntry*, which registers one sidebar panel. You can create as many as
you want — each with its own slug, template, icon, and admin gate.

## Example

You have one HA install and three displays:

- A wall tablet in the kitchen showing a glanceable view.
- An office desk PWA with a full control surface.
- A guest mode that hides sensitive entities.

Add three integration entries. Each picks a different (or the same)
template, and each gets its own URL:

| Entry          | Template       | Slug             | Admin only | Public |
| -------------- | -------------- | ---------------- | ---------- | ------ |
| Kitchen Tablet | `halcyon`       | `kitchen-tablet` | No         | Yes    |
| Office         | `halcyon`       | `office`         | No         | No     |
| Guest          | `minimal`      | `guest`          | No         | No     |

## Routing in the React app

The same bundle serves every panel. To branch on the slug:

```tsx
import { useMemo } from 'react';

function useDashboardSlug() {
  return useMemo(() => {
    // Panel mode: HA loads /<slug>
    // Standalone: /custom-dashboard/<slug>/
    const segments = window.location.pathname.split('/').filter(Boolean);
    if (segments[0] === 'custom-dashboard') return segments[1] ?? null;
    return segments[0] ?? null;
  }, []);
}

function App() {
  const slug = useDashboardSlug();
  switch (slug) {
    case 'kitchen-tablet':
      return <KitchenView />;
    case 'office':
      return <OfficeView />;
    default:
      return <DefaultView />;
  }
}
```

## Why share one bundle?

- Single build → single deploy → single update path.
- All dashboards stay in sync.
- Browser cache hits across panels.

If you want truly independent bundles, install multiple templates instead and
point each entry at a different template.
