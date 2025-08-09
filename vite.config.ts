import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      process: 'process/browser',
      util: 'util'
    },
  },
  optimizeDeps: {
    include: ['buffer', 'process'],
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        globals: {
          buffer: 'Buffer'
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // route to local verifier backend
        changeOrigin: true,
        secure: false,
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      },
      '/v2': {
        target: 'https://880557ac9c31.ngrok-free.app', // issuer ngrok URL
        changeOrigin: true,
        secure: true,
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      }
    }
  }
});
