import React, { useState } from 'react';
import { Plus, X, Coins, Code, Briefcase, Shield } from 'lucide-react';

interface CreateDropdownProps {
  isConnected: boolean;
  isAgeVerified: boolean;
  isRecruiterVerified: boolean;
  onCreateSelect: (type: 'stake-pool' | 'hackathon' | 'job') => void;
}

const CreateDropdown: React.FC<CreateDropdownProps> = ({ 
  isConnected,
  isAgeVerified,
  isRecruiterVerified,
  onCreateSelect 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (type: 'stake-pool' | 'hackathon' | 'job') => {
    onCreateSelect(type);
    setIsOpen(false);
  };

  if (!isConnected || !isAgeVerified) {
    return (
      <div className="relative">
        <button className="flex items-center gap-2 bg-gray-600 text-gray-300 px-4 py-2 rounded-lg cursor-not-allowed">
          <Plus size={18} />
          <span className="hidden sm:inline">Create</span>
        </button>
        <div className="absolute top-full right-0 mt-1 text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded shadow border border-gray-700">
          <div className="flex items-center gap-1">
            <Shield size={12} className="text-yellow-400" />
            Age verification required
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 futuristic-button hover-glow"
      >
        <Plus size={18} />
        <span className="hidden sm:inline">Create</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700/50 z-50">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-100">Create New</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleSelect('stake-pool')}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-800 rounded-lg transition-colors group"
              >
                <Coins className="text-purple-600 group-hover:scale-110 transition-transform" size={20} />
                <div>
                  <div className="font-medium text-gray-100">Stake Pool</div>
                  <div className="text-sm text-gray-300">Create a new staking pool</div>
                </div>
              </button>

              <button
                onClick={() => handleSelect('hackathon')}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-800 rounded-lg transition-colors group"
              >
                <Code className="text-blue-600 group-hover:scale-110 transition-transform" size={20} />
                <div>
                  <div className="font-medium text-gray-100">Hackathon</div>
                  <div className="text-sm text-gray-300">Host a coding competition</div>
                </div>
              </button>

              <button
                onClick={() => isRecruiterVerified && handleSelect('job')}
                className={`w-full flex items-center gap-3 p-3 text-left rounded-lg transition-colors group ${isRecruiterVerified ? 'hover:bg-gray-800' : 'opacity-50 cursor-not-allowed'}`}
                disabled={!isRecruiterVerified}
                title={isRecruiterVerified ? undefined : 'Recruiter verification required'}
              >
                <Briefcase className="text-green-600 group-hover:scale-110 transition-transform" size={20} />
                <div>
                  <div className="font-medium text-gray-100 flex items-center gap-2">
                    Job
                    {!isRecruiterVerified && (
                      <span className="text-[10px] text-yellow-300 bg-yellow-900/30 border border-yellow-700 px-1 py-0.5 rounded">Recruiter required</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-300">Post a job opening</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateDropdown;