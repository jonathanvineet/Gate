import React, { useState } from 'react';
import TopPicks from './TopPicks';
import StakePools from './StakePools';
import Hackathons from './Hackathons';
import Jobs from './Jobs';
import ActivityDashboard from './ActivityDashboard';

interface MainContentProps {
  onJoinStakePool: (poolId: string) => void;
  onJoinHackathon: (hackathonId: string) => void;
  onApplyJob: (jobId: string) => void;
}

const MainContent: React.FC<MainContentProps> = ({
  onJoinStakePool,
  onJoinHackathon,
  onApplyJob
}) => {
  const [activeTab, setActiveTab] = useState<'pools' | 'activity'>('pools');

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 mb-8 bg-white/5 backdrop-blur-sm rounded-xl p-1">
        <button
          onClick={() => setActiveTab('pools')}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'pools'
              ? 'bg-white/10 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Pools & Opportunities
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'activity'
              ? 'bg-white/10 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Your Activity
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'pools' ? (
        <>
          <TopPicks />
          <StakePools onJoinStakePool={onJoinStakePool} />
          <Hackathons onJoinHackathon={onJoinHackathon} />
          <Jobs onApplyJob={onApplyJob} />
        </>
      ) : (
        <ActivityDashboard />
      )}
    </main>
  );
};

export default MainContent;