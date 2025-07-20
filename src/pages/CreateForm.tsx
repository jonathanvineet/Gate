import React, { useState } from 'react';
import { ArrowLeft, Upload } from 'lucide-react';

interface CreateFormProps {
  type: 'stake-pool' | 'hackathon' | 'job';
  onSubmit: (data: any) => void;
  onBack: () => void;
}

const CreateForm: React.FC<CreateFormProps> = ({ type, onSubmit, onBack }) => {
  const [formData, setFormData] = useState<any>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const renderForm = () => {
    switch (type) {
      case 'stake-pool':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Pool Name</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-800 text-gray-100 placeholder-gray-400"
                placeholder="Enter pool name"
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Expected APY (%)</label>
              <input
                type="number"
                className="w-full p-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-800 text-gray-100 placeholder-gray-400"
                placeholder="Enter expected APY"
                onChange={(e) => setFormData({...formData, apy: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Risk Level</label>
              <select
                className="w-full p-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-800 text-gray-100"
                onChange={(e) => setFormData({...formData, risk: e.target.value})}
              >
                <option value="">Select risk level</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Minimum Stake</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-800 text-gray-100 placeholder-gray-400"
                placeholder="e.g., 100 USDC"
                onChange={(e) => setFormData({...formData, minStake: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Description</label>
              <textarea
                rows={4}
                className="w-full p-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-800 text-gray-100 placeholder-gray-400"
                placeholder="Describe your stake pool strategy"
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </div>
        );

      case 'hackathon':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Hackathon Name</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-gray-100 placeholder-gray-400"
                placeholder="Enter hackathon name"
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Prize Pool</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-gray-100 placeholder-gray-400"
                placeholder="e.g., $50,000"
                onChange={(e) => setFormData({...formData, prize: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Deadline</label>
              <input
                type="date"
                className="w-full p-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-gray-100"
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Difficulty Level</label>
              <select
                className="w-full p-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-gray-100"
                onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
              >
                <option value="">Select difficulty</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Tags (comma-separated)</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-gray-100 placeholder-gray-400"
                placeholder="e.g., DeFi, NFTs, DAOs"
                onChange={(e) => setFormData({...formData, tags: e.target.value.split(',').map(tag => tag.trim())})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Description</label>
              <textarea
                rows={4}
                className="w-full p-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-gray-100 placeholder-gray-400"
                placeholder="Describe your hackathon challenge"
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </div>
        );

      case 'job':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Job Title</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-800 text-gray-100 placeholder-gray-400"
                placeholder="Enter job title"
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Company Name</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-800 text-gray-100 placeholder-gray-400"
                placeholder="Enter company name"
                onChange={(e) => setFormData({...formData, company: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Salary Range</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-800 text-gray-100 placeholder-gray-400"
                placeholder="e.g., $120k - $180k"
                onChange={(e) => setFormData({...formData, salary: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Location</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-800 text-gray-100 placeholder-gray-400"
                placeholder="e.g., Remote, San Francisco, CA"
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Job Type</label>
              <select
                className="w-full p-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-800 text-gray-100"
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="">Select job type</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Experience Required</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-800 text-gray-100 placeholder-gray-400"
                placeholder="e.g., 3+ years"
                onChange={(e) => setFormData({...formData, experience: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Job Description</label>
              <textarea
                rows={4}
                className="w-full p-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-800 text-gray-100 placeholder-gray-400"
                placeholder="Describe the job responsibilities and requirements"
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </div>
        );
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'stake-pool': return 'Create Stake Pool';
      case 'hackathon': return 'Create Hackathon';
      case 'job': return 'Post Job';
    }
  };

  const getGradient = () => {
    switch (type) {
      case 'stake-pool': return 'from-purple-600 to-blue-600';
      case 'hackathon': return 'from-blue-600 to-cyan-600';
      case 'job': return 'from-green-600 to-teal-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white hover:text-gray-300 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-gray-700/50">
          <h1 className="text-3xl font-bold text-gray-100 mb-6">{getTitle()}</h1>
          
          <form onSubmit={handleSubmit}>
            {renderForm()}
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-200 mb-2">Upload Supporting Documents (Optional)</label>
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-gray-600 transition-colors">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p className="text-sm text-gray-300">Drag and drop files here, or click to browse</p>
                <input type="file" className="hidden" multiple />
              </div>
            </div>
            
            <button
              type="submit"
              className={`w-full mt-6 bg-gradient-to-r ${getGradient()} hover:opacity-90 text-white py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105`}
            >
              Submit {getTitle().split(' ')[1]}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateForm;