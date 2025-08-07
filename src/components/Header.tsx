import React, { useState, useEffect } from 'react';
import { Zap, CheckCircle } from 'lucide-react';
import VerifyDropdown from './VerifyDropdown';
import CreateDropdown from './CreateDropdown';
import WalletConnection from './WalletConnection';
import VerifyAgeDropdown from './VerifyAgeDropdown';
import { User } from '../types';
import VerificationModal from './VerificationModal';
import RecruiterVerificationModal from './RecruiterVerificationModal';
import { useVerification } from '../contexts/VerificationContext';

interface HeaderProps {
  user: User;
  onWalletConnect: () => void;
  onWalletDisconnect: () => void;
  onVerify: (type: 'age' | 'hackathon-creator' | 'recruiter', proof: File) => void;
  onCreateSelect: (type: 'stake-pool' | 'hackathon' | 'job') => void;
}

const Header: React.FC<HeaderProps> = ({
  user,
  onWalletConnect,
  onWalletDisconnect,
  onVerify,
  onCreateSelect
}) => {
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [selectedVerificationType, setSelectedVerificationType] = useState<'age' | 'hackathon-creator' | 'recruiter'>('age');
  const { verificationState, setVerified, clearVerification } = useVerification();

  const handleVerificationClick = (type: 'age' | 'hackathon-creator' | 'recruiter') => {
    if (!verificationState.isVerified) {
      setSelectedVerificationType(type);
      setIsVerificationModalOpen(true);
    }
  };

  const handleVerificationComplete = (success: boolean, details?: any) => {
    if (success) {
      setVerified(true, selectedVerificationType);
      console.log('Header: Verification successful - global state updated!', details);
    } else {
      console.log('Header: Verification failed!', details);
    }
    // Close the modal after verification
    setIsVerificationModalOpen(false);
  };

  // Debug function to clear verification
  const handleClearVerification = () => {
    if (window.confirm('Clear verification status?')) {
      clearVerification();
    }
  };

  return (
    <>
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-xl">
                <Zap className="text-white pulse-glow" size={24} />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent animated-gradient futuristic-glow">
                CryptoSpace
              </h1>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3">
              {/* Verify Dropdown */}
              <VerifyAgeDropdown
                isVerified={verificationState.isVerified}
                verificationDate={verificationState.verificationDate}
                onVerificationClick={handleVerificationClick}
              />

              {/* Development Debug Button */}
              {process.env.NODE_ENV === 'development' && verificationState.isVerified && (
                <button
                  onClick={handleClearVerification}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                  title="Clear verification (dev only)"
                >
                  Clear
                </button>
              )}
              
              <VerifyDropdown
                isConnected={user.isConnected}
                isVerified={verificationState.isVerified}
                onVerify={onVerify}
              />
              
              <CreateDropdown
                isConnected={user.isConnected}
                isVerified={verificationState.isVerified}
                onCreateSelect={onCreateSelect}
              />

              <WalletConnection
                isConnected={user.isConnected}
                onConnect={onWalletConnect}
                onDisconnect={onWalletDisconnect}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Verification Modals */}
      {selectedVerificationType === 'recruiter' ? (
        <RecruiterVerificationModal
          isOpen={isVerificationModalOpen}
          onClose={() => setIsVerificationModalOpen(false)}
          onVerificationComplete={handleVerificationComplete}
          companyName="TechCorp Solutions"
        />
      ) : (
        <VerificationModal
          isOpen={isVerificationModalOpen}
          onClose={() => setIsVerificationModalOpen(false)}
          onVerificationComplete={handleVerificationComplete}
        />
      )}
    </>
  );
};

export default Header;