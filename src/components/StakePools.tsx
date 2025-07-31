import React, { useState, useEffect } from 'react';
import { Coins, TrendingUp, Shield, UserCheck, Lock, AlertTriangle, Calendar } from 'lucide-react';
import ExpandableCard from './ExpandableCard';
import VerificationModal from './VerificationModal';
import StakeModal from './StakeModal';
import { stakePools } from '../data/mockData';
import { useVerification } from '../contexts/VerificationContext';
import { useUserActivity } from '../contexts/UserActivityContext';

interface StakePoolsProps {
  onJoinStakePool: (poolId: string) => void;
}

const StakePools: React.FC<StakePoolsProps> = ({ onJoinStakePool }) => {
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const { verificationState, setVerified } = useVerification();
  const { getTotalStakedInPool, getStakesByPool } = useUserActivity();

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'High': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleJoinPool = (poolId: string) => {
    const pool = stakePools.find(p => p.id === poolId);
    
    console.log('🎯 StakePools: Attempting to join pool', {
      poolId,
      requiresAge18: pool?.requiresAge18,
      isVerified: verificationState.isVerified
    });
    
    if (pool?.requiresAge18 && !verificationState.isVerified) {
      console.log('🔒 StakePools: Pool requires age verification, showing modal');
      setSelectedPoolId(poolId);
      setShowVerificationModal(true);
      return;
    }
    
    // Open staking modal directly
    console.log('✅ StakePools: Opening staking modal for pool:', poolId);
    setSelectedPoolId(poolId);
    setShowStakeModal(true);
  };

  const handleVerificationComplete = (success: boolean) => {
    console.log('🎯 StakePools: Verification completed:', success);
    setShowVerificationModal(false);
    
    if (success) {
      setVerified(true, 'age');
      if (selectedPoolId) {
        console.log('✅ StakePools: Opening staking modal after verification');
        setShowStakeModal(true);
      }
    } else {
      setSelectedPoolId(null);
    }
  };

  const handleStakeModalClose = () => {
    setShowStakeModal(false);
    setSelectedPoolId(null);
  };

  const formatVerificationDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const selectedPool = selectedPoolId ? stakePools.find(p => p.id === selectedPoolId) : null;

  return (
    <>
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Coins className="text-purple-400" />
          Stake Pools
        </h2>
        
        {/* Global verification status banner */}
        {verificationState.isVerified && (
          <div className="mb-6 bg-green-900/20 border border-green-600/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <UserCheck className="text-green-400" size={20} />
              <div>
                <p className="text-green-300 font-medium">Age Verification Complete ✓</p>
                <div className="flex items-center gap-2 text-sm text-green-200">
                  <Calendar size={14} />
                  <span>Verified on {formatVerificationDate(verificationState.verificationDate)}</span>
                  <span className="text-xs opacity-75">• Access granted to all 18+ pools</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stakePools.map((pool) => {
            const userStakesInPool = getStakesByPool(pool.id);
            const userTotalInPool = getTotalStakedInPool(pool.id);
            const hasUserStakes = userStakesInPool.length > 0;

            return (
              <div
                key={pool.id}
                className={`bg-gray-900/70 backdrop-blur-md rounded-xl p-6 border hover-glow transition-all duration-300 ${
                  pool.requiresAge18 && !verificationState.isVerified 
                    ? 'border-orange-500/50' 
                    : hasUserStakes
                    ? 'border-green-500/50 bg-gradient-to-br from-gray-900/70 to-green-900/20'
                    : 'border-gray-700/50 hover:border-purple-500/50'
                }`}
              >
                <div className="text-white space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-xl text-white">{pool.name}</h3>
                      {hasUserStakes && (
                        <div className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                          Active
                        </div>
                      )}
                      {pool.requiresAge18 && (
                        <div className="flex items-center gap-1">
                          {verificationState.isVerified ? (
                            <UserCheck size={16} className="text-green-400" title="Age Verified" />
                          ) : (
                            <Lock size={16} className="text-orange-400" title="18+ Verification Required" />
                          )}
                        </div>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(pool.risk)}`}>
                      {pool.risk}
                    </span>
                  </div>
                  
                  {/* User's Stake Info */}
                  {hasUserStakes && (
                    <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-300">Your Stake:</span>
                        <span className="font-bold text-green-200">
                          {userTotalInPool.toFixed(4)} {verificationState.tokenInfo?.symbol || 'TT'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-green-400 mt-1">
                        <span>{userStakesInPool.length} transaction(s)</span>
                        <span>Earning {pool.apy}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* APY and TVL */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <TrendingUp size={16} className="text-green-400" />
                      <span className="text-green-400 font-bold text-lg">{pool.apy}</span>
                      <span className="text-gray-300 text-sm">APY</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield size={16} className="text-blue-400" />
                      <span className="text-blue-400 font-medium">{pool.tvl}</span>
                      <span className="text-gray-300 text-sm">TVL</span>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className="text-gray-200 text-sm leading-relaxed">{pool.description}</p>
                  
                  {/* Age restriction notice */}
                  {pool.requiresAge18 && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg text-xs ${
                      verificationState.isVerified 
                        ? 'bg-green-900/20 text-green-300 border border-green-600/30' 
                        : 'bg-orange-900/20 text-orange-300 border border-orange-600/30'
                    }`}>
                      {verificationState.isVerified ? (
                        <>
                          <UserCheck size={12} />
                          <span>✓ Age verified - Full access granted</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={12} />
                          <span>Age verification required (18+)</span>
                        </>
                      )}
                    </div>
                  )}
                  
                  {/* Staking info */}
                  <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-blue-300">
                      <Coins size={14} />
                      <span className="text-xs font-medium">Smart Contract Staking</span>
                    </div>
                    <p className="text-xs text-blue-200 mt-1">
                      💡 No minimum stake required - Start with any amount
                    </p>
                  </div>
                  
                  {/* Action Button */}
                  <button 
                    onClick={() => handleJoinPool(pool.id)}
                    className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      pool.requiresAge18 && !verificationState.isVerified
                        ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 focus:ring-orange-500'
                        : hasUserStakes
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:ring-green-500'
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:ring-purple-500'
                    }`}
                  >
                    {pool.requiresAge18 && !verificationState.isVerified 
                      ? '🔒 Verify Age (18+) & Stake' 
                      : hasUserStakes
                      ? '💰 Add More Stake'
                      : '🚀 Stake Tokens Now'
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Modals */}
      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => {
          setShowVerificationModal(false);
          setSelectedPoolId(null);
        }}
        onVerificationComplete={handleVerificationComplete}
      />

      {selectedPool && (
        <StakeModal
          isOpen={showStakeModal}
          onClose={handleStakeModalClose}
          poolName={selectedPool.name}
          poolId={selectedPool.id}
          minStake={selectedPool.minStake}
          apy={selectedPool.apy}
        />
      )}
    </>
  );
};

export default StakePools;