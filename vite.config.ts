import { defineConfig, loadEnv } from 'vite';
import crypto from 'crypto';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Read OKX DEX API key for dev proxy header injection (do NOT expose to client)
  const env = loadEnv(mode, process.cwd(), '');
  const OKX_API_KEY = env.VITE_OKX_DEX_API_KEY;
  const OKX_API_SECRET = env.VITE_OKX_DEX_API_SECRET; // HMAC secret
  const OKX_API_PASSPHRASE = env.VITE_OKX_DEX_API_PASSPHRASE; // API passphrase
  // Default to 'x-api-key' per many public gateways; allow override to 'OK-ACCESS-KEY'
  const OKX_API_KEY_HEADER = env.VITE_OKX_DEX_API_KEY_HEADER || 'x-api-key';
  const OKX_ACCESS_TOKEN = env.VITE_OKX_DEX_ACCESS_TOKEN; // optional bearer-like token used by some OKX DEX deployments

  return {
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
        '/okx-dex': {
          target: 'https://web3.okx.com/api/v5/dex/aggregator',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/okx-dex/, ''),
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              if (OKX_API_KEY) {
                // Set both common header variants; OKX infra can differ per product
                proxyReq.setHeader(OKX_API_KEY_HEADER, OKX_API_KEY);
                if (OKX_API_KEY_HEADER !== 'OK-ACCESS-KEY') proxyReq.setHeader('OK-ACCESS-KEY', OKX_API_KEY);
                if (OKX_API_KEY_HEADER !== 'x-api-key') proxyReq.setHeader('x-api-key', OKX_API_KEY);
              }
              if (OKX_ACCESS_TOKEN) {
                proxyReq.setHeader('OK-ACCESS-TOKEN', OKX_ACCESS_TOKEN);
              }
              // If full API credentials are present, sign per OKX v5 rules
              if (OKX_API_KEY && OKX_API_SECRET && OKX_API_PASSPHRASE) {
                const ts = new Date().toISOString();
                const method = (req.method || 'GET').toUpperCase();
                // requestPath must include the '/api/v5/dex/aggregator' prefix + path + query
                const basePath = '/api/v5/dex/aggregator';
                const pathWithQuery = (req.url || '/'); // already rewritten to /swap?...
                const requestPath = basePath + pathWithQuery;
                const body = method === 'GET' ? '' : (req as any)._body || '';
                const prehash = ts + method + requestPath + body;
                const sign = crypto.createHmac('sha256', OKX_API_SECRET).update(prehash).digest('base64');
                proxyReq.setHeader('OK-ACCESS-KEY', OKX_API_KEY);
                proxyReq.setHeader('OK-ACCESS-PASSPHRASE', OKX_API_PASSPHRASE);
                proxyReq.setHeader('OK-ACCESS-TIMESTAMP', ts);
                proxyReq.setHeader('OK-ACCESS-SIGN', sign);
              }
              proxyReq.setHeader('accept', 'application/json');
            });
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
  };
});
