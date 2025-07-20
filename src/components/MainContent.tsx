import React from 'react';
import TopPicks from './TopPicks';
import StakePools from './StakePools';
import Hackathons from './Hackathons';
import Jobs from './Jobs';

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
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <TopPicks />
      <StakePools onJoinStakePool={onJoinStakePool} />
      <Hackathons onJoinHackathon={onJoinHackathon} />
      <Jobs onApplyJob={onApplyJob} />
    </main>
  );
};

export default MainContent;