import React, { useState } from 'react';
import { Star, TrendingUp } from 'lucide-react';
import ExpandableCard from './ExpandableCard';
import { topPicks, stakePools, hackathons, jobs } from '../data/mockData';
import StakeModal from './StakeModal';
import VerificationModal from './VerificationModal';
import { useVerification } from '../contexts/VerificationContext';
import { EXPECTED_CHAIN_ID, STAKING_CONTRACT_ADDRESS, TOKEN_ADDRESS } from '../config/staking';
import HackathonRegisterModal from './HackathonRegisterModal';

interface TopPicksProps {
  onJoinStakePool?: (poolId: string) => void;
  onJoinHackathon?: (hackathonId: string) => void;
  onApplyJob?: (jobId: string) => void;
}

const TopPicks: React.FC<TopPicksProps> = ({
  onJoinStakePool,
  onJoinHackathon,
  onApplyJob
}) => {
  const { verificationState, setVerified } = useVerification();
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string | null>(null);
  const [hackathonOpen, setHackathonOpen] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'stake-pool': return '◼';
      case 'hackathon': return '▢';
      case 'job': return '▪';
      default: return '■';
    }
  };

  const getFullItem = (pick: any) => {
    switch (pick.type) {
      case 'stake-pool':
        return stakePools.find(pool => pool.id === pick.id);
      case 'hackathon':
        return hackathons.find(hackathon => hackathon.id === pick.id);
      case 'job':
        return jobs.find(job => job.id === pick.id);
      default:
        return null;
    }
  };

  const getExpandedContent = (pick: any, item: any) => {
    if (!item) return <div>Item not found</div>;
    if (pick.type === 'stake-pool') {
      return (
        <div className="space-y-4 text-white">
          <div>
            <h3 className="text-xl font-bold mb-2 futuristic-text">{item.name}</h3>
            <p className="text-gray-300">{item.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-lg accent-ring">
              <div className="text-sm text-gray-300">Annual Percentage Yield</div>
              <div className="text-2xl font-bold">{item.apy}</div>
            </div>
            <div className="bg-white/5 p-4 rounded-lg accent-ring">
              <div className="text-sm text-gray-300">Total Value Locked</div>
              <div className="text-2xl font-bold">{item.tvl}</div>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-300">Risk Level: <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/10 text-white accent-ring">{item.risk}</span></div>
            <div className="text-sm text-gray-300">Min. Stake: <span className="font-medium text-white">{item.minStake}</span></div>
          </div>
        </div>
      );
    }
    if (pick.type === 'hackathon') {
      return (
        <div className="space-y-4 text-white">
          <div>
            <h3 className="text-xl font-bold mb-2 futuristic-text">{item.name}</h3>
            <p className="text-gray-300">{item.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-lg accent-ring">
              <div className="text-sm text-gray-300">Prize Pool</div>
              <div className="text-2xl font-bold">{item.prize}</div>
            </div>
            <div className="bg-white/5 p-4 rounded-lg accent-ring">
              <div className="text-sm text-gray-300">Participants</div>
              <div className="text-2xl font-bold">{item.participants.toLocaleString()}</div>
            </div>
          </div>
          <div className="text-sm text-gray-300">Deadline: <span className="font-medium text-white">{new Date(item.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
          <div>
            <div className="text-sm text-gray-300 mb-2">Tags:</div>
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-white/10 text-white rounded-full text-sm accent-ring">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      );
    }
    // job
    return (
      <div className="space-y-4 text-white">
        <div>
          <h3 className="text-xl font-bold mb-1 futuristic-text">{item.title}</h3>
          <p className="text-lg text-gray-300 mb-2">{item.company}</p>
          <p className="text-gray-300">{item.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 p-4 rounded-lg accent-ring">
            <div className="text-sm text-gray-300">Salary Range</div>
            <div className="text-lg font-bold">{item.salary}</div>
          </div>
          <div className="bg-white/5 p-4 rounded-lg accent-ring">
            <div className="text-sm text-gray-300">Experience Required</div>
            <div className="text-lg font-bold">{item.experience}</div>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-300">Type: <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/10 text-white accent-ring">{item.type}</span></div>
          <div className="text-sm text-gray-300">Location: <span className="font-medium text-white">{item.location}</span></div>
        </div>
      </div>
    );
  };

  const getJoinFunction = (pick: any, item: any) => {
    if (!item) return undefined;
    switch (pick.type) {
      case 'stake-pool':
        // Use the same gating + modal flow as StakePools
        return () => {
          const pool = stakePools.find(p => p.id === item.id);
          if (!pool) return;
          if (pool.requiresAge18 && !verificationState.isVerified) {
            setSelectedPoolId(pool.id);
            setShowVerificationModal(true);
            return;
          }
          setSelectedPoolId(pool.id);
          setShowStakeModal(true);
          // Also allow external handler if provided (analytics, etc.)
          if (onJoinStakePool) onJoinStakePool(pool.id);
        };
      case 'hackathon':
        return () => {
          setSelectedHackathonId(item.id);
          setHackathonOpen(true);
          if (onJoinHackathon) onJoinHackathon(item.id);
        };
      case 'job':
        return onApplyJob ? () => onApplyJob(item.id) : undefined;
      default:
        return undefined;
    }
  };

  const getJoinText = (type: string) => {
    switch (type) {
      case 'stake-pool': return 'Stake Now';
      case 'hackathon': return 'Register Now';
      case 'job': return 'Apply Now';
      default: return 'Join';
    }
  };

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Star className="text-white" />
        <span className="accent-gradient-text">Top Picks</span>
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {topPicks.map((pick) => {
          const item = getFullItem(pick);
          return (
            <ExpandableCard
              key={pick.id}
              className="min-w-[280px] floating-card bg-black/80 rounded-xl p-6 accent-hover"
              expandedContent={getExpandedContent(pick, item)}
              onJoin={getJoinFunction(pick, item)}
              joinText={getJoinText(pick.type)}
            >
              <div className="text-white">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getTypeIcon(pick.type)}</span>
                    <h3 className="font-semibold text-lg futuristic-text">{pick.title}</h3>
                  </div>
                  <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
                    <TrendingUp size={14} className="text-white" />
                    <span className="text-white text-xs font-medium">{pick.highlight}</span>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-4">{pick.description}</p>
                <div className="w-full bg-white/10 hover:bg-white/15 text-white py-2 rounded-lg transition-all duration-300 text-center font-medium accent-hover">
                  View Details
                </div>
              </div>
            </ExpandableCard>
          );
        })}
      </div>

      {/* Modals for stake-pool picks */}
      {selectedPoolId && (
        <StakeModal
          isOpen={showStakeModal}
          onClose={() => { setShowStakeModal(false); setSelectedPoolId(null); }}
          poolName={stakePools.find(p => p.id === selectedPoolId)?.name || 'Stake Pool'}
          poolId={selectedPoolId}
          minStake={stakePools.find(p => p.id === selectedPoolId)?.minStake || '1 tPOL'}
          apy={stakePools.find(p => p.id === selectedPoolId)?.apy || '0%'}
          requiredToken={{ symbol: 'tPOL', address: TOKEN_ADDRESS, decimals: 18 }}
          requiredChainId={EXPECTED_CHAIN_ID}
          stakingContractAddress={STAKING_CONTRACT_ADDRESS}
        />
      )}

      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onVerificationComplete={(success) => {
          setShowVerificationModal(false);
          if (success && selectedPoolId) {
            setVerified(true, 'age');
            setShowStakeModal(true);
          } else if (!success) {
            setSelectedPoolId(null);
          }
        }}
      />

      {/* Hackathon register modal */}
      {selectedHackathonId && (
        <HackathonRegisterModal
          isOpen={hackathonOpen}
          onClose={() => { setHackathonOpen(false); setSelectedHackathonId(null); }}
          hackathonId={selectedHackathonId}
        />
      )}
    </section>
  );
};

export default TopPicks;