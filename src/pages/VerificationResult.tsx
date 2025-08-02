import React from 'react';
import { CheckCircle, User, Calendar, Building, GraduationCap, Trophy, Briefcase } from 'lucide-react';

interface VerificationResultProps {
  verificationType: 'age' | 'hackathon-creator' | 'recruiter';
  onContinue: () => void;
  extractedData?: {
    name?: string;
    age?: string;
    companyName?: string;
    employeeId?: string;
  };
}

const VerificationResult: React.FC<VerificationResultProps> = ({ 
  verificationType, 
  onContinue,
  extractedData 
}) => {
  const getVerificationInfo = () => {
    switch (verificationType) {
      case 'age':
        return {
          title: 'Age Verification Complete',
          description: 'Your age has been successfully verified using your Aadhaar document.',
          icon: <Calendar className="text-green-400" size={48} />,
          benefits: [
            'Access to age-restricted opportunities',
            'Enhanced trust score on the platform',
            'Eligibility for premium stake pools'
          ],
          verifiedInfo: extractedData ? [
            { label: 'Name', value: extractedData.name || 'N/A' },
            { label: 'Age', value: extractedData.age ? `${extractedData.age} years` : 'N/A' }
          ] : []
        };
      case 'hackathon-creator':
        return {
          title: 'Hackathon Creator Verified',
          description: 'You are now verified as a legitimate hackathon organizer.',
          icon: <Trophy className="text-yellow-400" size={48} />,
          benefits: [
            'Create and manage hackathons',
            'Access to participant verification tools',
            'Priority listing in hackathon directory'
          ],
          verifiedInfo: []
        };
      case 'recruiter':
        return {
          title: 'Recruiter Verification Complete',
          description: 'Your recruiter status has been verified. You can now post jobs and access talent pools.',
          icon: <Briefcase className="text-blue-400" size={48} />,
          benefits: [
            'Post job opportunities',
            'Access verified candidate profiles',
            'Priority job listing placement',
            'Advanced candidate filtering tools'
          ],
          verifiedInfo: extractedData ? [
            { label: 'Company', value: extractedData.companyName || 'N/A' },
            { label: 'Employee ID', value: extractedData.employeeId || 'N/A' }
          ] : []
        };
      default:
        return {
          title: 'Verification Complete',
          description: 'Your verification has been completed successfully.',
          icon: <CheckCircle className="text-green-400" size={48} />,
          benefits: [],
          verifiedInfo: []
        };
    }
  };

  const verificationInfo = getVerificationInfo();

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-700/50">
        <div className="text-center">
          <div className="bg-green-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-400" size={32} />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-100 mb-2">{verificationInfo.title}</h1>
          <p className="text-gray-300 mb-6">{verificationInfo.description}</p>
          
          {verificationInfo.verifiedInfo.length > 0 && (
            <div className="bg-gray-800 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                {verificationInfo.icon}
                <h2 className="text-lg font-semibold text-gray-100">Verified Information</h2>
              </div>
              
              <div className="space-y-3 text-left">
                {verificationInfo.verifiedInfo.map((info, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    <span className="text-gray-300">{info.label}:</span>
                    <span className="font-medium text-gray-100">{info.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {verificationInfo.benefits.length > 0 && (
            <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-200 mb-3">What you can do now:</h3>
              <ul className="space-y-2 text-left">
                {verificationInfo.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
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