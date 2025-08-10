import React, { useMemo, useState } from 'react';
import { Loader } from 'lucide-react';
import { OkxDexService } from '../services/okxDexService';

export default function DexApiPlayground({ onBack }: { onBack: () => void }) {
  const dex = useMemo(() => new OkxDexService(), []);
  const [chainId, setChainId] = useState<number>(137);
  const [from, setFrom] = useState<string>('0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'); // WMATIC
  const [to, setTo] = useState<string>('0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'); // USDC
  const [amount, setAmount] = useState<string>('100000000000000000'); // 0.1
  const [slippageBps, setSlippageBps] = useState<number>(50);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    try {
      setBusy(true);
      setError(null);
      setOut(null);
      const q = await dex.getQuote({ chainId, inTokenAddress: from, outTokenAddress: to, amount, slippageBps });
      setOut({ step: 'quote', data: q });
    } catch (e: any) {
      setError(e?.message || 'Quote failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">OKX DEX API Playground</h1>
          <button onClick={onBack} className="px-3 py-1 border rounded">Back</button>
        </div>
        <div className="bg-white rounded-lg shadow p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">Chain ID
              <input type="number" className="w-full border rounded px-2 py-1" value={chainId} onChange={e => setChainId(Number(e.target.value)||137)} />
            </label>
            <label className="text-sm">Slippage (bps)
              <input type="number" className="w-full border rounded px-2 py-1" value={slippageBps} onChange={e => setSlippageBps(Math.max(1, Number(e.target.value)||50))} />
            </label>
          </div>
          <label className="text-sm">From token
            <input className="w-full border rounded px-2 py-1" value={from} onChange={e => setFrom(e.target.value)} />
          </label>
          <label className="text-sm">To token
            <input className="w-full border rounded px-2 py-1" value={to} onChange={e => setTo(e.target.value)} />
          </label>
          <label className="text-sm">Amount (wei)
            <input className="w-full border rounded px-2 py-1" value={amount} onChange={e => setAmount(e.target.value)} />
          </label>
          <div className="flex items-center gap-3">
            <button onClick={run} disabled={busy} className="px-4 py-2 bg-black text-white rounded disabled:opacity-50">
              {busy ? (<span className="flex items-center gap-2"><Loader className="animate-spin" size={16}/> Requesting…</span>): 'Get Quote'}
            </button>
            <div className="text-xs text-gray-500">Proxy will sign GET /swap when you proceed to build a tx in app flows.</div>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          {out && (
            <pre className="bg-gray-100 rounded p-3 text-xs overflow-auto">{JSON.stringify(out, null, 2)}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
