import React from 'react';
import { Briefcase, MapPin, Clock, DollarSign } from 'lucide-react';
import ExpandableCard from './ExpandableCard';
import { jobs } from '../data/mockData';

interface JobsProps {
  onApplyJob: (jobId: string) => void;
}

const Jobs: React.FC<JobsProps> = ({ onApplyJob }) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Full-time': return 'text-blue-600 bg-blue-100';
      case 'Part-time': return 'text-green-600 bg-green-100';
      case 'Contract': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        <Briefcase className="text-green-400" />
        Jobs
      </h2>
      
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {jobs.map((job) => (
          <ExpandableCard
            key={job.id}
            className="min-w-[300px] bg-gray-900/70 backdrop-blur-md rounded-xl p-6 border border-gray-700/50 hover-glow"
            onJoin={() => onApplyJob(job.id)}
            joinText="Apply Now"
            expandedContent={
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-100 mb-1">{job.title}</h3>
                  <p className="text-lg text-gray-300 mb-2">{job.company}</p>
                  <p className="text-gray-300">{job.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="text-sm text-gray-400">Salary Range</div>
                    <div className="text-lg font-bold text-green-600">{job.salary}</div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="text-sm text-gray-400">Experience Required</div>
                    <div className="text-lg font-bold text-blue-600">{job.experience}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm text-gray-400">Type: </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(job.type)}`}>
                      {job.type}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Location: <span className="font-medium text-gray-200">{job.location}</span>
                  </div>
                </div>
              </div>
            }
          >
            <div className="text-white">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg">{job.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(job.type)}`}>
                  {job.type}
                </span>
              </div>
              
              <p className="text-gray-300 text-lg mb-3">{job.company}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-green-400" />
                  <span className="text-green-300 font-medium">{job.salary}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-blue-400" />
                  <span className="text-blue-300">{job.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-purple-400" />
                  <span className="text-purple-300">{job.experience}</span>
                </div>
              </div>
              
              <p className="text-gray-200 text-sm mb-4 line-clamp-2">{job.description}</p>
              
              <button className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white py-2 rounded-lg transition-all duration-300 transform hover:scale-105">
                View Details
              </button>
            </div>
          </ExpandableCard>
        ))}
      </div>
    </section>
  );
};

export default Jobs;