import React, { useState } from 'react';
import { Wallet, Check, Loader } from 'lucide-react';

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

  const handleConnect = async () => {
    setIsConnecting(true);
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    onConnect();
    setIsConnecting(false);
  };

  if (isConnected) {
    return (
      <button
        onClick={onDisconnect}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 futuristic-button hover-glow"
      >
        <Check size={18} />
        <span className="hidden sm:inline">Connected</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed futuristic-button hover-glow"
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
  );
};

export default WalletConnection;