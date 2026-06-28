import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Builds the Manager admin app (manager.html → src/manager/main-manager.tsx)
// into dist-manager/. Relative base ("./") so assets resolve under
// /glasshopper_files/manager/. sync-manager.mjs copies it to the package.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.VITE_BASE ?? '/';

  return {
    base,
    plugins: [react()],
    resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
    build: {
      outDir: 'dist-manager',
      rollupOptions: { input: path.resolve(__dirname, 'manager.html') },
    },
  };
});
