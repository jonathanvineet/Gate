import React from 'react';
import { Star, TrendingUp, Coins, Trophy, Users, Calendar, DollarSign, MapPin, Clock, Shield } from 'lucide-react';
import ExpandableCard from './ExpandableCard';
import { topPicks, stakePools, hackathons, jobs } from '../data/mockData';

interface TopPicksProps {
  onJoinStakePool: (poolId: string) => void;
  onJoinHackathon: (hackathonId: string) => void;
  onApplyJob: (jobId: string) => void;
}

const TopPicks: React.FC<TopPicksProps> = ({
  onJoinStakePool,
  onJoinHackathon,
  onApplyJob
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'stake-pool': return '🪙';
      case 'hackathon': return '⚡';
      case 'job': return '💼';
      default: return '⭐';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'stake-pool': return 'from-purple-600 to-blue-600';
      case 'hackathon': return 'from-blue-600 to-cyan-600';
      case 'job': return 'from-green-600 to-teal-600';
      default: return 'from-gray-600 to-gray-700';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'High': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-600 bg-green-100';
      case 'Intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'Advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeColor2 = (type: string) => {
    switch (type) {
      case 'Full-time': return 'text-blue-600 bg-blue-100';
      case 'Part-time': return 'text-green-600 bg-green-100';
      case 'Contract': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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

    switch (pick.type) {
      case 'stake-pool':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-gray-100 mb-2">{item.name}</h3>
              <p className="text-gray-300">{item.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Annual Percentage Yield</div>
                <div className="text-2xl font-bold text-green-600">{item.apy}</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Total Value Locked</div>
                <div className="text-2xl font-bold text-blue-600">{item.tvl}</div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm text-gray-400">Risk Level: </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(item.risk)}`}>
                  {item.risk}
                </span>
              </div>
              <div className="text-sm text-gray-400">
                Min. Stake: <span className="font-medium text-gray-200">{item.minStake}</span>
              </div>
            </div>
          </div>
        );

      case 'hackathon':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-gray-100 mb-2">{item.name}</h3>
              <p className="text-gray-300">{item.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Prize Pool</div>
                <div className="text-2xl font-bold text-green-600">{item.prize}</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Participants</div>
                <div className="text-2xl font-bold text-blue-600">{item.participants.toLocaleString()}</div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm text-gray-400">Difficulty: </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(item.difficulty)}`}>
                  {item.difficulty}
                </span>
              </div>
              <div className="text-sm text-gray-400">
                Deadline: <span className="font-medium text-gray-200">{formatDate(item.deadline)}</span>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-400 mb-2">Tags:</div>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      case 'job':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-gray-100 mb-1">{item.title}</h3>
              <p className="text-lg text-gray-300 mb-2">{item.company}</p>
              <p className="text-gray-300">{item.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Salary Range</div>
                <div className="text-lg font-bold text-green-600">{item.salary}</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Experience Required</div>
                <div className="text-lg font-bold text-blue-600">{item.experience}</div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm text-gray-400">Type: </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor2(item.type)}`}>
                  {item.type}
                </span>
              </div>
              <div className="text-sm text-gray-400">
                Location: <span className="font-medium text-gray-200">{item.location}</span>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Unknown item type</div>;
    }
  };

  const getJoinFunction = (pick: any, item: any) => {
    if (!item) return undefined;

    switch (pick.type) {
      case 'stake-pool':
        return () => onJoinStakePool(item.id);
      case 'hackathon':
        return () => onJoinHackathon(item.id);
      case 'job':
        return () => onApplyJob(item.id);
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
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2 futuristic-glow">
        <Star className="text-yellow-400 pulse-glow" />
        Top Picks
      </h2>
      
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {topPicks.map((pick) => {
          const item = getFullItem(pick);
          
          return (
            <ExpandableCard
              key={pick.id}
              className="min-w-[280px] bg-gray-900/70 backdrop-blur-md rounded-xl p-6 border border-gray-700/50 hover-glow transition-all duration-300"
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
                  <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-full pulse-glow">
                    <TrendingUp size={14} className="text-yellow-400" />
                    <span className="text-yellow-400 text-xs font-medium">{pick.highlight}</span>
                  </div>
                </div>
                
                <p className="text-gray-200 text-sm mb-4">{pick.description}</p>
                
                <div className={`w-full bg-gradient-to-r ${getTypeColor(pick.type)} hover:opacity-90 text-white py-2 rounded-lg transition-all duration-300 transform hover:scale-105 text-center font-medium futuristic-button`}>
                  View Details
                </div>
              </div>
            </ExpandableCard>
          );
        })}
      </div>
    </section>
  );
};

export default TopPicks;