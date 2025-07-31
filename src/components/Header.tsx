import React, { useState, useEffect } from 'react';
import { Zap, CheckCircle } from 'lucide-react';
import VerifyDropdown from './VerifyDropdown';
import CreateDropdown from './CreateDropdown';
import WalletConnection from './WalletConnection';
import { User } from '../types';
import VerificationModal from './VerificationModal';
import { useVerification } from '../contexts/VerificationContext';

interface HeaderProps {
  user: User;
  onWalletConnect: () => void;
  onWalletDisconnect: () => void;
  onVerify: (type: 'age' | 'hackathon-creator' | 'recruiter', proof: File) => void;
  onCreateSelect: (type: 'stake-pool' | 'hackathon' | 'job') => void;
  onGetCredentials: () => void;
}

const Header: React.FC<HeaderProps> = ({
  user,
  onWalletConnect,
  onWalletDisconnect,
  onVerify,
  onCreateSelect,
  onGetCredentials
}) => {
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const { verificationState, setVerified, clearVerification } = useVerification();

  const handleVerificationClick = () => {
    if (!verificationState.isVerified) {
      setIsVerificationModalOpen(true);
    }
  };

  const handleVerificationComplete = (success: boolean) => {
    if (success) {
      setVerified(true, 'age');
      console.log('Header: Verification successful - global state updated!');
    } else {
      console.log('Header: Verification failed!');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
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
              {/* Global Verification Status Button */}
              <button
                onClick={handleVerificationClick}
                className={`px-4 py-2 rounded-md transition-all duration-300 flex items-center gap-2 font-semibold transform hover:scale-105 ${
                  verificationState.isVerified 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white cursor-default shadow-lg shadow-green-500/25 animate-pulse' 
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/25'
                }`}
                disabled={verificationState.isVerified}
              >
                {verificationState.isVerified ? (
                  <>
                    <CheckCircle size={16} className="animate-bounce" />
                    <div className="flex flex-col items-start">
                      <span className="text-sm">Age Verified ✓</span>
                      {verificationState.verificationDate && (
                        <span className="text-xs opacity-80">
                          {formatDate(verificationState.verificationDate)}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  'Verify Age'
                )}
              </button>

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

      <VerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        onVerificationComplete={handleVerificationComplete}
      />
    </>
  );
};

export default Header;