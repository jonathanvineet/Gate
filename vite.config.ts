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
  // Allow overriding proxy target to match OKX deployments; default to official domain
  const OKX_PROXY_TARGET = env.VITE_OKX_DEX_PROXY_TARGET || 'https://web3.okx.com/api/v5/dex/aggregator';
  // Toggle signing on/off for debugging or when only x-api-key is required
  const OKX_SIGN = (env.VITE_OKX_DEX_SIGN ?? 'true').toLowerCase() !== 'false';
  const OKX_DEBUG = (env.VITE_OKX_DEX_DEBUG ?? 'true').toLowerCase() !== 'false';
  if (!OKX_API_KEY) {
    // eslint-disable-next-line no-console
    console.warn('[okx-dex proxy] VITE_OKX_DEX_API_KEY is not set. Public endpoints may return 401. You can also set VITE_OKX_DEX_API_KEY_HEADER (default x-api-key).');
  }
  // eslint-disable-next-line no-console
  console.log(`[okx-dex proxy] target=${OKX_PROXY_TARGET} sign=${OKX_SIGN} header=${OKX_API_KEY_HEADER}`);

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
          target: OKX_PROXY_TARGET,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/okx-dex/, ''),
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'accept': 'application/json',
            'content-type': 'application/json',
          },
          configure: (proxy) => {
            // helper to mask sensitive strings in logs
            const mask = (val?: string | null, visible: number = 4) => {
              if (!val) return '';
              const s = String(val);
              if (s.length <= visible) return '*'.repeat(Math.max(0, s.length - 1)) + s.slice(-1);
              return s.slice(0, 2) + '***' + s.slice(-visible);
            };
            proxy.on('proxyReq', (proxyReq, req) => {
              // Lightweight, safe diagnostics on each proxied request
              const method = (req.method || 'GET').toUpperCase();
              const basePath = '/api/v5/dex/aggregator';
              const pathWithQuery = (req.url || '/');
              const requestPath = basePath + pathWithQuery; // required for signature prehash

              if (OKX_DEBUG) {
                // eslint-disable-next-line no-console
                console.log(`[okx-dex proxy] request -> ${method} ${pathWithQuery}`);
              }

              if (OKX_API_KEY) {
                // Set both common header variants; OKX infra can differ per product
                proxyReq.setHeader(OKX_API_KEY_HEADER, OKX_API_KEY);
                if (OKX_API_KEY_HEADER !== 'OK-ACCESS-KEY') proxyReq.setHeader('OK-ACCESS-KEY', OKX_API_KEY);
                if (OKX_API_KEY_HEADER !== 'x-api-key') proxyReq.setHeader('x-api-key', OKX_API_KEY);
                if (OKX_DEBUG) {
                  // eslint-disable-next-line no-console
                  console.log(`[okx-dex proxy] key header set: ${OKX_API_KEY_HEADER}=${mask(OKX_API_KEY)}`);
                }
              }
              if (OKX_ACCESS_TOKEN) {
                proxyReq.setHeader('OK-ACCESS-TOKEN', OKX_ACCESS_TOKEN);
                if (OKX_DEBUG) {
                  // eslint-disable-next-line no-console
                  console.log(`[okx-dex proxy] token header set: OK-ACCESS-TOKEN=${mask(OKX_ACCESS_TOKEN)}`);
                }
              }
              // If full API credentials are present, sign per OKX v5 rules
              if (OKX_SIGN && OKX_API_KEY && OKX_API_SECRET && OKX_API_PASSPHRASE) {
                const ts = new Date().toISOString();
                const body = method === 'GET' ? '' : (req as any)._body || '';
                const prehash = ts + method + requestPath + body;
                const sign = crypto.createHmac('sha256', OKX_API_SECRET).update(prehash).digest('base64');
                proxyReq.setHeader('OK-ACCESS-KEY', OKX_API_KEY);
                proxyReq.setHeader('OK-ACCESS-PASSPHRASE', OKX_API_PASSPHRASE);
                proxyReq.setHeader('OK-ACCESS-TIMESTAMP', ts);
                proxyReq.setHeader('OK-ACCESS-SIGN', sign);
                // Safe log: show method/path and which headers are present, without exposing values
                // eslint-disable-next-line no-console
                console.log(`[okx-dex proxy] sign on: ${method} ${pathWithQuery}`);
                if (OKX_DEBUG) {
                  // eslint-disable-next-line no-console
                  console.log('[okx-dex proxy] headers:', {
                    'OK-ACCESS-KEY': mask(OKX_API_KEY),
                    'OK-ACCESS-PASSPHRASE': mask(OKX_API_PASSPHRASE),
                    'OK-ACCESS-TIMESTAMP': ts,
                    'OK-ACCESS-SIGN': mask(sign),
                  });
                }
              } else if (pathWithQuery?.startsWith('/quote') || pathWithQuery?.startsWith('/swap')) {
                // eslint-disable-next-line no-console
                console.warn('[okx-dex proxy] signing disabled or missing creds — key:', !!OKX_API_KEY, 'secret:', !!OKX_API_SECRET, 'passphrase:', !!OKX_API_PASSPHRASE);
              }
              proxyReq.setHeader('accept', 'application/json');
            });
            // Lightweight response logger to help diagnose 4xx/5xx during dev
            proxy.on('proxyRes', (proxyRes, req) => {
              const status = proxyRes.statusCode || 0;
              if (status >= 400) {
                const method = (req.method || 'GET').toUpperCase();
                const pathWithQuery = req.url || '';
                // eslint-disable-next-line no-console
                console.warn(`[okx-dex proxy] ${status} ${method} ${pathWithQuery}`);
              }
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
