import React from 'react';
import { Code, Calendar, Users, Trophy } from 'lucide-react';
import ExpandableCard from './ExpandableCard';
import { hackathons } from '../data/mockData';

interface HackathonsProps {
  onJoinHackathon: (hackathonId: string) => void;
}

const Hackathons: React.FC<HackathonsProps> = ({ onJoinHackathon }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-600 bg-green-100';
      case 'Intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'Advanced': return 'text-red-600 bg-red-100';
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

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        <Code className="text-blue-400" />
        Hackathons
      </h2>
      
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {hackathons.map((hackathon) => (
          <ExpandableCard
            key={hackathon.id}
            className="min-w-[300px] bg-gray-900/70 backdrop-blur-md rounded-xl p-6 border border-gray-700/50 hover-glow"
            onJoin={() => onJoinHackathon(hackathon.id)}
            joinText="Register Now"
            expandedContent={
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-100 mb-2">{hackathon.name}</h3>
                  <p className="text-gray-300">{hackathon.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="text-sm text-gray-400">Prize Pool</div>
                    <div className="text-2xl font-bold text-green-600">{hackathon.prize}</div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="text-sm text-gray-400">Participants</div>
                    <div className="text-2xl font-bold text-blue-600">{hackathon.participants.toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm text-gray-400">Difficulty: </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(hackathon.difficulty)}`}>
                      {hackathon.difficulty}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Deadline: <span className="font-medium text-gray-200">{formatDate(hackathon.deadline)}</span>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-2">Tags:</div>
                  <div className="flex flex-wrap gap-2">
                    {hackathon.tags.map((tag, index) => (
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
            }
          >
            <div className="text-white">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg">{hackathon.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(hackathon.difficulty)}`}>
                  {hackathon.difficulty}
                </span>
              </div>
              
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-1">
                  <Trophy size={16} className="text-yellow-400" />
                  <span className="text-yellow-400 font-bold">{hackathon.prize}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users size={16} className="text-green-400" />
                  <span className="text-green-400 font-medium">{hackathon.participants}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1 mb-4">
                <Calendar size={16} className="text-red-400" />
                <span className="text-red-300 text-sm">Deadline: {formatDate(hackathon.deadline)}</span>
              </div>
              
              <p className="text-gray-200 text-sm mb-4 line-clamp-2">{hackathon.description}</p>
              
              <button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-2 rounded-lg transition-all duration-300 transform hover:scale-105">
                View Details
              </button>
            </div>
          </ExpandableCard>
        ))}
      </div>
    </section>
  );
};

export default Hackathons;