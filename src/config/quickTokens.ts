// Quick-select ERC20 addresses per chain. Testnet-friendly defaults.
// You can override using env vars like VITE_QUICK_WNATIVE_80002 / VITE_QUICK_USDC_80002.

// Pull optional overrides from Vite env
type ViteEnv = Record<string, string | undefined>;
const env: ViteEnv = (import.meta as unknown as { env?: ViteEnv })?.env || {};

// Mainnet knowns
const ETH_MAINNET = {
  wnative: '0xC02aaA39b223FE8d0A0e5C4F27eAD9083C756Cc2', // WETH
  usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
};

// Polygon mainnet knowns
const POLYGON = {
  wnative: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // WMATIC
  usdc: '0x3c499c542cEF5E3811e1192cE70d8cC03d5c3359', // USDC (native)
};

// Import staking token as a safe testnet default when real tokens are absent
import { TOKEN_ADDRESS, EXPECTED_CHAIN_ID } from './staking';

// Polygon Amoy testnet (80002): no official USDC; use your test tokens.
// Defaults below avoid prompting by using your configured staking TOKEN_ADDRESS
// as a placeholder for both quick-selects (replace via env when you have real test tokens).
const AMOY = {
  wnative: env.VITE_QUICK_WNATIVE_80002 || TOKEN_ADDRESS,
  usdc: env.VITE_QUICK_USDC_80002 || TOKEN_ADDRESS,
};

export type QuickTokens = Record<number, { wnative?: string; usdc?: string }>;

export const QUICK_TOKENS: QuickTokens = {
  1: ETH_MAINNET,
  137: POLYGON,
  80002: AMOY,
};

export const getQuickToken = (chainId?: number, kind: 'wnative' | 'usdc' = 'wnative'): string | undefined => {
  const cid = chainId ?? EXPECTED_CHAIN_ID;
  const entry = QUICK_TOKENS[cid];
  return entry?.[kind];
};
