#!/usr/bin/env node
// create-glasshopper — scaffold a fresh Home Assistant React dashboard with Glasshopper.
//
//   npx create-glasshopper my-dashboard
//   npx create-glasshopper my-dashboard --template minimal
//
// Clones the upstream repo (default branch) into the target directory, drops
// the .git folder, and rewrites package.json `name` to the project slug.

import { mkdir, readFile, rm, writeFile, access } from 'node:fs/promises';
import { resolve, relative, basename } from 'node:path';
import { argv, exit, stdout, stderr } from 'node:process';
import { createInterface } from 'node:readline/promises';

const REPO = 'colopisalvatore/glasshopper';
const DEFAULT_BRANCH = 'main';

// Templates ship as subpaths of the upstream repo. The "minimal" template is
// the repo root itself (the scaffold IS a working minimal template).
const TEMPLATES = {
  minimal: { subdir: '', label: 'Minimal — full scaffold + Python integration + 5 hooks' },
  jarvis: { subdir: 'templates/jarvis', label: 'Jarvis — iOS-Home-style premium dashboard (paid)' },
};

function parseArgs(args) {
  const out = { name: null, template: 'minimal', help: false, version: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--version' || a === '-v') out.version = true;
    else if (a === '--template' || a === '-t') out.template = args[++i];
    else if (a.startsWith('--template=')) out.template = a.slice(11);
    else if (!a.startsWith('-') && !out.name) out.name = a;
  }
  return out;
}

function help() {
  stdout.write(`create-glasshopper — scaffold a Home Assistant React dashboard

Usage:
  npx create-glasshopper <name> [--template <id>]

Templates:
${Object.entries(TEMPLATES)
  .map(([id, t]) => `  ${id.padEnd(10)} ${t.label}`)
  .join('\n')}

Options:
  -t, --template <id>   Template to use (default: minimal)
  -h, --help            Show this help
  -v, --version         Show version
`);
}

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function prompt(question, fallback) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const ans = (await rl.question(`${question}${fallback ? ` (${fallback})` : ''}: `)).trim();
    return ans || fallback || '';
  } finally {
    rl.close();
  }
}

function isValidSlug(s) {
  return /^[a-z0-9][a-z0-9_-]{0,63}$/.test(s);
}

async function main() {
  const opts = parseArgs(argv.slice(2));

  if (opts.help) {
    help();
    return;
  }
  if (opts.version) {
    const pkg = JSON.parse(
      await readFile(new URL('./package.json', import.meta.url), 'utf8'),
    );
    stdout.write(`${pkg.version}\n`);
    return;
  }

  let name = opts.name;
  if (!name) {
    name = await prompt('Project name', 'my-dashboard');
  }
  if (!isValidSlug(name)) {
    stderr.write(
      `Invalid name "${name}". Use lowercase letters, digits, "-" or "_". Start with a letter or digit.\n`,
    );
    exit(1);
  }

  const template = TEMPLATES[opts.template];
  if (!template) {
    stderr.write(
      `Unknown template "${opts.template}". Available: ${Object.keys(TEMPLATES).join(', ')}\n`,
    );
    exit(1);
  }

  const target = resolve(process.cwd(), name);
  if (await exists(target)) {
    stderr.write(`Target directory "${name}" already exists. Aborting.\n`);
    exit(1);
  }

  stdout.write(`\n→ Scaffolding ${name} from ${template.label}\n`);

  let tiged;
  try {
    ({ default: tiged } = await import('tiged'));
  } catch {
    stderr.write(
      'Missing dependency "tiged". Reinstall this CLI:\n  npm i -g create-glasshopper\n',
    );
    exit(1);
  }

  const source = template.subdir
    ? `${REPO}/${template.subdir}#${DEFAULT_BRANCH}`
    : `${REPO}#${DEFAULT_BRANCH}`;
  const emitter = tiged(source, { cache: false, force: true, verbose: false });
  emitter.on('info', (info) => stdout.write(`  ${info.message}\n`));

  try {
    await emitter.clone(target);
  } catch (err) {
    stderr.write(`Failed to fetch template: ${err.message}\n`);
    await rm(target, { recursive: true, force: true });
    exit(1);
  }

  // Rewrite package.json name to match project slug.
  const pkgPath = resolve(target, 'package.json');
  if (await exists(pkgPath)) {
    const pkg = JSON.parse(await readFile(pkgPath, 'utf8'));
    pkg.name = name;
    pkg.private = true;
    pkg.version = '0.1.0';
    await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }

  // Drop .env.local if it accidentally shipped.
  await rm(resolve(target, '.env.local'), { force: true });

  // Ensure target dir exists (mkdir is harmless if already created by tiged).
  await mkdir(target, { recursive: true });

  stdout.write(`
Done. Next steps:

  cd ${relative(process.cwd(), target) || basename(target)}
  cp .env.example .env.local      # set VITE_HA_URL
  npm install
  npm run dev

Build for HA panel:
  npm run sync                    # builds and copies dist/ into custom_components/

Then copy custom_components/glasshopper/ to your HA config dir (or install via HACS).

Docs: https://github.com/${REPO}#quick-start
`);
}

main().catch((err) => {
  stderr.write(`${err.stack || err.message || err}\n`);
  exit(1);
});
