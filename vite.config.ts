import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/v2': {
        target: 'https://beab43d59fe9.ngrok-free.app',
        changeOrigin: true,
        secure: true,
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      },
      '/api': {
        target: 'https://a402836e773f.ngrok-free.app',
        changeOrigin: true,
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      }
    }
  }
});
