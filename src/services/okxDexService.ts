// Lightweight OKX DEX Aggregator client with graceful fallbacks
// Note: Endpoints and params may require adjustment per official docs.

export type DexQuoteParams = {
  chainId: number;
  inTokenAddress: string; // token the user pays with
  outTokenAddress: string; // token the staking pool accepts
  amount: string; // amount in base units (wei)
  slippageBps?: number; // 50 = 0.5%
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

export class OkxDexService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || DEFAULT_BASE_URL;
    
  }

  // Fetch a swap quote. Returns a best-effort quote or a mocked one if network/API fails.
  async getQuote(params: DexQuoteParams): Promise<DexQuote> {
    const slippagePct = params.slippageBps != null ? (params.slippageBps / 100).toString() : undefined;
    const qp = new URLSearchParams({
      chainId: String(params.chainId),
      // include both naming variants for compatibility
      inTokenAddress: params.inTokenAddress,
      outTokenAddress: params.outTokenAddress,
      fromTokenAddress: params.inTokenAddress,
      toTokenAddress: params.outTokenAddress,
      amount: params.amount,
    });
    if (slippagePct) qp.set('slippage', slippagePct);
    const url = `${this.baseUrl}/quote?${qp.toString()}`;

    try {
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) throw new Error(`Quote HTTP ${res.status}`);
      const body = await res.json();
      // Handle explicit error envelopes even with HTTP 200
      if (body && typeof body === 'object' && (body.error || body.msg || body.message)) {
        throw new Error(body.error || body.msg || body.message);
      }
      // Attempt to normalize a few common aggregator response shapes
      const data = body?.data || body?.result || body;
      const amountOut =
        data?.amountOut ||
        data?.toAmount ||
        data?.quote?.toTokenAmount ||
        data?.quote?.amountOut || '0';

      const base: DexQuote = {
        chainId: params.chainId,
        inTokenAddress: params.inTokenAddress,
        outTokenAddress: params.outTokenAddress,
        amountIn: params.amount,
        amountOut: String(amountOut),
        estimatedGas: String(data?.estimatedGas || data?.gas || ''),
        routerAddress: data?.router || data?.to,
        raw: data,
      };
      // Fallback to mock if we couldn't get a meaningful amountOut
      if (!base.amountOut || base.amountOut === '0') {
        throw new Error('No amountOut in quote');
      }
      return base;
    } catch (e) {
      // Graceful mock: assume 1% aggregator fee and 1% slippage
      // This is only for UI estimation; do not execute against it.
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

  // Build a transaction for the user's wallet to execute the swap via OKX router
  async buildSwapTx(params: DexSwapBuildParams): Promise<BuiltSwapTx> {
    // Use GET /swap per OKX docs; proxy signs with OK-ACCESS-* headers
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

    try {
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) throw new Error(`Swap build HTTP ${res.status}`);
      const body = await res.json();
      if (body && typeof body === 'object' && (body.error || body.msg || body.message)) {
        throw new Error(body.error || body.msg || body.message);
      }
      const arr = body?.data || body?.result || [];
      const data = Array.isArray(arr) ? arr[0] : arr;

      // Common aggregator tx fields
  const to = data?.tx?.to || data?.to;
  const dataHex = data?.tx?.data || data?.data;
  const value = data?.tx?.value || data?.value;

  if (!to || !dataHex) throw new Error('Invalid swap tx payload');

      return { to, data: dataHex, value };
    } catch (e) {
      // Surface a clear error; caller can decide on fallback UX
      const msg = e instanceof Error ? e.message : 'Failed to build swap tx';
      throw new Error(msg);
    }
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
