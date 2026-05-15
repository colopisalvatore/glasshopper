#!/usr/bin/env node
// Build the React app with the HA panel base path and copy the output
// into the custom_component frontend folder. Run via `npm run sync`.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, cpSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const distDir = resolve(repoRoot, "dist");
const target = resolve(
  repoRoot,
  "custom_components",
  "ha_react_ui",
  "frontend",
);

const env = { ...process.env, VITE_BASE: "/ha_react_ui_files/" };
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

console.log(`sync-panel: copied ${distDir} -> ${target}`);
