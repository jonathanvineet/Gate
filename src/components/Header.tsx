import React, { useState } from 'react';
import { Crown, Shield } from 'lucide-react';
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
  const { verificationState, setVerified, clearVerification, isTypeVerified } = useVerification();

  const handleVerificationClick = (type: 'age' | 'hackathon-creator' | 'recruiter') => {
    if (!isTypeVerified(type)) {
      setSelectedVerificationType(type);
      setIsVerificationModalOpen(true);
    }
  };

  const handleVerificationComplete = (success: boolean, details?: unknown) => {
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
  <header className="bg-black/70 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-black p-2 rounded-xl relative">
                  <Crown className="text-white" size={24} />
                  <Shield className="text-white/80 absolute -right-1 -bottom-1" size={12} />
              </div>
              <h1 className="text-2xl font-bold accent-gradient-text">CheqMate</h1>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-wrap md:flex-nowrap justify-end">
              {/* Verify Dropdown */}
              <VerifyAgeDropdown onVerificationClick={handleVerificationClick} />

              {/* Development Debug Button */}
              {process.env.NODE_ENV === 'development' && verificationState.isVerified && (
                <button
                  onClick={handleClearVerification}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors hidden sm:inline-flex"
                  title="Clear verification (dev only)"
                >
                  Clear
                </button>
              )}
              
              <div className="accent-hover rounded-lg focus-ring">
                <VerifyDropdown
                isConnected={user.isConnected}
                isVerified={verificationState.isVerified}
                onVerify={onVerify}
                />
              </div>
              
              <div className="accent-hover rounded-lg focus-ring">
                <CreateDropdown
                isConnected={user.isConnected}
                isAgeVerified={isTypeVerified('age')}
                isRecruiterVerified={isTypeVerified('recruiter')}
                onCreateSelect={onCreateSelect}
                />
              </div>

              <WalletConnection
                isConnected={user.isConnected}
                onConnect={onWalletConnect}
                onDisconnect={onWalletDisconnect}
              />

              {/* DEX API button removed per request */}
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