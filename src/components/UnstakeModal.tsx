import React, { useState, useEffect } from 'react';
import { getEthersProvider } from '../wallet/okxWallet';
import { X, Minus, AlertTriangle, CheckCircle, ExternalLink, Loader, Info } from 'lucide-react';
import { useStakingContract } from '../hooks/useStakingContract';
import { stakingRecords } from '../utils/stakingRecords';
import { csvLogger } from '../utils/csvLogger';

interface UnstakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  totalStaked: number;
  tokenSymbol: string;
  onUnstakeSuccess: () => void;
}

const UnstakeModal: React.FC<UnstakeModalProps> = ({
  isOpen,
  onClose,
  companyName,
  totalStaked,
  tokenSymbol,
  onUnstakeSuccess
}) => {
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [userStakedBalance, setUserStakedBalance] = useState('0');
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { unstake, stakingState, clearState, getStakeAmount } = useStakingContract();

  useEffect(() => {
    if (isOpen) {
      clearState();
      setUnstakeAmount('');
      setShowSuccess(false);
      loadUserStakedBalance();
    }
  }, [isOpen, clearState]);

  const loadUserStakedBalance = async () => {
    try {
  const provider = await getEthersProvider().catch(() => null as any);
  if (provider) {
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        const balance = await getStakeAmount(userAddress);
        setUserStakedBalance(balance);
      }
    } catch (error) {
      console.error('Error loading user staked balance:', error);
      setUserStakedBalance('0');
    }
  };

  const handleUnstake = async () => {
    if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) {
      alert('Please enter a valid unstake amount greater than 0');
      return;
    }

    if (parseFloat(unstakeAmount) > parseFloat(userStakedBalance)) {
      alert('Cannot unstake more than your staked balance');
      return;
    }

    let userAddress = 'Unknown';
    try {
  const provider = await getEthersProvider().catch(() => null as any);
  if (provider) {
        const signer = await provider.getSigner();
        userAddress = await signer.getAddress();
      }
    } catch (error) {
      console.error('Error getting user address:', error);
    }

    const result = await unstake(unstakeAmount);

    if (result.success) {
      csvLogger.addUnstakeRecord({
        companyName: companyName,
        amount: -parseFloat(unstakeAmount),
        tokenSymbol: tokenSymbol,
        userAddress: userAddress,
        transactionHash: result.txHash || ''
      });

      stakingRecords.recordUnstake(
        companyName,
        parseFloat(unstakeAmount),
        tokenSymbol
      );

      setShowSuccess(true);
      setTimeout(() => {
        onUnstakeSuccess();
        onClose();
      }, 3000);
    } else {
      if (result.error?.includes('Network') || result.error?.includes('RPC')) {
        setIsRetrying(true);
        setRetryCount(prev => prev + 1);

        setTimeout(() => {
          setIsRetrying(false);
          if (retryCount < 2) {
            handleUnstake();
          }
        }, 3000);
      }
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    handleUnstake();
  };

  const handleMaxClick = () => {
    setUnstakeAmount(userStakedBalance);
  };

  const getExplorerUrl = (txHash: string) => {
    return `https://polygonscan.com/tx/${txHash}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md mx-auto relative shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
            disabled={stakingState.isLoading}
          >
            <X size={24} />
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Minus className="text-red-600" size={28} />
              <h2 className="text-2xl font-bold text-gray-800">Unstake Tokens</h2>
            </div>
            <p className="text-gray-600 text-sm">Unstake {tokenSymbol} from {companyName}</p>
          </div>
        </div>

        <div className="p-6">
          {showSuccess ? (
            <div className="space-y-4 text-center">
              <CheckCircle className="text-green-500 mx-auto" size={64} />
              <div>
                <h3 className="text-lg font-semibold text-green-600 mb-2">
                  Unstaking Successful!
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  You have successfully unstaked {unstakeAmount} {tokenSymbol} from {companyName}
                </p>
                {stakingState.txHash && (
                  <a
                    href={getExplorerUrl(stakingState.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View Transaction <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-3">Unstaking Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-red-700">Company:</span>
                    <span className="font-medium text-red-800">{companyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700">Token:</span>
                    <span className="font-medium text-red-800">{tokenSymbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700">Your Staked Balance:</span>
                    <span className="font-medium text-red-800">{parseFloat(userStakedBalance).toFixed(4)} {tokenSymbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700">Local Records Total:</span>
                    <span className="font-medium text-red-800">{totalStaked.toFixed(4)} {tokenSymbol}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Info className="text-blue-600 mt-0.5 flex-shrink-0" size={16} />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Important Notice</p>
                    <p>Unstaking will withdraw tokens from the smart contract. The amount shown above is your actual staked balance on the blockchain, which may differ from local records due to previous unstaking or contract interactions.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 mb-2 block">
                    Unstake Amount ({tokenSymbol})
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      value={unstakeAmount}
                      onChange={(e) => setUnstakeAmount(e.target.value)}
                      placeholder="Enter amount to unstake"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg pr-16"
                      disabled={stakingState.isLoading}
                      step="0.001"
                      min="0"
                      max={userStakedBalance}
                    />
                    <button
                      onClick={handleMaxClick}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      disabled={stakingState.isLoading}
                    >
                      MAX
                    </button>
                  </div>
                </label>
                <p className="text-xs text-gray-500">
                  Available to unstake: {parseFloat(userStakedBalance).toFixed(4)} {tokenSymbol}
                </p>
              </div>

              {unstakeAmount && parseFloat(unstakeAmount) > parseFloat(userStakedBalance) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="text-yellow-600 mt-0.5" size={16} />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">Invalid Amount</p>
                      <p>You cannot unstake more than your current staked balance of {parseFloat(userStakedBalance).toFixed(4)} {tokenSymbol}</p>
                    </div>
                  </div>
                </div>
              )}

              {stakingState.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
                    <div className="flex-1">
                      <p className="text-red-800 text-sm font-medium mb-2">Unstaking Failed</p>
                      <p className="text-red-700 text-sm mb-3">{stakingState.error}</p>
                      
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
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                            >
                              Retry Transaction
                            </button>
                          ) : null}
                          
                          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            <p className="font-medium mb-1">Troubleshooting Tips:</p>
                            <ul className="space-y-1">
                              <li>• Check your internet connection</li>
                              <li>• Try switching to a different RPC endpoint</li>
                              <li>• Increase gas price in your wallet</li>
                              <li>• Wait for network congestion to decrease</li>
                            </ul>
                          </div>
                        </div>
                      )}

                      {stakingState.error.includes('gas') && (
                        <div className="text-xs text-gray-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                          <p className="font-medium text-yellow-800 mb-1">Gas Issue Tips:</p>
                          <ul className="space-y-1 text-yellow-700">
                            <li>• Ensure you have enough ETH for gas fees</li>
                            <li>• Try increasing gas limit in your wallet</li>
                            <li>• Wait for lower network congestion</li>
                          </ul>
                        </div>
                      )}

                      {stakingState.error.includes('balance') && (
                        <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-200">
                          <p className="font-medium text-blue-800 mb-1">Balance Issue Tips:</p>
                          <ul className="space-y-1 text-blue-700">
                            <li>• Check if you have tokens staked in this contract</li>
                            <li>• Verify the unstake amount is not more than staked</li>
                            <li>• Refresh the page to update your balance</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {stakingState.txHash && !showSuccess && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-yellow-800 text-sm">
                    Transaction sent: 
                    <a
                      href={getExplorerUrl(stakingState.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 text-blue-600 hover:underline"
                    >
                      {stakingState.txHash.slice(0, 10)}...
                    </a>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-2xl">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={stakingState.isLoading || isRetrying}
            >
              Cancel
            </button>
            
            <button
              onClick={handleUnstake}
              disabled={
                stakingState.isLoading || 
                isRetrying ||
                !unstakeAmount || 
                parseFloat(unstakeAmount) <= 0 || 
                parseFloat(unstakeAmount) > parseFloat(userStakedBalance)
              }
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
            >
              {stakingState.isLoading || isRetrying ? (
                <>
                  <Loader className="animate-spin" size={16} />
                  {isRetrying ? `Retrying (${retryCount}/3)...` : 'Unstaking...'}
                </>
              ) : (
                <>
                  <Minus size={16} />
                  Unstake {tokenSymbol}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnstakeModal;
