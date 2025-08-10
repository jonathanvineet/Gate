Gate

Development notes
- OKX DEX Aggregator is proxied via `/okx-dex` in Vite dev server. Configure credentials in a `.env.local` using the keys shown in `.env.example`.
- Some deployments require only `x-api-key`; others require `OK-ACCESS-*` signing (key/secret/passphrase). Both are supported via dev proxy headers.
- Default proxy target is `https://www.okx.com/api/v5/dex/aggregator`. Override with `VITE_OKX_DEX_PROXY_TARGET` if your deployment differs.
- Testnets are generally unsupported by OKX DEX. The UI shows mock quotes on those networks and disables swap execution.
