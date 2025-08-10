import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Calendar, Trophy, Briefcase, Shield } from 'lucide-react';
import { useVerification } from '../contexts/VerificationContext';

interface VerifyAgeDropdownProps {
  onVerificationClick: (type: 'age' | 'hackathon-creator' | 'recruiter') => void;
}

const VerifyAgeDropdown: React.FC<VerifyAgeDropdownProps> = ({ onVerificationClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isTypeVerified } = useVerification();
  const ageVerified = isTypeVerified('age');
  const recruiterVerified = isTypeVerified('recruiter');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const verificationOptions = [
    { id: 'age', label: 'Age Verification', icon: <Calendar size={16} /> },
    { id: 'recruiter', label: 'Recruiter Verification', icon: <Briefcase size={16} /> },
    { id: 'hackathon-creator', label: 'Hackathon Creator', icon: <Trophy size={16} /> }
  ];


  const handleOptionClick = (type: 'age' | 'hackathon-creator' | 'recruiter') => {
    onVerificationClick(type);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 rounded-md transition-all duration-300 flex items-center gap-2 font-semibold transform hover:scale-105 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/25"
      >
        <div className="flex items-center gap-1 mr-1" aria-label="Verification indicators">
          <span
            title="Age status"
            className={`inline-block h-2 w-2 rounded-full ${ageVerified ? 'bg-green-500' : 'bg-gray-500/60'}`}
          />
          <span
            title="Recruiter status"
            className={`inline-block h-2 w-2 rounded-full ${recruiterVerified ? 'bg-green-500' : 'bg-gray-500/60'}`}
          />
        </div>
        <Shield size={16} />
        Verify
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700/50 z-50">
          <div className="p-4">
            <div className="text-sm font-semibold text-gray-300 mb-3">Choose Verification Type</div>
            <div className="space-y-2">
              {verificationOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionClick(option.id as 'age' | 'hackathon-creator' | 'recruiter')}
                  className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3 text-gray-100 rounded-lg"
                >
                  {option.icon}
                  <span className="font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyAgeDropdown;
