import React from 'react';
import { Code, Users, Trophy } from 'lucide-react';
import ExpandableCard from './ExpandableCard';
import { hackathons } from '../data/mockData';

interface HackathonsProps {
  onJoinHackathon: (hackathonId: string) => void;
}

const Hackathons: React.FC<HackathonsProps> = ({ onJoinHackathon }) => {
  const getDifficultyColor = (_difficulty: string) => 'text-white bg-black';
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Code className="text-white" />
        <span className="accent-gradient-text">Hackathons</span>
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {hackathons.map((hackathon) => (
          <ExpandableCard
            key={hackathon.id}
            className="min-w-[300px] floating-card bg-black/80 rounded-xl p-6 accent-hover"
            onJoin={() => onJoinHackathon(hackathon.id)}
            joinText="Register Now"
            expandedContent={
              <div className="space-y-4 text-white">
                <div>
                  <h3 className="text-xl font-bold mb-2 futuristic-text">{hackathon.name}</h3>
                  <p className="text-gray-300">{hackathon.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 p-4 rounded-lg accent-ring">
                    <div className="text-sm text-gray-300">Prize Pool</div>
                    <div className="text-2xl font-bold">{hackathon.prize}</div>
                  </div>
                  <div className="bg-white/10 p-4 rounded-lg accent-ring">
                    <div className="text-sm text-gray-300">Participants</div>
                    <div className="text-2xl font-bold">{hackathon.participants.toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm text-gray-300">Difficulty: </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(hackathon.difficulty)}`}>{hackathon.difficulty}</span>
                  </div>
                  <div className="text-sm text-gray-300">Deadline: <span className="font-medium text-white">{formatDate(hackathon.deadline)}</span></div>
                </div>
                <div>
                  <div className="text-sm text-gray-300 mb-2">Tags:</div>
                  <div className="flex flex-wrap gap-2">
                    {hackathon.tags.map((tag: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-white/10 text-white rounded-full text-sm accent-ring">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            }
          >
            <div className="text-white">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="text-white" size={20} />
                  <h3 className="font-semibold text-lg futuristic-text">{hackathon.name}</h3>
                </div>
                <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
                  <Users size={14} className="text-white" />
                  <span className="text-white text-xs font-medium">{hackathon.participants}</span>
                </div>
              </div>
              <p className="text-gray-300 text-sm mb-4">{hackathon.description}</p>
              <div className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg transition-all duration-300 transform hover:scale-105 text-center font-medium accent-hover">
                View Details
              </div>
            </div>
          </ExpandableCard>
        ))}
      </div>
    </section>
  );
};

export default Hackathons;