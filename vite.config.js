import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server proxies API + uploaded images to Express so cookies stay same-origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Listen on the LAN so phones can reach the dev server.
    host: true,
    // Firebase Phone Auth rejects bare IPs ("Hostname match not found"), so
    // phone testing goes through http://<lan-ip>.nip.io:5173, a wildcard DNS
    // name that resolves to the IP. Vite 6 blocks unknown hostnames by default.
    allowedHosts: ['.nip.io'],
    // changeOrigin: true → the Host header becomes localhost:5000 upstream.
    // Without it the API saw Host=localhost:5173 and stored dev uploads as
    // http://localhost:5173/uploads/… , a URL that only works while *this*
    // dev server happens to be running.
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
});
