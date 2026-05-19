# HA React UI — landing site

Astro single-pager for [hareactui.dev](https://hareactui.dev).

```bash
cd site
npm install
npm run dev          # http://localhost:4321
npm run build        # static output to site/dist/
```

Deploy `site/dist/` to any static host: Vercel, Netlify, Cloudflare Pages,
GitHub Pages.

## Vercel config

`vercel.json` at the repo root:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/site/dist/$1" }]
}
```

Or use Vercel's per-project root: `site/`.
