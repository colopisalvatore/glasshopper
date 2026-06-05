# Deploy — docs

This repo ships one static front end: the **docs** site. The marketing landing
lives in the separate private `glasshopper-web` repo and deploys from there.

| | Value |
| --- | --- |
| Source dir | `docs/` |
| Build command | `npm run build` |
| Output directory | `.vitepress/dist` |
| Domain | `docs.glasshopper.dev` |

Static, no secrets. `docs/.vitepress/config.ts` already uses canonical URLs.

## Cloudflare Pages (recommended)

1. **Workers & Pages → Create → Pages → Connect to Git** → pick
   `colopisalvatore/glasshopper`.
2. Build settings:
   - **Production branch:** `main`
   - **Root directory:** `docs`
   - **Build command:** `npm run build`
   - **Output directory:** `.vitepress/dist`
3. Deploy, then **Custom domains** → add `docs.glasshopper.dev`.

## Vercel (alternative)

`docs/vercel.json` is committed (framework vitepress).

1. **New Project** → import `colopisalvatore/glasshopper`, **Root Directory** =
   `docs`.
2. Deploy → **Settings → Domains** → add `docs.glasshopper.dev`.

## DNS

| Type | Name | Value |
| --- | --- | --- |
| CNAME | `docs` | `<docs-project>.pages.dev` (or `cname.vercel-dns.com` on Vercel) |

## Local check

```bash
cd docs && npm install && npm run build && npm run preview
```

## Landing

The landing (`glasshopper.dev`) deploys from the private `glasshopper-web`
repo. See that repo's `DEPLOY.md` for the apex/`www` setup.
