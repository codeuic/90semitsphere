import dotenv from 'dotenv';
dotenv.config();

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(process.env.GOOGLE_MAPS_PLATFORM_KEY || '')
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      // Ignore database files (like db.json or delivo_db.json) in development to prevent infinite reloading loops!
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/db.json', '**/delivo_db.json', '**/delivo_db*.json', '**/package-lock.json', '**/.git/**']
      },
    },
  };
});
