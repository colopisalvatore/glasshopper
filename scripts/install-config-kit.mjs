#!/usr/bin/env node
// Install the shared entity-config "kit" into a template's src/ so it can host
// the setup wizard. Mechanical parts only — the bespoke slots.ts and App.tsx
// wiring are authored per template.
//
// Copies the canonical kit (from Aria) and ensures the two integration points:
//   - hooks/index.ts re-exports useGhConfig
//   - lib/haConnection.ts exports sendCommand (older copies lack it)
//
// Usage: node scripts/install-config-kit.mjs <templateSrcDir> [<templateSrcDir>...]
// Paths are resolved from the current working directory (run from repo root).

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const CANON = path.resolve('glasshopper/templates/aria/src');

const KIT_FILES = [
  'lib/ghConfig.ts',
  'hooks/useGhConfig.ts',
  'config/EntityPicker.tsx',
  'config/SetupWizard.tsx',
  'config/config.css',
];

const HOOK_EXPORT = "export { useGhConfig, type UseGhConfig } from './useGhConfig';";

const SEND_COMMAND = `
/** Send a custom WebSocket command (e.g. \`glasshopper/config/get\`). */
export async function sendCommand<T>(
  type: string,
  params?: Record<string, unknown>,
): Promise<T> {
  if (!connection) throw new Error('HA connection is not established');
  return connection.sendMessagePromise<T>({ type, ...(params ?? {}) });
}
`;

export function installKit(destSrc) {
  for (const rel of KIT_FILES) {
    const dest = path.join(destSrc, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(CANON, rel), dest);
  }

  const idx = path.join(destSrc, 'hooks/index.ts');
  let s = fs.readFileSync(idx, 'utf8');
  if (!s.includes('useGhConfig')) {
    fs.writeFileSync(idx, s.trimEnd() + '\n' + HOOK_EXPORT + '\n');
  }

  const ha = path.join(destSrc, 'lib/haConnection.ts');
  let h = fs.readFileSync(ha, 'utf8');
  if (!h.includes('export async function sendCommand')) {
    if (!/\bconnection\b/.test(h)) {
      throw new Error(
        `${ha}: cannot add sendCommand — no module-level 'connection' found; wire it manually`,
      );
    }
    fs.writeFileSync(ha, h.trimEnd() + '\n' + SEND_COMMAND);
  }
}

const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMain) {
  const targets = process.argv.slice(2);
  if (targets.length === 0) {
    console.error('usage: node scripts/install-config-kit.mjs <templateSrcDir> [...]');
    process.exit(1);
  }
  for (const t of targets) {
    const abs = path.resolve(t);
    installKit(abs);
    console.log(`install-config-kit: kit installed into ${abs}`);
  }
}
