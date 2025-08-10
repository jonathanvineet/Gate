<div align="center">
	<h1>CheqMate (Gate)</h1>
	<p>Web3 app with ZK-style verification, gated create flows, and on-chain staking — with optional OKX DEX API swaps to the staking token.</p>
</div>

## Overview

CheqMate is a React + Vite app that lets users:

- Connect with OKX Wallet (preferred EIP-1193 provider)
- Verify credentials (Age, Recruiter, Hackathon Creator) — mocked for privacy-friendly demos
- Create or join opportunities: Stake Pools, Hackathons, Jobs
- Deposit via a modern staking modal; when needed, swap USDC/WMATIC/other Polygon tokens into the pool’s staking token using the OKX DEX API
- Review activity and the posts you created in clean dashboard tabs

The UI follows a dark theme and is optimized for OKX Wallet and Polygon networks (mainnet and Amoy testnet).

## Key Features

- OKX Wallet preference and chain switching helpers
- Per-type verification with small status indicators; persisted in sessionStorage
- Gated Create flows (Age for all; Recruiter for Jobs)
- Staking modal with balance/allowance, approval, stake, transaction states, and test-friendly fallbacks
- OKX DEX API integration to quote and optionally swap into the required staking token before staking
- Activity history and "Your Posts" listing (local, privacy-preserving). CSV export UI is intentionally hidden.

## Tech Stack

- React 18, TypeScript, Vite, TailwindCSS
- ethers v6, lucide-react icons
- OKX Wallet (EIP-1193 provider)
- Optional: OKX DEX Aggregator API (via dev proxy)

## Repository Layout (high-level)

- `src/` — Frontend app (components, contexts, hooks, services)
	- `components/` — Header, Verify dropdowns/modals, Create dropdown, Stake/Unstake modals, dashboards
	- `contexts/VerificationContext.tsx` — Per-type verification state
	- `utils/` — Activity and create logging (localStorage CSV format)
	- `services/okxDexService.ts` — OKX DEX API client (quotes/swaps)
- `hardhat/` — Example contracts and scripts (optional local development)
- `issuer-node/`, `privado-verifier/` — Auxiliary infra for advanced verification demos (not required for basic UI demo)

## Getting Started

Prerequisites:
- Node.js 18+
- An OKX Wallet browser extension

Install and run the app:

```bash
npm install
npm run dev
```

Build and preview:

```bash
npm run build
npm run preview
```

## Environment & Proxy (OKX DEX API)

The app can call the OKX DEX Aggregator through a dev proxy to avoid CORS and secure credentials.

- Default DEX endpoint: `https://www.okx.com/api/v5/dex/aggregator`
- Proxy path (dev): `/okx-dex`

Create `.env.local` (values depend on your account/region):

```env
# Optional: override target if needed
VITE_OKX_DEX_PROXY_TARGET=https://www.okx.com/api/v5/dex/aggregator

# One of these is typically required by OKX (check your account requirements)
VITE_OKX_DEX_API_KEY=your_api_key
VITE_OKX_DEX_ACCESS_KEY=your_access_key
VITE_OKX_DEX_ACCESS_SECRET=your_access_secret
VITE_OKX_DEX_ACCESS_PASSPHRASE=your_passphrase
```

Notes:
- Some OKX deployments require only `x-api-key` headers; others require `OK-ACCESS-*` signing.
- Testnets are generally unsupported by OKX DEX; the UI will show mock quotes and disable swap execution there.

## How It Works (User Flow)

1) Connect — Click Connect to use OKX Wallet. If on the wrong network, the app will request a switch (Polygon preferred).

2) Verify — Choose Age, Recruiter, or Hackathon Creator. The current demo uses a mocked flow with QR/loader/success; on success, a flag is stored in sessionStorage and small dots indicate per-type status.

3) Create — Pick Stake Pool, Hackathon, or Job. Access is gated by verification flags (Age required; Recruiter required for Jobs). Submissions are logged locally and surface under "Your Posts".

4) Stake — The Stake Tokens modal shows token balance/allowance and pool info. If you don’t hold the required token:
	 - Use the OKX DEX API section to get a quote and optionally swap from USDC/WMATIC/other Polygon tokens into the pool’s staking token.
	 - Approve (if allowance insufficient), then Stake. Success includes an explorer link and updates Activity.

5) Review — Tabs:
	 - Pools & Opportunities: discovery and quick actions
	 - Your Activity: grouped stake history by company/pool with totals and unstake actions
	 - Your Posts: everything you created (stake pools, hackathons, jobs)

## OKX DEX API Integration (Essentials)

- Quote request includes: `chainId`, `fromToken`, `toToken` (staking token), `amount`, `slippageBps`.
- If the wallet network doesn’t match the DEX selection, the UI prompts to switch.
- On successful swap, balances/allowance refresh automatically before the approve/stake steps.
- On unsupported networks (e.g., testnets), swap execution is disabled; quotes may be mocked for UX continuity.

## Data & Privacy

- Verification is mocked; no real identity data is persisted.
- Activity and create logs are stored locally (localStorage) for your browser profile. CSV export buttons are intentionally hidden.

## Troubleshooting

- Wallet not detected: ensure OKX Wallet is installed and unlocked.
- Network issues / RPC errors: switch to another network or try again later. The app can show mock data for development when connectivity fails.
- DEX quotes missing on testnet: expected; try Polygon mainnet to enable quotes and swap execution.
- Unable to stake: ensure allowance is sufficient (Approve first) and you have enough balance of the staking token.

## Scripts

- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run preview` — preview the build
- `npm run lint` — lint checks

## Roadmap

- Optional: real issuer/verifier integration replacing mocks
- Additional networks and DEX routes
- Export/analytics views (configurable)

## License

Dual-licensed components may exist under subfolders (e.g., issuer-node includes MIT/Apache-2.0 notices). Unless stated otherwise, the frontend app code is distributed under your repository’s default license.
