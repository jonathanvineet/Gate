import React, { useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { Wallet, ArrowLeftRight, Loader, Coins } from 'lucide-react';
import { OkxDexService } from '../services/okxDexService';
import { getEthersProvider } from '../wallet/okxWallet';
import { getQuickToken } from '../config/quickTokens';
import { EXPECTED_CHAIN_ID } from '../config/staking';

const BuyPanel: React.FC = () => {
  const [address, setAddress] = useState<string>('');
  const [chainId, setChainId] = useState<number>(EXPECTED_CHAIN_ID);
  const [balance, setBalance] = useState<string>('0'); // balance of the toToken
  const [fromToken, setFromToken] = useState<string>('');
  const [toToken, setToToken] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [slippageBps, setSlippageBps] = useState<number>(50);
  const [quoteOut, setQuoteOut] = useState<string>('');
  const [quoteIsMock, setQuoteIsMock] = useState<boolean>(false);
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [swapBusy, setSwapBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromSymbol, setFromSymbol] = useState<string>('');
  const [fromDecimals, setFromDecimals] = useState<number>(18);
  const [toSymbol, setToSymbol] = useState<string>('');
  const [toDecimals, setToDecimals] = useState<number>(18);
  const [lastAmountWei, setLastAmountWei] = useState<string>('');
  const dex = useMemo(() => new OkxDexService(), []);

  // Helper: validate and normalize an Ethereum address
  const normalizeAddress = async (addr: string): Promise<string> => {
    const { ethers } = await import('ethers');
    const s = String(addr || '').trim();
    if (!s) throw new Error('Invalid token address');
    // Allow native sentinel
    const sentinel = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    if (s.toLowerCase() === sentinel) return sentinel;
    try {
      return ethers.getAddress(s);
    } catch {
      // Retry after lowercasing to bypass mixed-case checksum issues
      const hex = s.toLowerCase();
      const re = /^0x[0-9a-f]{40}$/;
      if (!re.test(hex)) throw new Error('Invalid token address');
      return ethers.getAddress(hex);
    }
  };

  const networkName = (cid?: number) => {
    switch (Number(cid)) {
      case 1: return 'Ethereum Mainnet';
      case 137: return 'Polygon Mainnet';
      case 80002: return 'Polygon Amoy Testnet';
      default: return `Chain ${cid}`;
    }
  };

  // Detect wallet, chain, and set default tokens (USDC ↔ WMATIC). Also get balance of toToken.
  useEffect(() => {
    const run = async () => {
      try {
  const provider = await getEthersProvider();
        const signer = await provider.getSigner();
        const addr = await signer.getAddress();
        setAddress(addr);
        const net = await provider.getNetwork();
        const cid = Number(net.chainId?.toString?.() ?? net.chainId);
        setChainId(cid);
        // Only set defaults on mainnets supported by OKX (have chainIndex)
        const ci = dex.getChainIndex(cid);
        if (ci != null) {
          const usdc = getQuickToken(cid, 'usdc');
          const wnat = getQuickToken(cid, 'wnative');
          if (usdc) setFromToken(usdc);
          if (wnat && wnat.toLowerCase() !== usdc?.toLowerCase()) setToToken(wnat);
        } else {
          // Testnets: avoid placeholder tokens (like tPOL); require explicit selection
          setFromToken('');
          setToToken('');
        }
        // Preload toToken metadata and balance if available
        if (toToken) {
          const erc20Abi = ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)', 'function symbol() view returns (string)'];
          const token = new ethers.Contract(toToken, erc20Abi, provider);
          const [rawBal, dec, sym] = await Promise.all([
            token.balanceOf(addr).catch(() => 0n),
            token.decimals().catch(() => 18),
            token.symbol().catch(() => 'TOKEN'),
          ]);
          const bal = ethers.formatUnits(rawBal, Number(dec));
          setBalance(bal);
          setToDecimals(Number(dec));
          setToSymbol(String(sym));
        }
      } catch {
        // ignore
      }
    };
    run();
  }, []);

  // React to chain changes at runtime to enable/disable quick-selects and reset tokens
  useEffect(() => {
  const eth = (window as any).okxwallet?.ethereum || (window as any).ethereum;
  if (!eth || !eth.on) return;
    const handler = async (hexChainId: string) => {
      const newCid = parseInt(hexChainId, 16);
      setChainId(newCid);
      // Reset tokens based on support
      const ci = dex.getChainIndex(newCid);
      if (ci != null) {
        const usdc = getQuickToken(newCid, 'usdc');
        const wnat = getQuickToken(newCid, 'wnative');
        setFromToken(usdc || '');
        setToToken(wnat && wnat.toLowerCase() !== usdc?.toLowerCase() ? wnat : '');
      } else {
        setFromToken('');
        setToToken('');
      }
      // Clear quote state
      setQuoteOut('');
      setQuoteIsMock(false);
      setError(null);
    };
    eth.on('chainChanged', handler);
    return () => {
      try {
        if (eth && typeof eth.removeListener === 'function') {
          eth.removeListener('chainChanged', handler);
        }
      } catch {
        // ignore
      }
    };
  }, [dex]);

  // Load metadata for fromToken when it changes
  useEffect(() => {
    const run = async () => {
      try {
  if (!fromToken) return;
        const provider = await getEthersProvider();
        const erc20Abi = ['function decimals() view returns (uint8)', 'function symbol() view returns (string)'];
  const nAddr = await normalizeAddress(fromToken);
  const token = new ethers.Contract(nAddr, erc20Abi, provider);
        const [dec, sym] = await Promise.all([
          token.decimals().catch(() => 18),
          token.symbol().catch(() => 'TOKEN'),
        ]);
        setFromDecimals(Number(dec));
        setFromSymbol(String(sym));
      } catch {
        setFromDecimals(18);
        setFromSymbol('TOKEN');
      }
    };
    run();
  }, [fromToken]);

  // Load metadata and balance for toToken when it changes
  useEffect(() => {
    const run = async () => {
      try {
  if (!toToken || !address) return;
        const provider = await getEthersProvider();
        const erc20Abi = ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)', 'function symbol() view returns (string)'];
  const nAddr = await normalizeAddress(toToken);
  const token = new ethers.Contract(nAddr, erc20Abi, provider);
        const [rawBal, dec, sym] = await Promise.all([
          token.balanceOf(address).catch(() => 0n),
          token.decimals().catch(() => 18),
          token.symbol().catch(() => 'TOKEN'),
        ]);
        setBalance(ethers.formatUnits(rawBal, Number(dec)));
        setToDecimals(Number(dec));
        setToSymbol(String(sym));
      } catch {
        setToDecimals(18);
        setToSymbol('TOKEN');
      }
    };
    run();
  }, [toToken, address]);

  const getQuote = async () => {
    try {
      setError(null);
      setQuoteBusy(true);
      if (!fromToken) throw new Error('Select a token to swap from');
      if (!amount || Number(amount) <= 0) throw new Error('Enter a valid amount');
      const { ethers } = await import('ethers');
      // Assume fromToken has 6 decimals if USDC, default 18 otherwise; this is just for quoting UX
  const decimals = fromToken.toLowerCase() === (getQuickToken(chainId, 'usdc') || '').toLowerCase() ? 6 : fromDecimals;
  const amountWei = ethers.parseUnits(amount, decimals);
  setLastAmountWei(amountWei.toString());
  const ci = dex.getChainIndex(chainId);
  if (!toToken) throw new Error('Select a token to receive');
  const q = await dex.getQuote({ chainId, chainIndex: ci, inTokenAddress: fromToken, outTokenAddress: toToken, amount: amountWei.toString(), slippageBps });
  const outDec = toDecimals || 18;
      setQuoteOut(ethers.formatUnits(q.amountOut, outDec));
  setQuoteIsMock(q.raw == null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || 'Failed to get quote');
      setQuoteOut('');
  setQuoteIsMock(true);
    } finally {
      setQuoteBusy(false);
    }
  };

  const doSwap = async () => {
    try {
      setError(null);
      setSwapBusy(true);
  const provider = await getEthersProvider();
  if (!fromToken) throw new Error('Select a token to swap from');
  if (!toToken) throw new Error('Select a token to receive');
      if (!amount || Number(amount) <= 0) throw new Error('Enter a valid amount');
      const signer = await provider.getSigner();
      const user = await signer.getAddress();
  const decimals = fromToken.toLowerCase() === (getQuickToken(chainId, 'usdc') || '').toLowerCase() ? 6 : fromDecimals || 18;
      const amountWei = ethers.parseUnits(amount, decimals);
      const ci = dex.getChainIndex(chainId);
      // Build swap tx first to know the router/spender address
  let inAddr: string, outAddr: string;
  try { inAddr = await normalizeAddress(fromToken); } catch { throw new Error('From token address is invalid'); }
  try { outAddr = await normalizeAddress(toToken); } catch { throw new Error('To token address is invalid'); }
  const txReq = await dex.buildSwapTx({ chainId, chainIndex: ci, inTokenAddress: inAddr, outTokenAddress: outAddr, amount: amountWei.toString(), fromAddress: user, slippageBps });

      // If paying with an ERC20 (USDC), ensure allowance for the router (spender)
      const isNative = inAddr.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
      if (!isNative) {
        const erc20Abi = [
          'function allowance(address owner, address spender) view returns (uint256)',
          'function approve(address spender, uint256 value) returns (bool)'
        ];
        const token = new ethers.Contract(inAddr, erc20Abi, signer);
        const current = await token.allowance(user, txReq.to).catch(() => 0n);
        if (current < BigInt(amountWei.toString())) {
          // Approve at least the needed amount (use exact amount to avoid USDT-style issues)
          console.log('[buyPanel] approving spender', { spender: txReq.to, amountWei: amountWei.toString() });
          const approveTx = await token.approve(txReq.to, amountWei);
          await approveTx.wait();
        }
      }

      // Now execute the swap
      const tx = await signer.sendTransaction({ to: txReq.to, data: txReq.data, value: txReq.value ? BigInt(txReq.value) : undefined });
      await tx.wait();
  // refresh toToken balance
  const erc20Abi = ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'];
  const token = new ethers.Contract(toToken, erc20Abi, provider);
  const [rawBal, dec] = await Promise.all([token.balanceOf(user), token.decimals()]);
  setBalance(ethers.formatUnits(rawBal, Number(dec)));
    } catch (e: unknown) {
  const maybe = (typeof e === 'object' && e !== null) ? (e as Record<string, unknown>) : undefined;
  const msg = (maybe && typeof maybe.reason === 'string') ? maybe.reason : (e instanceof Error ? e.message : String(e));
  setError(msg || 'Swap failed');
    } finally {
      setSwapBusy(false);
    }
  };

  return (
    <div className="w-full floating-card bg-black/80 rounded-xl p-6 border border-gray-800 accent-hover mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wallet className="text-white" size={18} />
          <h3 className="text-white font-semibold">Welcome{address ? `, ${address.slice(0,6)}...${address.slice(-4)}` : ''}</h3>
        </div>
        <div className="text-sm text-gray-300 flex items-center gap-3">
          <span className="px-2 py-1 rounded-full bg-black text-white" title={`chainId ${chainId}`}>{networkName(chainId)}</span>
          <Coins size={14} className="text-white" />
          <span>Balance: <span className="text-white font-mono">{Number(balance).toFixed(4)} {toSymbol || 'TOKEN'}</span></span>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_auto_1fr_auto] grid-cols-1 gap-4 items-end">
        <div>
          <label className="block text-xs text-gray-400 mb-1">From Token</label>
          <input
            className="w-full px-3 py-2 rounded bg-black border border-white/10 text-white"
            placeholder="0x... (USDC recommended)"
            value={fromToken}
            onChange={e => setFromToken(e.target.value)}
          />
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              className="text-xs px-2 py-1 border border-white/10 rounded text-white/80 hover:text-white bg-black"
                disabled={dex.getChainIndex(chainId) == null}
                onClick={() => {
                  const a = getQuickToken(chainId, 'usdc');
                  const b = getQuickToken(chainId, 'wnative');
                  if (a) setFromToken(a);
                  if (b && (!toToken || b.toLowerCase() === fromToken.toLowerCase())) setToToken('');
                  if (b && b.toLowerCase() !== a?.toLowerCase()) setToToken(b);
                }}
            >USDC</button>
            <button
              type="button"
              className="text-xs px-2 py-1 border border-white/10 rounded text-white/80 hover:text-white bg-black"
                disabled={dex.getChainIndex(chainId) == null}
                onClick={() => {
                  const a = getQuickToken(chainId, 'wnative');
                  const b = getQuickToken(chainId, 'usdc');
                  if (a) setFromToken(a);
                  if (b && (!toToken || b.toLowerCase() === fromToken.toLowerCase())) setToToken('');
                  if (b && b.toLowerCase() !== a?.toLowerCase()) setToToken(b);
                }}
            >{chainId === 1 ? 'WETH' : chainId === 137 ? 'WMATIC' : 'WNATIVE'}</button>
          </div>
        </div>

        <div className="hidden md:flex items-center justify-center pb-2">
          <button
            type="button"
            className="p-2 rounded border border-white/10 hover:bg-white/10"
            title="Flip"
            onClick={() => { const f = fromToken; const t = toToken; setFromToken(t); setToToken(f); }}
          >
            <ArrowLeftRight className="text-white/80" size={18} />
          </button>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Amount</label>
          <input
            type="number"
            min="0"
            step="0.0001"
            className="w-full px-3 py-2 rounded bg-black border border-white/10 text-white"
            placeholder="Enter amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
          <div className="text-[11px] text-gray-400 mt-1">Slippage (bps)
            <input
              type="number"
              min={1}
              className="ml-2 w-20 px-2 py-1 rounded bg-black border border-white/10 text-white"
              value={slippageBps}
              onChange={e => setSlippageBps(Math.max(1, Number(e.target.value) || 50))}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-2 md:mt-0">
          <button
            className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded border border-white/10 flex items-center gap-2 accent-hover"
            disabled={quoteBusy}
            onClick={getQuote}
          >{quoteBusy ? (<><Loader className="animate-spin" size={14} /> Quote</>) : 'Get Quote'}</button>
          <button
            className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded border border-white/10 flex items-center gap-2 disabled:opacity-50 accent-hover"
            disabled={swapBusy || !quoteOut || quoteIsMock}
            onClick={doSwap}
          >{swapBusy ? (<><Loader className="animate-spin" size={14} /> Swap</>) : 'Swap'}</button>
        </div>
      </div>

      {quoteOut && (
        <div className="text-sm text-gray-300 mt-3">Est. receive: <span className="text-white font-mono">{Number(quoteOut).toFixed(6)} {toSymbol || 'TOKEN'}</span></div>
      )}
      {quoteIsMock && (
        <div className="text-[11px] text-orange-500 mt-1">Estimate only: OKX swaps run on supported mainnets. Switch your wallet to Polygon mainnet for USDC ↔ WMATIC.</div>
      )}
      {dex.getChainIndex(chainId) == null && (
        <div className="text-[11px] text-yellow-400 mt-1">Network {chainId}: quick-selects disabled. Switch to Polygon mainnet to enable USDC/WMATIC and OKX execution.</div>
      )}
      {/* Debug panel */}
      <div className="mt-3 text-[11px] text-gray-400 border-t border-white/10 pt-2">
        <div>Network: {networkName(chainId)} | chainId {chainId} | chainIndex {dex.getChainIndex(chainId) ?? 'n/a'}</div>
        <div>From: {fromToken} {fromSymbol ? `(${fromSymbol}, ${fromDecimals}d)` : ''}</div>
        <div>To: {toToken} {toSymbol ? `(${toSymbol}, ${toDecimals}d)` : ''}</div>
        {lastAmountWei && <div>Amount(wei): {lastAmountWei}</div>}
      </div>
      {error && (
        <div className="text-xs text-red-400 mt-2">{error}</div>
      )}
    </div>
  );
};

export default BuyPanel;
