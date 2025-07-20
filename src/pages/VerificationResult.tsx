import React from 'react';
import { CheckCircle, User, Calendar, Building, GraduationCap } from 'lucide-react';

interface VerificationResultProps {
  verificationType: 'age' | 'hackathon-creator' | 'recruiter';
  onContinue: () => void;
}

const VerificationResult: React.FC<VerificationResultProps> = ({ 
  verificationType, 
  onContinue 
}) => {
  const getMockData = () => {
    switch (verificationType) {
      case 'age':
        return {
          icon: <Calendar className="text-blue-600" size={24} />,
          title: 'Age Verification Complete',
          name: 'Alex Johnson',
          detail: 'Birthday: March 15, 1995',
          detailLabel: 'Date of Birth'
        };
      case 'recruiter':
        return {
          icon: <Building className="text-green-600" size={24} />,
          title: 'Recruiter Verification Complete',
          name: 'Sarah Chen',
          detail: 'TechCorp Solutions',
          detailLabel: 'Company'
        };
      case 'hackathon-creator':
        return {
          icon: <GraduationCap className="text-purple-600" size={24} />,
          title: 'Hackathon Creator Verification Complete',
          name: 'Michael Rodriguez',
          detail: 'Stanford University',
          detailLabel: 'Institution'
        };
    }
  };

  const mockData = getMockData();

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-700/50">
        <div className="text-center">
          <div className="bg-green-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-400" size={32} />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-100 mb-2">{mockData.title}</h1>
          <p className="text-gray-300 mb-6">Your identity has been successfully verified.</p>
          
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              {mockData.icon}
              <h2 className="text-lg font-semibold text-gray-100">Verified Information</h2>
            </div>
            
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-400" />
                <span className="text-gray-300">Name:</span>
                <span className="font-medium text-gray-100">{mockData.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {mockData.icon}
                <span className="text-gray-300">{mockData.detailLabel}:</span>
                <span className="font-medium text-gray-100">{mockData.detail}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={onContinue}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationResult;