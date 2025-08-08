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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Tab Navigation */}
    <div className="flex items-center gap-1 mb-6 bg-black rounded-xl p-1 border border-gray-800">
        <button
          onClick={() => setActiveTab('pools')}
      className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'pools'
        ? 'bg-black text-white shadow-lg tab-active accent-gradient-text'
              : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-black'
          }`}
        >
          Pools & Opportunities
        </button>
        <button
          onClick={() => setActiveTab('activity')}
      className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'activity'
        ? 'bg-black text-white shadow-lg tab-active accent-gradient-text'
              : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-black'
          }`}
        >
          Your Activity
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'pools' ? (
        <>
          <section className="glow-section mb-8">
            <div className="snap-x snap-mandatory overflow-x-auto pb-2 -mx-1 px-1">
              <TopPicks onJoinHackathon={onJoinHackathon} onApplyJob={onApplyJob} onJoinStakePool={onJoinStakePool} />
            </div>
          </section>

          <section className="quiet-section mb-8">
            <StakePools onJoinStakePool={onJoinStakePool} />
          </section>

          <section className="glow-section mb-8">
            <div className="snap-x snap-mandatory overflow-x-auto pb-2 -mx-1 px-1">
              <Hackathons onJoinHackathon={onJoinHackathon} />
            </div>
          </section>

          <section className="glow-section">
            <Jobs onApplyJob={onApplyJob} />
          </section>
        </>
      ) : (
        <ActivityDashboard />
      )}
    </main>
  );
};

export default MainContent;