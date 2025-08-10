import React, { useState } from 'react';
import { Wallet, Check, Loader, AlertTriangle } from 'lucide-react';
import { requestAccounts, getOkxEip1193 } from '../wallet/okxWallet';

interface WalletConnectionProps {
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

const WalletConnection: React.FC<WalletConnectionProps> = ({ 
  isConnected, 
  onConnect, 
  onDisconnect 
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      // Prefer OKX wallet if present; fallback to any injected provider
      const okx = getOkxEip1193();
      if (!okx) {
        // Try generic injected provider if available
        const w: any = window as any;
        if (w.ethereum && typeof w.ethereum.request === 'function') {
          const accs = await w.ethereum.request({ method: 'eth_requestAccounts' });
          const first = Array.isArray(accs) && accs.length > 0 ? String(accs[0]) : null;
          setAccount(first);
          onConnect();
        } else {
          setError('No EVM wallet detected. Please install and unlock OKX Wallet.');
        }
      } else {
        const accs = await requestAccounts();
        const first = Array.isArray(accs) && accs.length > 0 ? String(accs[0]) : null;
        setAccount(first);
        onConnect();
      }
    } catch (e: any) {
      if (e && e.code === 4001) {
        setError('Connection request was rejected.');
      } else {
        setError(e?.message || 'Failed to connect wallet');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setAccount(null);
    onDisconnect();
  };

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleDisconnect}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 futuristic-button hover-glow"
          title={account || 'Connected'}
        >
          <Check size={18} />
          <span className="hidden sm:inline">{account ? `${account.slice(0, 6)}…${account.slice(-4)}` : 'Connected'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed futuristic-button hover-glow"
        title="Connect with OKX Wallet (preferred) or another injected wallet"
      >
        {isConnecting ? (
          <Loader size={18} className="animate-spin" />
        ) : (
          <Wallet size={18} />
        )}
        <span className="hidden sm:inline">
          {isConnecting ? 'Connecting...' : 'Connect'}
        </span>
      </button>
      {error && (
        <div className="flex items-center gap-1 text-xs text-yellow-300">
          <AlertTriangle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default WalletConnection;