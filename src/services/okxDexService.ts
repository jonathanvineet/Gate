// Lightweight OKX DEX Aggregator client with graceful fallbacks
// Note: Endpoints and params may require adjustment per official docs.

export type DexQuoteParams = {
  chainId: number;
  inTokenAddress: string; // token the user pays with
  outTokenAddress: string; // token the staking pool accepts
  amount: string; // amount in base units (wei)
  slippageBps?: number; // 50 = 0.5%
  chainIndex?: number; // prefer this on mainnet per OKX docs
};

export type DexQuote = {
  chainId: number;
  inTokenAddress: string;
  outTokenAddress: string;
  amountIn: string; // base units
  amountOut: string; // base units
  estimatedGas?: string;
  routerAddress?: string;
  // Carrier for provider-specific fields; do not rely on shape
  raw?: unknown;
};

export type DexSwapBuildParams = DexQuoteParams & {
  fromAddress: string;
};

export type BuiltSwapTx = {
  to: string;
  data: string;
  value?: string; // hex or decimal string in wei
};

// Use proxy during development to avoid CORS; set VITE_OKX_DEX_BASE_URL in prod
const DEFAULT_BASE_URL = (import.meta as any)?.env?.VITE_OKX_DEX_BASE_URL ||
  '/okx-dex';
const OKX_DEBUG = ((import.meta as any)?.env?.VITE_OKX_DEX_DEBUG ?? 'true').toLowerCase() !== 'false';

export class OkxDexService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || DEFAULT_BASE_URL;
    
  }

  // Map common EVM chainIds to OKX chainIndex where applicable
  getChainIndex(chainId: number): number | undefined {
    switch (Number(chainId)) {
  case 1: return 1; // Ethereum
  case 56: return 2; // BSC
  case 137: return 3; // Polygon
  case 42161: return 4; // Arbitrum One
  case 10: return 5; // Optimism
      // add more as needed
      default: return undefined;
    }
  }

  // Fetch a swap quote. Single call (chainId-only). On failure, return a mocked estimate but log everything.
  async getQuote(params: DexQuoteParams): Promise<DexQuote> {
    // Always use chainId to avoid chainIndex inconsistencies
    const qp = new URLSearchParams({
      chainId: String(params.chainId),
      fromTokenAddress: params.inTokenAddress,
      toTokenAddress: params.outTokenAddress,
      amount: params.amount,
      swapMode: 'exactIn',
    });
    const url = `${this.baseUrl}/quote?${qp.toString()}`;
    if (OKX_DEBUG) {
      console.log('[okx-dex client] getQuote request', {
        url,
        params: {
          chainId: params.chainId,
          inTokenAddress: params.inTokenAddress,
          outTokenAddress: params.outTokenAddress,
          amount: params.amount,
          slippageBps: params.slippageBps,
        }
      });
    }
    try {
      const res = await fetch(url, { method: 'GET' });
      const text = await res.text().catch(() => '');
      let body: any = null;
      try { body = text ? JSON.parse(text) : null; } catch { body = text; }
      if (OKX_DEBUG) {
        console.log('[okx-dex client] getQuote status', res.status);
        console.log('[okx-dex client] getQuote raw', typeof body === 'string' ? body.slice(0, 4000) : body);
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (body && typeof body === 'object' && (body.error || body.msg || body.message) && body.code !== '0') {
        throw new Error(body.error || body.msg || body.message);
      }
      const payload = body?.data ?? body?.result ?? body;
      const item = Array.isArray(payload)
        ? payload[0]
        : (Array.isArray(payload?.data) ? payload.data[0] : payload);
      const amountOut =
        item?.toTokenAmount ||
        item?.amountOut ||
        item?.toAmount ||
        item?.quote?.toTokenAmount ||
        item?.quote?.amountOut || '';
      if (OKX_DEBUG) {
        console.log('[okx-dex client] normalized', { amountOut, estimatedGas: item?.estimateGasFee || item?.estimatedGas || item?.gas, router: item?.router || item?.to });
      }
      if (!amountOut || amountOut === '0') throw new Error('Empty amountOut');
      return {
        chainId: params.chainId,
        inTokenAddress: params.inTokenAddress,
        outTokenAddress: params.outTokenAddress,
        amountIn: params.amount,
        amountOut: String(amountOut),
        estimatedGas: String(item?.estimateGasFee || item?.estimatedGas || item?.gas || ''),
        routerAddress: item?.router || item?.to,
        raw: item,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (OKX_DEBUG) console.warn('[okx-dex client] getQuote failed, returning mock', msg);
      const mockOut = mockProportionalOut(params.amount, 0.98);
      return {
        chainId: params.chainId,
        inTokenAddress: params.inTokenAddress,
        outTokenAddress: params.outTokenAddress,
        amountIn: params.amount,
        amountOut: mockOut,
      };
    }
  }

  // Build a transaction for the user's wallet to execute the swap via OKX router (single call, chainId-only)
  async buildSwapTx(params: DexSwapBuildParams): Promise<BuiltSwapTx> {
    const qp = new URLSearchParams({
      chainId: String(params.chainId),
      amount: params.amount,
      swapMode: 'exactIn',
      fromTokenAddress: params.inTokenAddress,
      toTokenAddress: params.outTokenAddress,
      userWalletAddress: params.fromAddress,
      ...(params.slippageBps != null ? { slippage: (params.slippageBps / 100).toString() } : {}),
    });
    const url = `${this.baseUrl}/swap?${qp.toString()}`;
    if (OKX_DEBUG) console.log('[okx-dex client] buildSwap request', { url, params });
    const res = await fetch(url, { method: 'GET' });
    const text = await res.text().catch(() => '');
    let body: any = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    if (OKX_DEBUG) {
      console.log('[okx-dex client] buildSwap status', res.status);
      console.log('[okx-dex client] buildSwap raw', typeof body === 'string' ? body.slice(0, 4000) : body);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (body && typeof body === 'object' && (body.error || body.msg || body.message) && body.code !== '0') {
      throw new Error(body.error || body.msg || body.message);
    }
    const envelope = body?.data ?? body?.result ?? [];
    const data = Array.isArray(envelope) ? envelope[0] : envelope;
    const to = data?.tx?.to || data?.to;
    const dataHex = data?.tx?.data || data?.data;
    const value = data?.tx?.value || data?.value;
    if (!to || !dataHex) throw new Error('Invalid swap tx payload');
    return { to, data: dataHex, value };
  }
}

function mockProportionalOut(amountInWei: string, ratio: number): string {
  // Convert a decimal string in wei to BigInt, apply ratio, return string
  try {
    const amt = BigInt(amountInWei);
    const scaled = BigInt(Math.floor(ratio * 1_000_000)) * amt / 1_000_000n;
    return scaled.toString();
  } catch {
    return amountInWei;
  }
}
