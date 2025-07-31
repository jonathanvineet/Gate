import React, { useState, useEffect } from 'react';
import { X, Coins, AlertTriangle, CheckCircle, ExternalLink, Loader, Shield } from 'lucide-react';
import { useStakingContract } from '../hooks/useStakingContract';
import { useUserActivity } from '../contexts/UserActivityContext';

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
  const { stake, approveToken, loadTokenInfo, stakingState, clearState, contractAddress } = useStakingContract();
  const { addStake, updateStakeStatus } = useUserActivity();

  useEffect(() => {
    if (isOpen) {
      clearState();
      setStakeAmount('');
      setShowSuccess(false);
      setNeedsApproval(false);
      setTokenLoadError(null);
      
      // Load token info when modal opens
      loadTokenInfo().catch((error) => {
        console.error('Failed to load token info:', error);
        setTokenLoadError(error.message || 'Failed to load token information');
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

    // Get user address for tracking
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

    // Add stake to activity tracker as pending
    const stakeActivity = {
      poolId,
      poolName,
      amount: stakeAmount,
      tokenSymbol: stakingState.tokenInfo?.symbol || 'TT',
      apy,
      txHash: '', // Will be updated when we get the transaction hash
      status: 'pending' as const,
      userAddress
    };

    addStake(stakeActivity);

    const result = await stake(stakeAmount);
    
    if (result.success && result.txHash) {
      // Update the stake activity with transaction hash and confirmed status
      const activities = JSON.parse(localStorage.getItem('user_staking_activities') || '{"stakes":[]}');
      const latestStake = activities.stakes[activities.stakes.length - 1];
      
      if (latestStake) {
        updateStakeStatus(latestStake.id, 'confirmed');
        // Update txHash
        const updatedActivities = {
          ...activities,
          stakes: activities.stakes.map((s: any) => 
            s.id === latestStake.id ? { ...s, txHash: result.txHash } : s
          )
        };
        localStorage.setItem('user_staking_activities', JSON.stringify(updatedActivities));
      }

      setShowSuccess(true);
      setTimeout(() => {
        onClose();
      }, 3000);
    } else {
      // Update status to failed
      const activities = JSON.parse(localStorage.getItem('user_staking_activities') || '{"stakes":[]}');
      const latestStake = activities.stakes[activities.stakes.length - 1];
      
      if (latestStake) {
        updateStakeStatus(latestStake.id, 'failed');
      }
    }
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
                <p className="text-blue-600 text-sm mb-4">
                  ✨ Check "Your Activity" section below to track this stake
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
              {/* Token Configuration Error */}
              {(tokenLoadError || !isTokenConfigured) && (
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
                  {isTokenConfigured && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Staked:</span>
                      <span className="font-medium text-blue-600">{parseFloat(totalStaked).toFixed(2)} {tokenSymbol}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Activity Tracking Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Coins className="text-blue-600 mt-0.5" size={16} />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Activity Tracking</p>
                    <p>Your stake will appear in "Your Activity" section after confirmation</p>
                  </div>
                </div>
              </div>

              {/* User Balance Info */}
              {stakingState.tokenInfo && isTokenConfigured && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Your Wallet</h4>
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
                    disabled={stakingState.isLoading || !isTokenConfigured}
                    step="0.001"
                    min="0"
                    max={userBalance}
                  />
                </label>
                <p className="text-xs text-gray-500">
                  {isTokenConfigured ? `Available: ${parseFloat(userBalance).toFixed(4)} ${tokenSymbol}` : 'Token contract not configured'}
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

              {/* Error Display */}
              {stakingState.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{stakingState.error}</p>
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
              disabled={stakingState.isLoading}
            >
              Cancel
            </button>
            
            {!isTokenConfigured ? (
              <button
                disabled={true}
                className="flex-1 px-4 py-3 bg-gray-400 text-white rounded-lg cursor-not-allowed font-medium"
              >
                Contract Not Ready
              </button>
            ) : needsApproval ? (
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
                disabled={stakingState.isLoading || !stakeAmount || parseFloat(stakeAmount) <= 0 || parseFloat(stakeAmount) > parseFloat(userBalance)}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
              >
                {stakingState.isLoading ? (
                  <>
                    <Loader className="animate-spin" size={16} />
                    Staking...
                  </>
                ) : (
                  'Stake Now'
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
