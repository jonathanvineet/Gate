// These come from the app's .env; defaults point to tPOL on Polygon Amoy (80002)
export const STAKING_CONTRACT_ADDRESS = (import.meta as any)?.env?.VITE_STAKING_CONTRACT || '0x7D0ce8CB4F3615A1c9437026b2b53d2C58a9a976';
export const TOKEN_ADDRESS = (import.meta as any)?.env?.VITE_STAKING_TOKEN || '0x361D2689F8aaC8e1EB4A810Aa928fc9C78f608ca';
export const EXPECTED_CHAIN_ID: number = Number((import.meta as any)?.env?.VITE_STAKING_CHAIN_ID || 80002);
