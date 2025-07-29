import React, { useState } from 'react';
import { Zap, CheckCircle } from 'lucide-react';
import VerifyDropdown from './VerifyDropdown';
import CreateDropdown from './CreateDropdown';
import WalletConnection from './WalletConnection';
import { User } from '../types';
import VerificationModal from './VerificationModal';

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
  const [isVerificationComplete, setIsVerificationComplete] = useState(false);

  const handleVerificationClick = () => {
    if (!isVerificationComplete) {
      setIsVerificationModalOpen(true);
    }
  };

  const handleVerificationComplete = (success: boolean) => {
    if (success) {
      setIsVerificationComplete(true);
      console.log('Verification successful!');
    } else {
      console.log('Verification failed!');
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
              <button
                onClick={handleVerificationClick}
                className={`px-4 py-2 rounded-md transition-all duration-300 flex items-center gap-2 font-semibold ${
                  isVerificationComplete 
                    ? 'bg-green-500 hover:bg-green-600 text-white cursor-default shadow-lg shadow-green-500/25' 
                    : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25'
                }`}
                disabled={isVerificationComplete}
              >
                {isVerificationComplete ? (
                  <>
                    <CheckCircle size={16} />
                    Verified
                  </>
                ) : (
                  'Verify'
                )}
              </button>
              
              <VerifyDropdown
                isConnected={user.isConnected}
                isVerified={user.isVerified}
                onVerify={onVerify}
              />
              
              <CreateDropdown
                isConnected={user.isConnected}
                isVerified={user.isVerified}
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