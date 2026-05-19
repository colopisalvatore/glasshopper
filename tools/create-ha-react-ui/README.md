# create-tessera

Scaffold a fresh Home Assistant React dashboard with Tessera.

```bash
npx create-tessera my-dashboard
```

## Options

- `--template <id>` — one of `minimal`, `jarvis`. Default: `minimal`.
- `--help` — show all flags.
- `--version` — print CLI version.

## Templates

| ID        | What you get                                                 |
| --------- | ------------------------------------------------------------ |
| `minimal` | Empty React app with hooks wired, Tailwind off, ready to go. |
| `jarvis`  | Premium iOS-Home-style dashboard (paid template).            |

## What it does

1. Fetches the chosen template subfolder from [`colopisalvatore/ha-react-ui`](https://github.com/colopisalvatore/ha-react-ui) using `tiged` (no git history).
2. Renames `package.json#name` to your project slug.
3. Prints next steps for installing deps and running the dev server.

## After scaffolding

```bash
cd my-dashboard
cp .env.example .env.local      # set VITE_HA_URL
npm install
npm run dev
```

For panel-mode deployment, see the parent project's [Quick start](https://github.com/colopisalvatore/ha-react-ui#quick-start).

## License

Apache-2.0.
