# useTheme

Read HA theme CSS custom properties — so your dashboard adapts to the user's
selected HA theme automatically.

```tsx
import { useTheme } from '@/hooks';

function ThemedCard({ children }) {
  const theme = useTheme();
  return (
    <div
      style={{
        background: theme['card-background-color'] ?? 'var(--panel)',
        color: theme['primary-text-color'] ?? 'var(--fg)',
      }}
    >
      {children}
    </div>
  );
}
```

## Signature

```ts
function useTheme(): ThemeTokens;

type ThemeTokens = Record<string, string>;
```

## Tokens exposed

The hook reads a curated set of HA's named theme variables (without the `--`
prefix). Available keys include:

- `primary-color`, `accent-color`
- `primary-background-color`, `secondary-background-color`, `card-background-color`
- `primary-text-color`, `secondary-text-color`, `disabled-text-color`
- `divider-color`
- `error-color`, `warning-color`, `success-color`, `info-color`
- `state-icon-color`, `state-icon-active-color`
- `sidebar-background-color`, `sidebar-text-color`, `sidebar-selected-text-color`, `sidebar-selected-icon-color`
- `app-header-background-color`, `app-header-text-color`

If HA doesn't set a value (older themes, no theme selected), the key is omitted.

## Behavior

- **Panel mode** — reads from `window.parent.document.documentElement` so the
  dashboard reflects the user's HA theme choice live.
- **Standalone / dev** — reads from the local document. Define matching CSS
  custom properties in your styles to preview theming locally.
- Subscribes to a `MutationObserver` on the host element's `style` and `class`
  attributes so theme changes propagate to React without a refresh.

## When to use it

- Match the brand color of an HA-installed theme.
- Render charts in palette-coherent colors.
- Provide a fallback look that respects light/dark mode.

For static styling that doesn't need to track HA themes, write plain CSS
variables in `src/styles/`.
