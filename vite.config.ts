import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.VOICE_API_KEY': JSON.stringify(env.VOICE_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    base: '/driver-finance-pro/', // Configuração para GitHub Pages
    server: {
      // HMR is disabled via DISABLE_HMR env var.
      // File watching is disabled to prevent flickering during edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
