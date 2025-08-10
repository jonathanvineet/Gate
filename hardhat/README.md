# Gate Hardhat

Quick Hardhat project to deploy `StakingPool`.

## Setup

1. Copy `.env.example` to `.env` and fill:
   - `DEPLOYER_KEY` (private key)
   - `STAKING_TOKEN_ADDRESS` (e.g., WMATIC on Polygon)
   - RPC URLs

2. Install deps:

```bash
cd hardhat
npm install
```

## Compile

```bash
npm run compile
```

## Deploy

- Local (in-memory):
```bash
npm run deploy:local
```

- Polygon mainnet:
```bash
npm run deploy:polygon
```

- Polygon Amoy (testnet):
```bash
npm run deploy:amoy
```

- Sepolia (test):
```bash
npm run deploy:sepolia
```

## Token addresses

- Polygon (137)
  - WMATIC (Wrapped POL): `0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270` (decimals 18)
  - USDC.e: `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174` (decimals 6)

- Polygon Amoy (80002)
  - WMATIC (test) faucet needed. Use a known test token or deploy your own ERC20 and point STAKING_TOKEN_ADDRESS to it.

- Ethereum (1)
  - WETH: `0xC02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2` (decimals 18)
  - USDC: `0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48` (decimals 6)

After deploy, copy the new address into your app config/pool list.
