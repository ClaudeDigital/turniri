import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/ngucatinderondeshmoret/',
  server: {
    port: 5173,
    proxy: {
      '/ngucatinderondeshmoret/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/ngucatinderondeshmoret/logo.jpg': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
});
