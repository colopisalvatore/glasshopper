#!/usr/bin/env node
// Generate a template's README.md from its slot manifest (src/slots.ts) so the
// download always documents exactly the entities it maps — no hand-kept drift.
//
// Usage:
//   node scripts/gen-readme.mjs <templateDir>   # writes <templateDir>/README.md
//   import { genReadme } from './gen-readme.mjs' # returns the markdown string
//
// The manifest is TypeScript; we strip its types with esbuild (a vite dep) and
// import the plain-data object. A template without src/slots.ts has no mappable
// slots yet and is skipped.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { transform } from 'esbuild';

const DOCS_URL = 'https://docs.glasshopper.dev/guide/configure-entities';

/** Load the `{ template, slots }` manifest out of a template's slots.ts. */
async function loadManifest(slotsPath) {
  const tsSrc = fs.readFileSync(slotsPath, 'utf8');
  const { code } = await transform(tsSrc, { loader: 'ts', format: 'esm' });
  const mod = await import(
    'data:text/javascript;base64,' + Buffer.from(code).toString('base64')
  );
  const manifest = Object.values(mod).find(
    (v) => v && typeof v === 'object' && typeof v.template === 'string' && Array.isArray(v.slots),
  );
  if (!manifest) throw new Error(`no manifest export found in ${slotsPath}`);
  return manifest;
}

function kindLabel(slot) {
  return slot.kind === 'multi' ? 'any number of' : 'one';
}

function slotSection(slot) {
  const domains = slot.domains.map((d) => `\`${d}\``).join(' / ');
  const req = slot.required ? ' · **required**' : '';
  const head = `- **${slot.label}** — ${kindLabel(slot)} ${domains} ${slot.kind === 'multi' ? 'entities' : 'entity'}${req}`;
  return slot.help ? `${head}\n  ${slot.help}` : head;
}

export async function genReadme(templateDir) {
  const slotsPath = path.join(templateDir, 'src', 'slots.ts');
  if (!fs.existsSync(slotsPath)) return null; // no mappable slots yet

  const manifest = await loadManifest(slotsPath);

  let name = manifest.template;
  let description = '';
  const metaPath = path.join(templateDir, 'public', 'template.json');
  if (fs.existsSync(metaPath)) {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    if (meta.name) name = meta.name;
    if (meta.description) description = meta.description;
  }

  const slots = manifest.slots.map(slotSection).join('\n');

  return `# ${name} — Glasshopper dashboard

${description ? description + '\n' : ''}
A React dashboard for Home Assistant. This is a compiled build: you point it at
**your** Home Assistant entities from inside the dashboard — no code edit, no
rebuild.

## Connect your entities

1. Open the dashboard. On first run the **Connect your entities** wizard opens
   automatically. Reopen it any time from the ⚙ **Entities** button.
2. Pick an entity for each card (search by friendly name or entity id).
3. Press **Done**. The dashboard shows your live data, and the mapping is saved
   to this dashboard.

Until you map them, the cards use example entities — so a fresh install reads as
a demo to customise, not an empty screen.

## Entities this dashboard maps

${slots}

## Troubleshooting

- **A card is empty or shows \`--\`** — the mapped entity is missing or
  unavailable in your Home Assistant. Open ⚙ **Entities** and re-pick it.
- **The wizard didn't open** — it auto-opens only once per dashboard. Click
  ⚙ **Entities** to open it again.
- **Wrong room / want to change one** — open ⚙ **Entities**, clear the field
  (×) and pick another.

The mapping is stored per dashboard, in this dashboard's browser storage. A
different dashboard (different sidebar entry) keeps its own mapping.

---

Full guide: <${DOCS_URL}>
`;
}

// CLI
const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMain) {
  const dir = process.argv[2];
  if (!dir) {
    console.error('usage: node scripts/gen-readme.mjs <templateDir>');
    process.exit(1);
  }
  const abs = path.resolve(dir);
  const md = await genReadme(abs);
  if (md === null) {
    console.log(`gen-readme: ${path.basename(abs)} has no src/slots.ts — skipped`);
  } else {
    const out = path.join(abs, 'README.md');
    fs.writeFileSync(out, md);
    console.log(`gen-readme: wrote ${out}`);
  }
}
