import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const upstream = env.VITE_HA_URL ?? '';
  const base = env.VITE_BASE ?? '/';

  return {
    base,
    plugins: [react()],
    resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
    server: {
      host: true,
      port: 5173,
      proxy: upstream
        ? {
            '/api': { target: upstream, changeOrigin: true, ws: true, secure: false },
            '/auth': { target: upstream, changeOrigin: true, secure: false },
            '/static': { target: upstream, changeOrigin: true, secure: false },
          }
        : undefined,
    },
  };
});
