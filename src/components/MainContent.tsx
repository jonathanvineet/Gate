import React, { useState } from 'react';
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
  const [userVerified, setUserVerified] = useState(false);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <TopPicks />
      <StakePools onJoinStakePool={onJoinStakePool} isUserVerified={userVerified} />
      <Hackathons onJoinHackathon={onJoinHackathon} isUserVerified={userVerified} />
      <Jobs onApplyJob={onApplyJob} isUserVerified={userVerified} />
    </main>
  );
};

export default MainContent;