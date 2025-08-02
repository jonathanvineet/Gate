import React, { useState, useEffect } from 'react';
import { X, Coins, AlertTriangle, CheckCircle, ExternalLink, Loader, Shield } from 'lucide-react';
import { useStakingContract } from '../hooks/useStakingContract';
import { csvLogger } from '../utils/csvLogger';
import { stakingRecords } from '../utils/stakingRecords';

interface StakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  poolName: string;
  poolId: string;
  minStake: string;
  apy: string;
}

const StakeModal: React.FC<StakeModalProps> = ({
  isOpen,
  onClose,
  poolName,
  poolId,
  minStake,
  apy
}) => {
  const [stakeAmount, setStakeAmount] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [tokenLoadError, setTokenLoadError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isNetworkIssue, setIsNetworkIssue] = useState(false);
  const [isInvalidContract, setIsInvalidContract] = useState(false);
  const { stake, approveToken, loadTokenInfo, stakingState, clearState, contractAddress } = useStakingContract();

  useEffect(() => {
    if (isOpen) {
      clearState();
      setStakeAmount('');
      setShowSuccess(false);
      setNeedsApproval(false);
      setTokenLoadError(null);
      setIsNetworkIssue(false);
      setIsInvalidContract(false);

      // Load token info when modal opens
      loadTokenInfo().catch((error) => {
        console.error('Failed to load token info:', error);
        const errorMsg = error.message || 'Failed to load token information';
        setTokenLoadError(errorMsg);

        // Check error type to set appropriate flags
        if (errorMsg.includes('Network') || errorMsg.includes('node synchronization') || errorMsg.includes('RPC endpoint')) {
          setIsNetworkIssue(true);
        } else if (errorMsg.includes('not implement') || errorMsg.includes('invalid') || errorMsg.includes('does not appear to be')) {
          setIsInvalidContract(true);
        }
      });
    }
  }, [isOpen, clearState, loadTokenInfo]);

  // Check if approval is needed when amount changes
  useEffect(() => {
    if (stakeAmount && stakingState.tokenInfo) {
      const needsApproval = parseFloat(stakeAmount) > parseFloat(stakingState.tokenInfo.allowance);
      setNeedsApproval(needsApproval);
    }
  }, [stakeAmount, stakingState.tokenInfo]);

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

    // Get user address for logging
    let userAddress = 'Unknown';
    try {
      const provider = await (window as any).ethereum ? new (await import('ethers')).ethers.BrowserProvider((window as any).ethereum) : null;
      if (provider) {
        const signer = await provider.getSigner();
        userAddress = await signer.getAddress();
      }
    } catch (error) {
      console.error('Error getting user address:', error);
    }

    const result = await stake(stakeAmount);

    if (result.success) {
      // Log the stake to CSV
      csvLogger.addStakeRecord({
        companyName: poolName.split(' ')[0] || 'Unknown',
        poolName: poolName,
        amount: parseFloat(stakeAmount),
        tokenSymbol: stakingState.tokenInfo?.symbol || 'TT',
        apy: apy,
        userAddress: userAddress,
        transactionHash: result.txHash || ''
      });

      // Also record in our staking balance tracker
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
      // Handle specific error cases
      if (result.error?.includes('Network') || result.error?.includes('RPC')) {
        setIsRetrying(true);
        setRetryCount(prev => prev + 1);

        // Auto-retry after 3 seconds for network errors
        setTimeout(() => {
          setIsRetrying(false);
          if (retryCount < 2) { // Max 3 attempts
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

  const getExplorerUrl = (txHash: string) => {
    // Adjust for your network (mainnet, polygon, etc.)
    return `https://polygonscan.com/tx/${txHash}`;
  };

  if (!isOpen) return null;

  const tokenSymbol = stakingState.tokenInfo?.symbol || 'TT';
  const tokenName = stakingState.tokenInfo?.name || 'Test Token';
  const userBalance = stakingState.tokenInfo?.balance || '0';
  const allowance = stakingState.tokenInfo?.allowance || '0';
  const totalStaked = stakingState.totalStaked || '0';
  const isTokenConfigured = stakingState.tokenInfo?.address && stakingState.tokenInfo.address !== '0x0000000000000000000000000000000000000000';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md mx-auto relative shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
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
              <Coins className="text-purple-600" size={28} />
              <h2 className="text-2xl font-bold text-gray-800">Stake Tokens</h2>
            </div>
            <p className="text-gray-600 text-sm">Stake {tokenSymbol} in {poolName}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {showSuccess ? (
            <div className="space-y-4 text-center">
              <CheckCircle className="text-green-500 mx-auto" size={64} />
              <div>
                <h3 className="text-lg font-semibold text-green-600 mb-2">
                  Staking Successful!
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  You have successfully staked {stakeAmount} {tokenSymbol} in {poolName}
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
              {/* Network Issue Warning */}
              {isNetworkIssue && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="text-orange-600 mt-0.5 flex-shrink-0" size={20} />
                    <div className="text-sm text-orange-800">
                      <p className="font-medium mb-2">Network Connectivity Issues</p>
                      <p className="mb-2">The app is experiencing network connectivity problems. Using mock data for testing purposes.</p>
                      <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                        <p className="text-xs text-blue-800">
                          <strong>Troubleshooting:</strong> Try switching to a different network in MetaMask, or use a different RPC endpoint for your current network.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Contract Implementation Error */}
              {isInvalidContract && !isNetworkIssue && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="text-yellow-600 mt-0.5 flex-shrink-0" size={20} />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-2">Invalid Token Contract</p>
                      <p className="mb-2">The token contract doesn't implement the ERC20 standard correctly. Using mock data for testing.</p>
                      <div className="bg-gray-50 border border-gray-200 rounded p-2 mt-2">
                        <p className="text-xs text-gray-800">
                          <strong>For developers:</strong> Please verify the token contract's implementation and ensure it follows the ERC20 standard.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Token Configuration Error - Only show if not a network or contract issue */}
              {(tokenLoadError || !isTokenConfigured) && !isNetworkIssue && !isInvalidContract && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
                    <div className="text-sm text-red-800">
                      <p className="font-medium mb-2">Contract Configuration Issue</p>
                      <p className="mb-2">The staking contract needs to be configured with a token address.</p>
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                        <p className="text-xs text-yellow-800">
                          <strong>For developers:</strong> Deploy an ERC20 token contract first, then update the staking contract.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pool Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-gray-800 mb-3">Pool Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pool Name:</span>
                    <span className="font-medium">{poolName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">APY:</span>
                    <span className="font-medium text-green-600">{apy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Token:</span>
                    <span className="font-medium">{tokenName} ({tokenSymbol})</span>
                  </div>
                  {(isTokenConfigured || isNetworkIssue || isInvalidContract) && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Staked:</span>
                      <span className="font-medium text-blue-600">{parseFloat(totalStaked).toFixed(2)} {tokenSymbol}</span>
                    </div>
                  )}
                  {(isNetworkIssue || isInvalidContract) && (
                    <div className="text-xs text-orange-600 mt-2">
                      * Using mock data due to network or contract issues
                    </div>
                  )}
                </div>
              </div>

              {/* User Balance Info */}
              {stakingState.tokenInfo && (isTokenConfigured || isNetworkIssue || isInvalidContract) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Your Wallet {(isNetworkIssue || isInvalidContract) && '(Mock Data)'}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Balance:</span>
                      <span className="font-medium text-blue-800">{parseFloat(userBalance).toFixed(4)} {tokenSymbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Allowance:</span>
                      <span className="font-medium text-blue-800">{parseFloat(allowance).toFixed(4)} {tokenSymbol}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Stake Amount Input */}
              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 mb-2 block">
                    Stake Amount ({tokenSymbol})
                  </span>
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="Enter amount to stake"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                    disabled={stakingState.isLoading || (!isTokenConfigured && !isNetworkIssue && !isInvalidContract)}
                    step="0.001"
                    min="0"
                    max={userBalance}
                  />
                </label>
                <p className="text-xs text-gray-500">
                  {(isTokenConfigured || isNetworkIssue || isInvalidContract) 
                    ? `Available: ${parseFloat(userBalance).toFixed(4)} ${tokenSymbol}${(isNetworkIssue || isInvalidContract) ? ' (mock)' : ''}` 
                    : 'Token contract not configured'
                  }
                </p>
              </div>

              {/* Approval Warning */}
              {needsApproval && stakeAmount && isTokenConfigured && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Shield className="text-yellow-600 mt-0.5" size={16} />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">Token Approval Required</p>
                      <p>You need to approve {stakeAmount} {tokenSymbol} tokens before staking</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Error Display */}
              {stakingState.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
                    <div className="flex-1">
                      <p className="text-red-800 text-sm font-medium mb-2">Transaction Failed</p>
                      <p className="text-red-700 text-sm mb-3">{stakingState.error}</p>
                      
                      {/* Retry section for network errors */}
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

                      {/* Gas-related error tips */}
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
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction Hash */}
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

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-2xl">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={stakingState.isLoading || isRetrying}
            >
              Cancel
            </button>
            
            {(!isTokenConfigured && !isNetworkIssue && !isInvalidContract) ? (
              <button
                disabled={true}
                className="flex-1 px-4 py-3 bg-gray-400 text-white rounded-lg cursor-not-allowed font-medium"
              >
                Contract Not Ready
              </button>
            ) : needsApproval && !isNetworkIssue && !isInvalidContract ? (
              <button
                onClick={handleApprove}
                disabled={stakingState.isLoading || !stakeAmount || parseFloat(stakeAmount) <= 0}
                className="flex-1 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
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
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
              >
                {stakingState.isLoading || isRetrying ? (
                  <>
                    <Loader className="animate-spin" size={16} />
                    {isRetrying ? `Retrying (${retryCount}/3)...` : (isNetworkIssue || isInvalidContract ? 'Simulating...' : 'Staking...')}
                  </>
                ) : (
                  <>
                    {isNetworkIssue || isInvalidContract ? 'Test Interface' : 'Stake Now'}
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
