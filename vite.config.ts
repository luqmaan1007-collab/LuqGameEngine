import { defineConfig } from 'vite';

// Android WebView and Tauri load assets from file:// URLs. Relative paths
// are essential: root-relative /assets/... URLs resolve outside the app.
export default defineConfig({
  base: './',
  build: { target: 'es2022', assetsDir: 'assets', sourcemap: true },
  server: { host: '0.0.0.0' },
  preview: { host: '0.0.0.0' }
});
