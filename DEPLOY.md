# Deploy

Two static front ends ship from this repo:

| Project | Source dir | Build command | Output dir | Domain |
| --- | --- | --- | --- | --- |
| Landing | `site/` | `npm run build` | `dist` | `glasshopper.dev` |
| Docs | `docs/` | `npm run build` | `.vitepress/dist` | `docs.glasshopper.dev` |

Both are static. No server, no env vars, no secrets. Canonical URLs are already
wired in `site/src/config.ts` and `docs/.vitepress/config.ts`, so the moment the
domain resolves, links are correct.

The commercial side is **not** here. It lives in the private `glasshopper-premium`
repo; the landing markets it and links out.

---

## Recommended: Cloudflare Pages

Same dashboard as the Cloudflare registrar, free, fast, supports private repos.

### 1. Landing project

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git** → pick `colopisalvatore/glasshopper`.
2. Build settings:
   - **Production branch:** `main`
   - **Root directory:** `site`
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
3. Save and deploy. You get a `*.pages.dev` preview URL immediately.

### 2. Docs project

Repeat **Create → Pages** on the same repo, second project:
- **Root directory:** `docs`
- **Build command:** `npm run build`
- **Output directory:** `.vitepress/dist`

### 3. Wire the domain (once you own `glasshopper.dev`)

In each Pages project → **Custom domains**:
- Landing project: add `glasshopper.dev` **and** `www.glasshopper.dev`
  (set `www` to redirect to apex, or vice versa).
- Docs project: add `docs.glasshopper.dev`.

Cloudflare adds the DNS records automatically when the domain is on the same
account. If the domain is registered elsewhere, add:

| Type | Name | Value |
| --- | --- | --- |
| CNAME | `@` (or `glasshopper.dev`) | `<landing-project>.pages.dev` |
| CNAME | `www` | `<landing-project>.pages.dev` |
| CNAME | `docs` | `<docs-project>.pages.dev` |

---

## Alternative: Vercel

`site/vercel.json` and `docs/vercel.json` are committed, so Vercel needs almost
no configuration.

1. **New Project** → import `colopisalvatore/glasshopper`.
2. Create **two** projects from the same repo:
   - Landing: **Root Directory** = `site` (Vercel reads `site/vercel.json`).
   - Docs: **Root Directory** = `docs` (reads `docs/vercel.json`).
3. Deploy. Each gets a `*.vercel.app` URL.
4. **Settings → Domains** once you own the domain:
   - Landing: `glasshopper.dev` + `www.glasshopper.dev`.
   - Docs: `docs.glasshopper.dev`.
5. DNS (if the domain is not on Vercel):

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |
| CNAME | `docs` | `cname.vercel-dns.com` |

---

## Local check before deploying

```bash
# Landing
cd site && npm install && npm run build && npm run preview

# Docs
cd docs && npm install && npm run build && npm run preview
```

Both must build clean (the CI workflow already runs the landing build on every
push).

---

## "Domain arrived" checklist

1. Register `glasshopper.dev` (Cloudflare registrar, at cost).
2. Landing project → add custom domains `glasshopper.dev` + `www`.
3. Docs project → add custom domain `docs.glasshopper.dev`.
4. Wait for SSL to issue (automatic, a few minutes).
5. Visit `https://glasshopper.dev` and `https://docs.glasshopper.dev`, click
   through hero CTAs, the install command, and the docs nav.
6. Point the premium "View Jarvis" link target (`premiumUrl` in
   `site/src/config.ts`) at the live sales page when it exists.
