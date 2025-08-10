// Centralized OKX Wallet adapter for EIP-1193 provider, ethers BrowserProvider, and chain ops
import { ethers } from 'ethers';

type Eip1193 = {
  request: (args: { method: string; params?: any[] | object }) => Promise<any>;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (event: string, handler: (...args: any[]) => void) => void;
  // OKX flags (covering variants)
  isOkxWallet?: boolean;
  isOKXWallet?: boolean;
  isOKExWallet?: boolean;
  isMetaMask?: boolean;
};

declare global {
  interface Window {
    okxwallet?: any;
    ethereum?: Eip1193 | any;
  }
}

export function getOkxEip1193(): Eip1193 | null {
  const w: any = typeof window !== 'undefined' ? window : {};
  // OKX extension exposes window.okxwallet.ethereum in modern versions
  const fromOkx = w.okxwallet?.ethereum ?? w.okxwallet ?? null;
  if (fromOkx && (fromOkx.isOkxWallet || fromOkx.isOKXWallet || fromOkx.isOKExWallet || typeof fromOkx.request === 'function')) {
    return fromOkx as Eip1193;
  }
  // Some builds set a flag on window.ethereum
  const eth = w.ethereum;
  if (eth && (eth.isOkxWallet || eth.isOKXWallet || eth.isOKExWallet)) return eth as Eip1193;
  // If only a single provider exists and it's OKX-compatible, prefer it only if no MetaMask-only flags present
  if (eth && typeof eth.request === 'function' && !eth.isMetaMask) {
    return eth as Eip1193;
  }
  return null;
}

export async function ensureOkxWallet(): Promise<Eip1193> {
  const p = getOkxEip1193();
  if (!p) {
    throw new Error('OKX Wallet not found. Please install and unlock the OKX Wallet extension.');
  }
  return p;
}

export async function getEthersProvider(): Promise<ethers.BrowserProvider> {
  const p = await ensureOkxWallet();
  return new ethers.BrowserProvider(p as any);
}

export async function requestAccounts(): Promise<string[]> {
  const p = await ensureOkxWallet();
  const accounts = await p.request({ method: 'eth_requestAccounts' });
  return accounts as string[];
}

export async function switchChain(chainId: number): Promise<void> {
  const p = await ensureOkxWallet();
  const hex = '0x' + chainId.toString(16);
  await p.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hex }] });
}

export async function addChain(params: {
  chainId: string; // hex 0x...
  chainName: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
}): Promise<void> {
  const p = await ensureOkxWallet();
  await p.request({ method: 'wallet_addEthereumChain', params: [params] });
}
