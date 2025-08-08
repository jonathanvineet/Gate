import React from 'react';
import { Briefcase, Clock, DollarSign } from 'lucide-react';
import ExpandableCard from './ExpandableCard';
import { jobs } from '../data/mockData';

interface JobsProps {
  onApplyJob: (jobId: string) => void;
}

const Jobs: React.FC<JobsProps> = ({ onApplyJob }) => {
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Briefcase className="text-white" />
        <span className="accent-gradient-text">Jobs</span>
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {jobs.map((job) => (
          <ExpandableCard
            key={job.id}
            className="min-w-[300px] floating-card bg-black/80 rounded-xl p-6 accent-hover"
            onJoin={() => onApplyJob(job.id)}
            joinText="Apply Now"
            expandedContent={
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{job.title}</h3>
                  <p className="text-lg text-gray-300 mb-2">{job.company}</p>
                  <p className="text-gray-300">{job.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black p-4 rounded-lg accent-ring">
                    <div className="text-sm text-gray-400">Salary Range</div>
                    <div className="text-lg font-bold text-white">{job.salary}</div>
                  </div>
                  <div className="bg-black p-4 rounded-lg accent-ring">
                    <div className="text-sm text-gray-400">Experience Required</div>
                    <div className="text-lg font-bold text-white">{job.experience}</div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm text-gray-400">Type: </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white bg-black accent-ring`}>
                      {job.type}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Location: <span className="font-medium text-white">{job.location}</span>
                  </div>
                </div>
              </div>
            }
          >
            <div className="text-white">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="text-white" size={20} />
                  <h3 className="font-semibold text-lg text-white">{job.title}</h3>
                </div>
                <div className="flex items-center gap-1 bg-black px-2 py-1 rounded-full accent-ring">
                  <Clock size={14} className="text-white" />
                  <span className="text-white text-xs font-medium">{job.type}</span>
                </div>
              </div>
              <p className="text-gray-300 text-sm mb-4">{job.description}</p>
              <div className="w-full bg-black text-white py-2 rounded-lg transition-all duration-300 transform hover:scale-105 text-center font-medium accent-hover">
                View Details
              </div>
            </div>
          </ExpandableCard>
        ))}
      </div>
    </section>
  );
};

export default Jobs;