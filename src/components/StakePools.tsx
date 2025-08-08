import React, { useState } from 'react';
import { Coins, TrendingUp, Shield, UserCheck, Calendar } from 'lucide-react';
import ExpandableCard from './ExpandableCard';
import VerificationModal from './VerificationModal';
import StakeModal from './StakeModal';
import { stakePools } from '../data/mockData';
import { useVerification } from '../contexts/VerificationContext';

interface StakePoolsProps {
  onJoinStakePool: (poolId: string) => void;
}

const StakePools: React.FC<StakePoolsProps> = ({ onJoinStakePool }) => {
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const { verificationState, setVerified } = useVerification();

  const getRiskColor = (_risk: string) => 'text-white bg-black';

  const handleJoinPool = (poolId: string) => {
    // Emit parent callback for external tracking/side-effects
    try {
      onJoinStakePool?.(poolId);
    } catch (_) {
      // no-op if not provided
    }

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
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Coins className="text-white" />
        <span className="accent-gradient-text">Stake Pools</span>
      </h2>
      
      {/* Global verification status banner */}
      {verificationState.isVerified && (
        <div className="mb-6 bg-black border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <UserCheck className="text-white" size={20} />
            <div>
              <p className="text-white font-medium">Age Verification Complete ✓</p>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Calendar size={14} />
                <span>Verified on {formatVerificationDate(verificationState.verificationDate)}</span>
                <span className="text-xs opacity-75">• Access granted to all 18+ pools</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {stakePools.map((pool) => (
          <ExpandableCard
            key={pool.id}
            className="floating-card bg-black/80 rounded-xl p-6 accent-hover"
            expandedContent={
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-xl text-white">{pool.name}</h3>
                  <p className="text-gray-300">{pool.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black p-4 rounded-lg accent-ring">
                    <div className="text-sm text-gray-400">Annual Percentage Yield</div>
                    <div className="text-2xl font-bold text-white">{pool.apy}</div>
                  </div>
                  <div className="bg-black p-4 rounded-lg accent-ring">
                    <div className="text-sm text-gray-400">Total Value Locked</div>
                    <div className="text-2xl font-bold text-white">{pool.tvl}</div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm text-gray-400">Risk Level: </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium accent-ring ${getRiskColor(pool.risk)}`}>{pool.risk}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Min. Stake: <span className="font-medium text-white">{pool.minStake}</span>
                  </div>
                </div>
              </div>
            }
            onJoin={() => handleJoinPool(pool.id)}
            joinText="Stake Now"
          >
            <div className="text-white">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="text-white" size={20} />
                  <h3 className="font-semibold text-lg text-white">{pool.name}</h3>
                </div>
                <div className="flex items-center gap-1 bg-black px-2 py-1 rounded-full">
                  <TrendingUp size={14} className="text-white" />
                  <span className="text-white text-xs font-medium">{pool.apy}</span>
                </div>
              </div>
              <p className="text-gray-300 text-sm mb-4">{pool.description}</p>
              <div className="w-full bg-black text-white py-2 rounded-lg transition-all duration-300 text-center font-medium accent-hover">
                View Details
              </div>
            </div>
          </ExpandableCard>
        ))}
      </div>
      
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
    </section>
  );
};

export default StakePools;