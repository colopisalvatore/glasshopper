#!/usr/bin/env node
// Build the reference React app as the bundled "minimal" template and place it
// inside the integration package at custom_components/glasshopper/bundled/minimal/.
// The integration seeds that into <config>/glasshopper_templates/minimal/ on
// setup, so a fresh install always has a working template (no chicken-and-egg).
// Run via `npm run sync`.
//
// Templates build with a RELATIVE base ("./") so their assets resolve no matter
// which /glasshopper_files/<id>/ path they get mounted at.

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  rmSync,
  cpSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const distDir = resolve(repoRoot, "dist");
const target = resolve(
  repoRoot,
  "custom_components",
  "glasshopper",
  "bundled",
  "minimal",
);

const env = { ...process.env, VITE_BASE: "./" };
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

const build = spawnSync(npm, ["run", "build"], {
  cwd: repoRoot,
  env,
  stdio: "inherit",
  shell: process.platform === "win32",
});
if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

if (!existsSync(distDir) || !statSync(distDir).isDirectory()) {
  console.error(`sync-panel: dist/ not found at ${distDir} after build.`);
  process.exit(1);
}

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(distDir, target, { recursive: true });

const manifest = {
  id: "minimal",
  name: "Minimal",
  version: "0.1.0",
  author: "glasshopper",
  description: "Bare scaffold with the five hooks wired. A starting point.",
};
writeFileSync(
  resolve(target, "template.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);

console.log(`sync-panel: built minimal template -> ${target}`);
