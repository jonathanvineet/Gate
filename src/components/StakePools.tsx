import React from 'react';
import { Coins, TrendingUp, Shield } from 'lucide-react';
import ExpandableCard from './ExpandableCard';
import { stakePools } from '../data/mockData';

interface StakePoolsProps {
  onJoinStakePool: (poolId: string) => void;
}

const StakePools: React.FC<StakePoolsProps> = ({ onJoinStakePool }) => {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'High': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        <Coins className="text-purple-400" />
        Stake Pools
      </h2>
      
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {stakePools.map((pool) => (
          <ExpandableCard
            key={pool.id}
            className="min-w-[300px] bg-gray-900/70 backdrop-blur-md rounded-xl p-6 border border-gray-700/50 hover-glow"
            onJoin={() => onJoinStakePool(pool.id)}
            joinText="Stake Now"
            expandedContent={
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-100 mb-2">{pool.name}</h3>
                  <p className="text-gray-300">{pool.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="text-sm text-gray-400">Annual Percentage Yield</div>
                    <div className="text-2xl font-bold text-green-600">{pool.apy}</div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="text-sm text-gray-400">Total Value Locked</div>
                    <div className="text-2xl font-bold text-blue-600">{pool.tvl}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm text-gray-400">Risk Level: </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(pool.risk)}`}>
                      {pool.risk}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Min. Stake: <span className="font-medium text-gray-200">{pool.minStake}</span>
                  </div>
                </div>
              </div>
            }
          >
            <div className="text-white">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg">{pool.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(pool.risk)}`}>
                  {pool.risk}
                </span>
              </div>
              
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-1">
                  <TrendingUp size={16} className="text-green-400" />
                  <span className="text-green-400 font-bold">{pool.apy}</span>
                  <span className="text-gray-300 text-sm">APY</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield size={16} className="text-blue-400" />
                  <span className="text-blue-400 font-medium">{pool.tvl}</span>
                  <span className="text-gray-300 text-sm">TVL</span>
                </div>
              </div>
              
              <p className="text-gray-200 text-sm mb-4 line-clamp-2">{pool.description}</p>
              
              <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-2 rounded-lg transition-all duration-300 transform hover:scale-105">
                View Details
              </button>
            </div>
          </ExpandableCard>
        ))}
      </div>
    </section>
  );
};

export default StakePools;