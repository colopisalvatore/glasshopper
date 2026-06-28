#!/usr/bin/env node
// Build the Manager admin app and place it inside the integration package at
// custom_components/glasshopper/manager_app/ (deliberately NOT under bundled/,
// so it is never seeded as a user template). Served at /glasshopper_files/manager/.
// Run via `npm run sync:manager`.

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  rmSync,
  cpSync,
  statSync,
  renameSync,
} from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const distDir = resolve(repoRoot, "dist-manager");
const target = resolve(repoRoot, "custom_components", "glasshopper", "manager_app");

const env = { ...process.env, VITE_BASE: "./" };
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

const build = spawnSync(npm, ["run", "build:manager"], {
  cwd: repoRoot,
  env,
  stdio: "inherit",
  shell: process.platform === "win32",
});
if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

if (!existsSync(distDir) || !statSync(distDir).isDirectory()) {
  console.error(`sync-manager: dist-manager/ not found at ${distDir} after build.`);
  process.exit(1);
}

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(distDir, target, { recursive: true });

// The manager entry html is manager.html; serve it as index.html.
const src = resolve(target, "manager.html");
const dst = resolve(target, "index.html");
if (existsSync(src)) {
  renameSync(src, dst);
}

console.log(`sync-manager: built manager app -> ${target}`);
