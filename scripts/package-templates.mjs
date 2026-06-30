#!/usr/bin/env node
// Build the free templates (aria, grid, pulse) and zip each dist/ to
// templates_dist/<id>.zip. The release workflow uploads these as assets at the
// `templates-latest` tag, which the Manager catalog installs 1-click.
//
// Uses the system `zip` (available on CI ubuntu). Run via the release workflow
// or `node scripts/package-templates.mjs`.

import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { genReadme } from "./gen-readme.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const outDir = resolve(repoRoot, "templates_dist");
const FREE = ["aria", "grid", "pulse"];
const isWin = process.platform === "win32";
const npm = isWin ? "npm.cmd" : "npm";

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

for (const id of FREE) {
  const dir = resolve(repoRoot, "templates", id);
  if (!existsSync(dir)) {
    console.error(`package-templates: template ${id} not found at ${dir}`);
    process.exit(1);
  }

  for (const args of [["install", "--no-audit", "--no-fund"], ["run", "build"]]) {
    const r = spawnSync(npm, args, {
      cwd: dir,
      env: { ...process.env, VITE_BASE: "./" },
      stdio: "inherit",
      shell: isWin,
    });
    if (r.status !== 0) process.exit(r.status ?? 1);
  }

  const dist = resolve(dir, "dist");
  if (!existsSync(dist) || !statSync(dist).isDirectory()) {
    console.error(`package-templates: ${id}/dist not found after build`);
    process.exit(1);
  }

  // Regenerate the README from the template's slot manifest, then ship it both
  // at the template root (repo) and inside the zip (the buyer sees it first).
  const md = await genReadme(dir);
  if (md) {
    writeFileSync(resolve(dir, "README.md"), md);
    writeFileSync(resolve(dist, "README.md"), md);
  } else if (existsSync(resolve(dir, "README.md"))) {
    copyFileSync(resolve(dir, "README.md"), resolve(dist, "README.md"));
  }

  // Zip the CONTENTS of dist/ (index.html + assets) at the zip root.
  const zipPath = resolve(outDir, `${id}.zip`);
  const zip = spawnSync("zip", ["-r", "-q", zipPath, "."], { cwd: dist, stdio: "inherit" });
  if (zip.status !== 0) {
    console.error(`package-templates: zip failed for ${id} (is the 'zip' CLI installed?)`);
    process.exit(zip.status ?? 1);
  }
  console.log(`package-templates: ${zipPath}`);
}

console.log(`package-templates: done -> ${outDir}`);
