/* eslint-disable @typescript-eslint/no-explicit-any, no-empty, react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from 'react';
import { X, Coins, AlertTriangle, CheckCircle, ExternalLink, Loader, Shield } from 'lucide-react';
import { useStakingContract } from '../hooks/useStakingContract';
import { csvLogger } from '../utils/csvLogger';
import { stakingRecords } from '../utils/stakingRecords';
import { OkxDexService } from '../services/okxDexService';
import { EXPECTED_CHAIN_ID as CFG_CHAIN } from '../config/staking';
import { getQuickToken } from '../config/quickTokens';

interface StakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (info: { txHash?: string; amount?: string; tokenSymbol?: string }) => void;
  poolName: string;
  poolId: string;
  minStake: string;
  apy: string;
  requiredToken?: { symbol: string; address: string; decimals?: number };
  requiredChainId?: number;
  stakingContractAddress?: string;
  hackathonMode?: boolean; // when true, adjust UI copy and CSV category
}

const StakeModal: React.FC<StakeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  poolName,
  poolId,
  minStake,
  apy,
  requiredToken,
  requiredChainId,
  stakingContractAddress,
  hackathonMode
}) => {
  const [stakeAmount, setStakeAmount] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [tokenLoadError, setTokenLoadError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isNetworkIssue, setIsNetworkIssue] = useState(false);
  const [isInvalidContract, setIsInvalidContract] = useState(false);
  const { stake, approveToken, loadTokenInfo, stakingState, clearState } = useStakingContract({
    contractAddress: stakingContractAddress,
    tokenAddress: requiredToken?.address,
    expectedChainId: typeof requiredChainId === 'number' ? requiredChainId : undefined,
  } as any);

  // Optional OKX DEX swap state
  const [swapOpen, setSwapOpen] = useState(false);
  const [walletChainId, setWalletChainId] = useState<number | null>(requiredChainId ?? CFG_CHAIN ?? 137);
  const [dexChainId, setDexChainId] = useState<number>(requiredChainId === 80002 ? 137 : (requiredChainId ?? CFG_CHAIN ?? 137));
  const [fromTokenAddress, setFromTokenAddress] = useState<string>('');
  const [fromTokenSymbol, setFromTokenSymbol] = useState<string>('');
  const [fromTokenDecimals, setFromTokenDecimals] = useState<number | null>(null);
  const [fromAmount, setFromAmount] = useState<string>('');
  const [quoteOut, setQuoteOut] = useState<string | null>(null);
  const [quoteIsMock, setQuoteIsMock] = useState<boolean>(false);
  const [slippageBps, setSlippageBps] = useState<number>(50);
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [swapBusy, setSwapBusy] = useState(false);
  const [swapError, setSwapError] = useState<string | null>(null);
  const dex = new OkxDexService();

  // Auto-stake state
  type StepStatus = 'pending' | 'running' | 'done' | 'error' | 'skipped';
  const [autoBusy, setAutoBusy] = useState(false);
  const [autoError, setAutoError] = useState<string | null>(null);
  const [steps, setSteps] = useState<Array<{ key: string; label: string; status: StepStatus; detail?: string }>>([
    { key: 'switch', label: 'Switch network', status: 'pending' },
    { key: 'swap', label: 'Swap into staking token (if needed)', status: 'pending' },
    { key: 'approve', label: 'Approve tokens', status: 'pending' },
    { key: 'stake', label: 'Stake tokens', status: 'pending' },
  ]);
  const initializedThisOpen = useRef(false);

  useEffect(() => {
    if (isOpen) {
      if (initializedThisOpen.current) return; // prevent double init in StrictMode
      initializedThisOpen.current = true;
      console.log('[StakeModal] open for pool:', poolName, 'poolId:', poolId);
      clearState();
      setStakeAmount('');
      setShowSuccess(false);
      setNeedsApproval(false);
      setTokenLoadError(null);
      setIsNetworkIssue(false);
      setIsInvalidContract(false);
      // reset swap state
      setSwapOpen(false);
      setFromTokenAddress('');
      setFromTokenSymbol('');
      setFromTokenDecimals(null);
      setFromAmount('');
      setQuoteOut(null);
      setSwapError(null);

      // Switch to required network first, then load token info
    (async () => {
        try {
          await switchToRequiredChain();
        } catch (e) {
          console.warn('Network switch skipped/failed:', (e as any)?.message || e);
        }
        try {
      // Prefer cached metadata; refresh balances only if available
      await loadTokenInfo({ refreshBalancesOnly: true });
        } catch (error: any) {
          console.error('Failed to load token info:', error);
          const errorMsg = error.message || 'Failed to load token information';
          setTokenLoadError(errorMsg);
          if (errorMsg.includes('Network') || errorMsg.includes('node synchronization') || errorMsg.includes('RPC endpoint')) {
            setIsNetworkIssue(true);
          } else if (errorMsg.includes('not implement') || errorMsg.includes('invalid') || errorMsg.includes('does not appear to be')) {
            setIsInvalidContract(true);
          }
        }
    })();
  return () => {};
    }
    return () => { initializedThisOpen.current = false; };
  }, [isOpen, clearState, loadTokenInfo, poolId]);

  useEffect(() => {
    if (showSuccess) {
      console.log('[StakeModal] success state entered; txHash=', stakingState.txHash);
      try {
        const txh2: string | undefined = stakingState.txHash ? String(stakingState.txHash) : undefined;
        onSuccess?.({ txHash: txh2, amount: stakeAmount, tokenSymbol: stakingState.tokenInfo?.symbol || 'TT' });
      } catch (e) { void e; }
    }
  }, [showSuccess, stakingState.txHash, stakeAmount, onSuccess, stakingState.tokenInfo?.symbol]);

  // Detect network chainId for DEX
  useEffect(() => {
    const detectChain = async () => {
      try {
        if ((window as any).ethereum) {
          const provider = await (await import('../wallet/okxWallet')).getEthersProvider();
          const net = await provider.getNetwork();
          const cid = Number(net.chainId?.toString() ?? net.chainId);
          if (!Number.isNaN(cid)) {
            setWalletChainId(cid);
          }
        }
      } catch (e) { void e; }
    };
    if (isOpen) detectChain();
  }, [isOpen]);

  // Check if approval is needed when amount changes
  useEffect(() => {
    if (stakeAmount && stakingState.tokenInfo) {
      const needsApproval = parseFloat(stakeAmount) > parseFloat(stakingState.tokenInfo.allowance);
      setNeedsApproval(needsApproval);
    }
  }, [stakeAmount, stakingState.tokenInfo]);

  const setStep = (key: string, patch: Partial<{ status: StepStatus; detail?: string }>) => {
    setSteps((prev) => prev.map(s => s.key === key ? { ...s, ...patch } : s));
  };

  const resetSteps = () => {
    setSteps([
      { key: 'switch', label: 'Switch network', status: 'pending' },
      { key: 'swap', label: 'Swap into staking token (if needed)', status: 'pending' },
      { key: 'approve', label: 'Approve tokens', status: 'pending' },
      { key: 'stake', label: 'Stake tokens', status: 'pending' },
    ]);
  };

  const switchToRequiredChain = async (): Promise<void> => {
    const target = requiredChainId ?? walletChainId;
    if (!target) return; // nothing to do
    try {
        const { switchChain } = await import('../wallet/okxWallet');
        await switchChain(target).catch((e: any) => {
          console.error('Failed to switch chain:', e);
        });
    } catch (e: any) {
      if (e?.code === 4902 && requiredChainId) {
        const addParams: any = (() => {
          switch (requiredChainId) {
            case 80002:
              return {
                chainId: '0x13882',
                chainName: 'Polygon Amoy',
                nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
                rpcUrls: ['https://rpc-amoy.polygon.technology'],
                blockExplorerUrls: ['https://amoy.polygonscan.com']
              };
            case 137:
              return {
                chainId: '0x89',
                chainName: 'Polygon',
                nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
                rpcUrls: ['https://polygon-rpc.com'],
                blockExplorerUrls: ['https://polygonscan.com']
              };
            default:
              return null;
          }
        })();
        if (addParams) {
          const { addChain } = await import('../wallet/okxWallet');
          await addChain(addParams);
        } else {
          throw new Error('Unsupported network for auto add');
        }
      } else {
        throw e;
      }
    }
  };

  const ensureAllowanceIfNeeded = async (amount: string): Promise<boolean> => {
    if (!stakingState.tokenInfo) return false;
    try {
      const needs = parseFloat(amount) > parseFloat(stakingState.tokenInfo.allowance || '0');
      if (needs) {
        setStep('approve', { status: 'running' });
        const res = await approveToken(amount);
        if (!res.success) throw new Error(res.error || 'Approve failed');
        setStep('approve', { status: 'done' });
      } else {
        setStep('approve', { status: 'skipped', detail: 'Sufficient allowance' });
      }
      return true;
    } catch (e: any) {
      setStep('approve', { status: 'error', detail: e?.message || 'Approve failed' });
      throw e;
    }
  };

  const maybeSwapToCoverShortfall = async (needed: number): Promise<void> => {
    if (!fromTokenAddress || needed <= 0) {
      setStep('swap', { status: 'skipped', detail: needed <= 0 ? 'Already have enough tokens' : 'No from-token set' });
      return;
    }
    try {
      setStep('swap', { status: 'running', detail: 'Requesting quote' });
      await ensureFromTokenMeta();
      const outAddr = stakingState.tokenInfo?.address;
      if (!outAddr) throw new Error('Staking token missing');
      const { ethers } = await import('ethers');
      const amountWei = ethers.parseUnits(String(needed), stakingState.tokenInfo?.decimals || 18);
      const q = await dex.getQuote({
        chainId: requiredChainId ?? walletChainId!,
        inTokenAddress: fromTokenAddress,
        outTokenAddress: outAddr,
        amount: amountWei.toString(),
        slippageBps,
      });
      setStep('swap', { detail: 'Building swap transaction' });
  const provider = await (await import('../wallet/okxWallet')).getEthersProvider().catch(() => null as any);
      if (!provider) throw new Error('Wallet not connected');
      const signer = await provider.getSigner();
      const user = await signer.getAddress();
      const txReq = await dex.buildSwapTx({
        chainId: requiredChainId ?? walletChainId!,
        inTokenAddress: fromTokenAddress,
        outTokenAddress: outAddr,
        amount: q.amountIn || amountWei.toString(),
        fromAddress: user,
        slippageBps,
      });
      const tx = await signer.sendTransaction({ to: txReq.to, data: txReq.data, value: txReq.value ? BigInt(txReq.value) : undefined });
      await tx.wait();
      await loadTokenInfo();
      setStep('swap', { status: 'done', detail: 'Swap confirmed' });
    } catch (e: any) {
      setStep('swap', { status: 'error', detail: e?.message || 'Swap failed' });
      throw e;
    }
  };

  const autoStake = async () => {
    try {
      setAutoBusy(true);
      setAutoError(null);
      resetSteps();

      setStep('switch', { status: 'running' });
      await switchToRequiredChain();
      setStep('switch', { status: 'done' });

      await loadTokenInfo();
      if (!stakeAmount || parseFloat(stakeAmount) <= 0) throw new Error('Enter a valid stake amount');
      if (!stakingState.tokenInfo) throw new Error('Token info unavailable');

      const balance = parseFloat(stakingState.tokenInfo.balance || '0');
      const desired = parseFloat(stakeAmount);
      const shortfall = Math.max(0, desired - balance);
      if (shortfall > 0) {
        await maybeSwapToCoverShortfall(shortfall);
        await loadTokenInfo();
        const newBal = parseFloat(stakingState.tokenInfo.balance || '0');
        if (newBal < desired) throw new Error('Insufficient token balance after swap');
      } else {
        setStep('swap', { status: 'skipped', detail: 'Already have enough tokens' });
      }

      await ensureAllowanceIfNeeded(stakeAmount);

      setStep('stake', { status: 'running' });
      const res = await stake(stakeAmount);
      if (!res.success) throw new Error(res.error || 'Stake failed');
      setStep('stake', { status: 'done' });

      // Record activity for Auto Stake (was missing compared to manual Stake)
      try {
        // Get user address for the record
        let userAddress = 'Unknown';
        try {
          const { getEthersProvider } = await import('../wallet/okxWallet');
          const provider = await getEthersProvider().catch(() => null as any);
          if (provider) {
            const signer = await provider.getSigner();
            userAddress = await signer.getAddress();
          }
        } catch {}

        // CSV record
        csvLogger.addStakeRecord({
          companyName: poolName.split(' ')[0] || 'Unknown',
          poolName,
          amount: parseFloat(stakeAmount),
          tokenSymbol: stakingState.tokenInfo?.symbol || 'TT',
          apy,
          userAddress,
          transactionHash: (res as any).txHash || stakingState.txHash || '',
          category: hackathonMode ? 'hackathon' : 'stake'
        });

        // Local aggregate balances
        stakingRecords.recordStake(
          poolName.split(' ')[0] || 'Unknown',
          parseFloat(stakeAmount),
          stakingState.tokenInfo?.symbol || 'TT'
        );
      } catch (logErr) {
        console.warn('Auto-stake activity logging failed:', logErr);
      }

      setShowSuccess(true);
      try {
        // prefer tx from local result when available
        const txh = (res as { txHash?: string } | null)?.txHash || stakingState.txHash || undefined;
        onSuccess?.({ txHash: txh, amount: stakeAmount, tokenSymbol: stakingState.tokenInfo?.symbol || 'TT' });
      } catch (e) { void e; }
      setShowSuccess(true);
    } catch (e: any) {
      setAutoError(e?.message || 'Auto stake failed');
    } finally {
      setAutoBusy(false);
    }
  };

  const handleApprove = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      alert('Please enter a valid stake amount greater than 0');
      return;
    }

    const result = await approveToken(stakeAmount);

    if (result.success) {
      setNeedsApproval(false);
    }
  };

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      alert('Please enter a valid stake amount greater than 0');
      return;
    }

    if (needsApproval) {
      alert('Please approve tokens first');
      return;
    }

    const isTokenConfigured = stakingState.tokenInfo?.address && stakingState.tokenInfo.address !== '0x0000000000000000000000000000000000000000';
    if (!isTokenConfigured || isNetworkIssue || isInvalidContract) {
      alert('Staking contract not ready on this network. Please fix network/contract configuration before staking.');
      return;
    }

    let userAddress = 'Unknown';
    try {
      const { getEthersProvider } = await import('../wallet/okxWallet');
      const provider = await getEthersProvider().catch(() => null as any);
      if (provider) {
        const signer = await provider.getSigner();
        userAddress = await signer.getAddress();
      }
    } catch (error) {
      console.error('Error getting user address:', error);
    }

    const result = await stake(stakeAmount);

    if (result.success) {
      csvLogger.addStakeRecord({
        companyName: poolName.split(' ')[0] || 'Unknown',
        poolName: poolName,
        amount: parseFloat(stakeAmount),
        tokenSymbol: stakingState.tokenInfo?.symbol || 'TT',
        apy: apy,
        userAddress: userAddress,
        transactionHash: result.txHash || '',
        category: hackathonMode ? 'hackathon' : 'stake'
      });

      stakingRecords.recordStake(
        poolName.split(' ')[0] || 'Unknown',
        parseFloat(stakeAmount),
        stakingState.tokenInfo?.symbol || 'TT'
      );

      setShowSuccess(true);
      setTimeout(() => {
        onClose();
      }, 3000);
    } else {
      if (result.error?.includes('Network') || result.error?.includes('RPC')) {
        setIsRetrying(true);
        setRetryCount(prev => prev + 1);

        setTimeout(() => {
          setIsRetrying(false);
          if (retryCount < 2) {
            handleStake();
          }
        }, 3000);
      }
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    handleStake();
  };

  // --- OKX DEX helpers ---
  const ensureFromTokenMeta = async (): Promise<{ symbol: string; decimals: number } | null> => {
    try {
      if (!fromTokenAddress) return null;
      // Short-circuit metadata if swapping the staking token itself
      const stakeAddr = stakingState.tokenInfo?.address;
      if (stakeAddr && stakeAddr.toLowerCase() === fromTokenAddress.toLowerCase()) {
        const sym = stakingState.tokenInfo?.symbol || '';
        const dec = stakingState.tokenInfo?.decimals ?? 18;
        setFromTokenSymbol(sym);
        setFromTokenDecimals(dec);
        return { symbol: sym, decimals: dec };
      }
      const { ethers } = await import('ethers');
  const provider = await (await import('../wallet/okxWallet')).getEthersProvider().catch(() => null as any);
      if (!provider) return null;
      // Best-effort precheck; don't surface RPC errors to the user on testnets
      try {
        const code = await provider.getCode(fromTokenAddress);
        if (!code || code === '0x') {
      console.warn('[Swap] No contract code found for token on current network; using defaults');
      setFromTokenSymbol('');
      setFromTokenDecimals(18);
      return { symbol: '', decimals: 18 };
        }
      } catch (e) {
        console.warn('[Swap] getCode check skipped due to RPC error:', e);
      }
      const erc20Abi = [
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)'
      ];
    // Use read-only provider to avoid requiring wallet permissions for metadata
    const c = new ethers.Contract(fromTokenAddress, erc20Abi, provider as any);
      const [sym, dec] = await Promise.allSettled([c.symbol(), c.decimals()]);
      const symbol = sym.status === 'fulfilled' ? sym.value : '';
      const decimals = dec.status === 'fulfilled' ? Number(dec.value) : 18;
      setFromTokenSymbol(symbol);
      setFromTokenDecimals(decimals);
      return { symbol, decimals };
    } catch {
      setFromTokenDecimals(18);
      return { symbol: '', decimals: 18 };
    }
  };

  const handleGetQuote = async () => {
    try {
      setSwapError(null);
      setQuoteBusy(true);
  if (!dexChainId) throw new Error('Unknown DEX chain');
      if (!fromTokenAddress) throw new Error('Enter from-token address');
      const meta = await ensureFromTokenMeta();
      const decimals = meta?.decimals ?? 18;
      if (!fromAmount || Number(fromAmount) <= 0) throw new Error('Enter a valid from amount');
      // Need staking token address to quote into
      const outAddr = stakingState.tokenInfo?.address;
      if (!outAddr || outAddr === '0x0000000000000000000000000000000000000000') {
        throw new Error('Staking token not configured');
      }
      const { ethers } = await import('ethers');
      const amountWei = ethers.parseUnits(fromAmount, decimals);
      const q = await dex.getQuote({
  chainId: dexChainId,
        inTokenAddress: fromTokenAddress,
        outTokenAddress: outAddr,
        amount: amountWei.toString(),
        slippageBps,
      });
      setQuoteIsMock(!q.raw);
      // format out using staking token decimals
      const outDecimals = stakingState.tokenInfo?.decimals || 18;
      const formatted = ethers.formatUnits(q.amountOut, outDecimals);
      setQuoteOut(formatted);
    } catch (e: any) {
      setSwapError(e?.message || 'Failed to get quote');
      setQuoteOut(null);
    } finally {
      setQuoteBusy(false);
    }
  };

  const handleExecuteSwap = async () => {
    try {
      setSwapError(null);
      setSwapBusy(true);
  if (!dexChainId) throw new Error('Unknown DEX chain');
      const outAddr = stakingState.tokenInfo?.address;
      if (!outAddr || outAddr === '0x0000000000000000000000000000000000000000') {
        throw new Error('Staking token not configured');
      }
      if (!fromTokenAddress) throw new Error('Enter from-token address');
      const meta2 = await ensureFromTokenMeta();
      const decimals = meta2?.decimals ?? 18;
      if (!fromAmount || Number(fromAmount) <= 0) throw new Error('Enter a valid from amount');
      const { ethers } = await import('ethers');
  const provider = await (await import('../wallet/okxWallet')).getEthersProvider().catch(() => null as any);
      if (!provider) throw new Error('Wallet not connected');
      const signer = await provider.getSigner();
      const user = await signer.getAddress();
      const amountWei = ethers.parseUnits(fromAmount, decimals);

      // Optional: ensure approval for router if needed would go here if OKX provides router address
      // For now, rely on tx building to generate calldata to a router that handles transfers via permit/allowance flows.

      const txReq = await dex.buildSwapTx({
  chainId: dexChainId,
        inTokenAddress: fromTokenAddress,
        outTokenAddress: outAddr,
        amount: amountWei.toString(),
        fromAddress: user,
        slippageBps,
      });

      const tx = await signer.sendTransaction({
        to: txReq.to,
        data: txReq.data,
        value: txReq.value ? BigInt(txReq.value) : undefined,
      });
      // Optimistically show hash in stakingState area by reusing existing txHash holder
      console.log('OKX swap tx sent:', tx.hash);
      await tx.wait();
      // Refresh token info (balance/allowance of staking token)
      await loadTokenInfo();
    } catch (e: any) {
      setSwapError(e?.message || 'Swap failed');
    } finally {
      setSwapBusy(false);
    }
  };

  const getExplorerUrl = (txHash: string) => {
    const cid = walletChainId ?? 1;
    const base = (() => {
      switch (cid) {
        case 1:
          return 'https://etherscan.io';
        case 11155111:
          return 'https://sepolia.etherscan.io';
        case 137:
          return 'https://polygonscan.com';
        case 80002: // Polygon Amoy
          return 'https://amoy.polygonscan.com';
        case 8453: // Base mainnet
          return 'https://basescan.org';
        case 84532: // Base Sepolia
          return 'https://sepolia.basescan.org';
        default:
          return 'https://etherscan.io';
      }
    })();
    return `${base}/tx/${txHash}`;
  };

  if (!isOpen) return null;

  const tokenSymbol = stakingState.tokenInfo?.symbol || 'TT';
  const tokenName = stakingState.tokenInfo?.name || 'Test Token';
  const userBalance = stakingState.tokenInfo?.balance || '0';
  const allowance = stakingState.tokenInfo?.allowance || '0';
  const totalStaked = stakingState.totalStaked || '0';
  const isTokenConfigured = stakingState.tokenInfo?.address && stakingState.tokenInfo.address !== '0x0000000000000000000000000000000000000000';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="bg-black rounded-2xl w-full max-w-md mx-auto relative shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
  <div className="sticky top-0 bg-black/90 border-b border-white/10 p-6 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
            disabled={stakingState.isLoading}
          >
            <X size={24} />
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Coins className="text-purple-400" size={28} />
              <h2 className="text-2xl font-bold text-white">{hackathonMode ? 'Confirm Registration' : 'Stake Tokens'}</h2>
            </div>
            <p className="text-gray-400 text-sm">{hackathonMode ? `Stake ${tokenSymbol} to register for ${poolName}` : `Stake ${tokenSymbol} in ${poolName}`}</p>
          </div>
        </div>

        {/* Content */}
  <div className="p-6">
          {showSuccess && !!stakingState.txHash ? (
            <div className="space-y-4 text-center">
              <CheckCircle className="text-green-400 mx-auto" size={64} />
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-2">{hackathonMode ? 'Registration Confirmed!' : 'Staking Successful!'}</h3>
                <p className="text-gray-300 text-sm mb-4">
                  {hackathonMode ? (
                    <>You have successfully staked {stakeAmount} {tokenSymbol} for {poolName}</>
                  ) : (
                    <>You have successfully staked {stakeAmount} {tokenSymbol} in {poolName}</>
                  )}
                </p>
                {stakingState.txHash && (
                  <a
                    href={getExplorerUrl(stakingState.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm"
                  >
                    View Transaction <ExternalLink size={14} />
                  </a>
                )}
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        document.getElementById('activity-dashboard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      } catch {}
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                  >
                    View Activity
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Optional: Swap with OKX DEX */}
              {(stakingState.tokenInfo?.address && stakingState.tokenInfo.address !== '0x0000000000000000000000000000000000000000') && (
                <div className="bg-purple-900/10 border border-purple-500/20 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-purple-300 mb-1">Swap with OKX DEX (optional)</h4>
                      <p className="text-xs text-purple-200/80">Convert another token into {stakingState.tokenInfo?.symbol} before staking. If this pool requires a different token, swap accordingly.</p>
                    </div>
                    <button
                      onClick={() => setSwapOpen(v => !v)}
                      className="text-purple-300 text-sm underline"
                    >{swapOpen ? 'Hide' : 'Show'}</button>
                  </div>
                  {swapOpen && (
                    <div className="mt-3 space-y-3 relative">
                      {(quoteBusy || swapBusy) && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] rounded-lg flex flex-col items-center justify-center z-10 border border-purple-700/30">
                          <Loader className="animate-spin text-purple-300 mb-2" size={20} />
                          <div className="text-sm text-purple-200 font-medium">
                            {swapBusy ? 'Waiting for wallet confirmation…' : 'Fetching best route…'}
                          </div>
                          {swapBusy && (
                            <div className="text-[11px] text-purple-300 mt-1">Check your wallet popup and confirm the swap</div>
                          )}
                        </div>
                      )}
                      <div className="space-y-1">
                        <label className="text-sm text-purple-200">DEX network</label>
                        <select
                          value={dexChainId}
                          onChange={e => setDexChainId(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-purple-700/40 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-700/60 bg-black text-white mb-2"
                        >
                          <option value={137}>Polygon</option>
                          <option value={1}>Ethereum</option>
                          <option value={8453}>Base</option>
                        </select>
                        <label className="text-sm text-purple-200">From token address (ERC20)</label>
                        <input
                          value={fromTokenAddress}
                          onChange={e => { setFromTokenAddress(e.target.value); setFromTokenSymbol(''); setFromTokenDecimals(null); }}
                          placeholder="0x..."
                          className="w-full px-3 py-2 border border-purple-700/40 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-700/60 bg-black text-white placeholder:text-gray-500"
                        />
                        <div className="flex items-center gap-2 mt-1">
                          {/* Quick-select tokens; now hardcoded per chain (incl. testnets) */}
                          <button
                            type="button"
                            onClick={() => {
                              const cid = requiredChainId ?? CFG_CHAIN ?? walletChainId ?? 137;
                              const addr = getQuickToken(cid, 'wnative');
                              if (addr) setFromTokenAddress(addr);
                            }}
                            title="Wrapped native token for current network"
                            className="text-[11px] px-2 py-1 border rounded bg-black text-purple-300 border-purple-700/40 hover:bg-gray-900"
                          >{(() => { const cid = requiredChainId ?? CFG_CHAIN ?? walletChainId; return cid === 1 ? 'WETH' : cid === 137 ? 'WMATIC' : 'WNATIVE'; })()}</button>
                          <button
                            type="button"
                            onClick={() => {
                              const cid = requiredChainId ?? CFG_CHAIN ?? walletChainId ?? 137;
                              const addr = getQuickToken(cid, 'usdc');
                              if (addr) setFromTokenAddress(addr);
                            }}
                            title="USDC or stable token for current network"
                            className="text-[11px] px-2 py-1 border rounded bg-black text-purple-300 border-purple-700/40 hover:bg-gray-900"
                          >{(() => { const cid = requiredChainId ?? CFG_CHAIN ?? walletChainId; return `USDC${cid === 137 ? '.e' : ''}`; })()}</button>
                        </div>
                        {(fromTokenSymbol || fromTokenDecimals != null) && (
                          <div className="text-[11px] text-purple-300 mt-1">{fromTokenSymbol || 'Token'} • {fromTokenDecimals ?? 18} decimals</div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm text-purple-200">From amount</label>
                          <input
                            type="number"
                            min="0"
                            step="0.0001"
                            value={fromAmount}
                            onChange={e => setFromAmount(e.target.value)}
                            className="w-full px-3 py-2 border border-purple-700/40 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-700/60 bg-black text-white"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-purple-200">Slippage (bps)</label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={slippageBps}
                            onChange={e => setSlippageBps(Math.max(1, Number(e.target.value) || 50))}
                            className="w-full px-3 py-2 border border-purple-700/40 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-700/60 bg-black text-white"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleGetQuote}
                          disabled={quoteBusy || !fromTokenAddress || !fromAmount}
                          className="px-3 py-2 bg-purple-700 text-white rounded hover:bg-purple-600 disabled:opacity-50 text-sm flex items-center gap-2"
                        >{quoteBusy ? (<><Loader className="animate-spin" size={14} /> Getting quote...</>) : 'Get Quote'}</button>
                        {quoteOut && (
                          <div className="text-sm text-purple-200">
                            Est. receive: <span className="font-medium">{Number(quoteOut).toFixed(6)} {stakingState.tokenInfo?.symbol}</span>
                            {quoteIsMock && (
                              <div className="text-[11px] text-orange-300 mt-1">Estimate only: DEX quote unavailable on this network</div>
                            )}
                          </div>
                        )}
                      </div>
                      {swapError && (
                        <div className="text-xs text-red-300 bg-red-900/20 border border-red-700/30 rounded p-2">{swapError}</div>
                      )}
                      <div>
                        <button
                          type="button"
                          onClick={handleExecuteSwap}
                          disabled={swapBusy || !quoteOut || quoteIsMock || (walletChainId != null && dexChainId !== walletChainId)}
                          className="px-3 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 text-sm flex items-center gap-2"
                        >{swapBusy ? (<><Loader className="animate-spin" size={14} /> Swapping...</>) : 'Execute Swap'}</button>
                        <div className="text-[11px] text-purple-300 mt-2">After swap confirms, proceed to Approve and Stake below.</div>
                        {quoteIsMock && (
                          <div className="text-[11px] text-orange-300 mt-1">Swap execution disabled for mock quotes. Try a supported network or another DEX.</div>
                        )}
                        {(walletChainId != null && dexChainId !== walletChainId) && (
                          <div className="text-[11px] text-orange-300 mt-1">Connect your wallet to the same network as the DEX selection to execute swaps.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* Network Issue Warning */}
              {isNetworkIssue && (
                <div className="bg-orange-900/10 border border-orange-700/30 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="text-orange-400 mt-0.5 flex-shrink-0" size={20} />
                    <div className="text-sm text-orange-200">
                      <p className="font-medium mb-2">Network Connectivity Issues</p>
                      <p className="mb-2">The app is experiencing network connectivity problems. Using mock data for testing purposes.</p>
                      <div className="bg-blue-900/10 border border-blue-700/30 rounded p-2 mt-2">
                        <p className="text-xs text-blue-200">
                          <strong>Troubleshooting:</strong> Try switching to a different network in OKX Wallet, or use a different RPC endpoint for your current network.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Contract Implementation Error */}
              {isInvalidContract && !isNetworkIssue && (
                <div className="bg-yellow-900/10 border border-yellow-700/30 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="text-yellow-400 mt-0.5 flex-shrink-0" size={20} />
                    <div className="text-sm text-yellow-200">
                      <p className="font-medium mb-2">Invalid Token Contract</p>
                      <p className="mb-2">The token contract doesn't implement the ERC20 standard correctly. Using mock data for testing.</p>
                      <div className="bg-gray-900/40 border border-gray-700/40 rounded p-2 mt-2">
                        <p className="text-xs text-gray-200">
                          <strong>For developers:</strong> Please verify the token contract's implementation and ensure it follows the ERC20 standard.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Token Configuration Error - Only show if not a network or contract issue */}
              {(tokenLoadError || !isTokenConfigured) && !isNetworkIssue && !isInvalidContract && (
                <div className="bg-red-900/10 border border-red-700/30 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="text-red-400 mt-0.5 flex-shrink-0" size={20} />
                    <div className="text-sm text-red-800">
                      <p className="font-medium mb-2 text-red-200">Contract Configuration Issue</p>
                      <p className="mb-2 text-red-200/90">The staking contract needs to be configured with a token address.</p>
                      <div className="bg-yellow-900/10 border border-yellow-700/30 rounded p-2">
                        <p className="text-xs text-yellow-200">
                          <strong>For developers:</strong> Deploy an ERC20 token contract first, then update the staking contract.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pool Info */}
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 space-y-2 border border-white/10">
                <h3 className="font-semibold text-white mb-3">{hackathonMode ? 'Registration Details' : 'Pool Information'}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Pool Name:</span>
                    <span className="font-medium text-white">{poolName}</span>
                  </div>
                  <div className="flex justify-between">
                    {!hackathonMode ? (
                      <>
                        <span className="text-gray-300">APY:</span>
                        <span className="font-medium text-green-400">{apy}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-gray-300">Category:</span>
                        <span className="font-medium text-purple-300">Hackathon</span>
                      </>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Minimum Stake:</span>
                    <span className="font-medium text-white">{minStake}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Token:</span>
                    <span className="font-medium text-white">{tokenName} ({tokenSymbol})</span>
                  </div>
                  {(isTokenConfigured || isNetworkIssue || isInvalidContract) && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">{hackathonMode ? 'Total Registration Stake:' : 'Total Staked:'}</span>
                      <span className="font-medium text-blue-300">{parseFloat(totalStaked).toFixed(2)} {tokenSymbol}</span>
                    </div>
                  )}
          {(isNetworkIssue || isInvalidContract) && (
                    <div className="text-xs text-orange-300 mt-2">
            * {hackathonMode ? 'Using mock data for registration on this network' : 'Using mock data due to network or contract issues'}
                    </div>
                  )}
                </div>
              </div>

              {/* Auto-stake stepper */}
              {autoBusy && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">Auto Stake Progress</h4>
                  <ul className="space-y-2 text-sm">
                    {steps.map(s => (
                      <li key={s.key} className="flex items-start gap-2">
                        {s.status === 'running' && <Loader className="animate-spin text-purple-300 mt-0.5" size={14} />}
                        {s.status === 'done' && <CheckCircle className="text-green-400 mt-0.5" size={16} />}
                        {s.status === 'error' && <AlertTriangle className="text-red-400 mt-0.5" size={16} />}
                        {s.status === 'skipped' && <span className="mt-0.5 text-purple-300">•</span>}
                        <div>
                          <div className="font-medium text-white">{s.label}</div>
                          {s.detail && <div className="text-xs text-gray-300">{s.detail}</div>}
                        </div>
                      </li>
                    ))}
                  </ul>
                  {autoError && <div className="text-xs text-red-300 mt-2">{autoError}</div>}
                </div>
              )}

              {/* User Balance Info */}
              {stakingState.tokenInfo && (isTokenConfigured || isNetworkIssue || isInvalidContract) && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">Your Wallet {(isNetworkIssue || isInvalidContract) && '(Mock Data)'}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Balance:</span>
                      <span className="font-medium text-white">{parseFloat(userBalance).toFixed(4)} {tokenSymbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Allowance:</span>
                      <span className="font-medium text-white">{parseFloat(allowance).toFixed(4)} {tokenSymbol}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Stake Amount Input */}
              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm font-medium text-gray-200 mb-2 block">
                    Stake Amount ({tokenSymbol})
                  </span>
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="Enter amount to stake"
                    className="w-full px-4 py-3 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-lg bg-black text-white placeholder:text-gray-500"
                    disabled={stakingState.isLoading || (!isTokenConfigured && !isNetworkIssue && !isInvalidContract)}
                    step="0.001"
                    min="0"
                    max={userBalance}
                  />
                </label>
                <p className="text-xs text-gray-400">
                  {(isTokenConfigured || isNetworkIssue || isInvalidContract) 
                    ? `Available: ${parseFloat(userBalance).toFixed(4)} ${tokenSymbol}${(isNetworkIssue || isInvalidContract) ? ' (mock)' : ''}` 
                    : 'Token contract not configured'
                  }
                </p>
              </div>

              {/* Approval Warning */}
              {needsApproval && stakeAmount && isTokenConfigured && (
        <div className="bg-yellow-900/10 border border-yellow-700/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
          <Shield className="text-yellow-400 mt-0.5" size={16} />
          <div className="text-sm text-yellow-200">
                      <p className="font-medium mb-1">Token Approval Required</p>
                      <p>You need to approve {stakeAmount} {tokenSymbol} tokens before staking</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Error Display */}
              {stakingState.error && (
                <div className="bg-red-900/10 border border-red-700/30 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="text-red-400 mt-0.5 flex-shrink-0" size={20} />
                    <div className="flex-1">
                      <p className="text-red-300 text-sm font-medium mb-2">Transaction Failed</p>
                      <p className="text-red-200 text-sm mb-3">{stakingState.error}</p>
                      {(stakingState.error.includes('Network') || stakingState.error.includes('RPC')) && (
                        <div className="space-y-2">
                          {isRetrying ? (
                            <div className="flex items-center gap-2 text-orange-600 text-sm">
                              <Loader className="animate-spin" size={14} />
                              <span>Retrying in 3 seconds... (Attempt {retryCount + 1}/3)</span>
                            </div>
                          ) : retryCount < 3 ? (
                            <button
                              onClick={handleRetry}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors"
                            >
                              Retry Transaction
                            </button>
                          ) : null}
                          <div className="text-xs text-gray-300 bg-white/5 border border-white/10 p-2 rounded">
                            <p className="font-medium mb-1 text-white">Troubleshooting Tips:</p>
                            <ul className="space-y-1">
                              <li className="text-gray-300">• Check your internet connection</li>
                              <li className="text-gray-300">• Try switching to a different RPC endpoint</li>
                              <li className="text-gray-300">• Increase gas price in your wallet</li>
                              <li className="text-gray-300">• Wait for network congestion to decrease</li>
                            </ul>
                          </div>
                        </div>
                      )}
                      {stakingState.error.includes('gas') && (
                        <div className="text-xs text-yellow-200 bg-yellow-900/10 p-2 rounded border border-yellow-700/30">
                          <p className="font-medium text-yellow-300 mb-1">Gas Issue Tips:</p>
                          <ul className="space-y-1 text-yellow-200">
                            <li>• Ensure you have enough ETH for gas fees</li>
                            <li>• Try increasing gas limit in your wallet</li>
                            <li>• Wait for lower network congestion</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction Hash */}
              {stakingState.txHash && !showSuccess && (
                <div className="bg-yellow-900/10 border border-yellow-700/30 rounded-lg p-3">
                  <p className="text-yellow-200 text-sm">
                    Transaction sent: 
                    <a
                      href={getExplorerUrl(stakingState.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 text-blue-300 hover:underline"
                    >
                      {stakingState.txHash.slice(0, 10)}...
                    </a>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-black/90 border-t border-white/10 p-6 rounded-b-2xl">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-white/10 text-gray-200 rounded-lg hover:bg-white/5 transition-colors font-medium"
              disabled={stakingState.isLoading || isRetrying}
            >
              Cancel
            </button>
            {/* Auto Stake button */}
            <button
              onClick={autoStake}
              disabled={autoBusy || stakingState.isLoading || isRetrying || !stakeAmount || parseFloat(stakeAmount) <= 0}
              className="flex-1 px-4 py-3 bg-white text-black rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
            >
              {autoBusy ? (<><Loader className="animate-spin" size={16} /> Auto Staking...</>) : 'Auto Stake'}
            </button>
            
            {(!isTokenConfigured && !isNetworkIssue && !isInvalidContract) ? (
              <button
                disabled={true}
                className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg cursor-not-allowed font-medium"
              >
                Contract Not Ready
              </button>
            ) : needsApproval && !isNetworkIssue && !isInvalidContract ? (
              <button
                onClick={handleApprove}
                disabled={stakingState.isLoading || !stakeAmount || parseFloat(stakeAmount) <= 0}
                className="flex-1 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
              >
                {stakingState.isLoading ? (
                  <>
                    <Loader className="animate-spin" size={16} />
                    Approving...
                  </>
                ) : (
                  `Approve ${tokenSymbol}`
                )}
              </button>
            ) : (
              <button
                onClick={handleStake}
                disabled={
                  stakingState.isLoading || 
                  isRetrying || 
                  !stakeAmount || 
                  parseFloat(stakeAmount) <= 0 || 
                  (parseFloat(stakeAmount) > parseFloat(userBalance) && !isNetworkIssue && !isInvalidContract)
                }
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
              >
                {stakingState.isLoading || isRetrying ? (
                  <>
                    <Loader className="animate-spin" size={16} />
                    {isRetrying ? `Retrying (${retryCount}/3)...` : (isNetworkIssue || isInvalidContract ? (hackathonMode ? 'Simulating registration…' : 'Simulating…') : (hackathonMode ? 'Registering…' : 'Staking...'))}
                  </>
                ) : (
                  <>
                    {isNetworkIssue || isInvalidContract ? 'Test Interface' : (hackathonMode ? 'Confirm Registration' : 'Stake Now')}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StakeModal;
