/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import Header from './components/Header';
import MainContent from './components/MainContent';
import InteractiveBackground from './components/InteractiveBackground';
import VerificationResult from './pages/VerificationResult';
import CreateForm from './pages/CreateForm';
import Placeholder from './pages/Placeholder';
import { User } from './types';

type AppState = 
  | 'dashboard' 
  | 'verification-result' 
  | 'create-form' 
  | 'placeholder';

function App() {
  const [user, setUser] = useState<User>({
    id: '',
    address: '',
    isConnected: false,
    isVerified: false
  });

  const [appState, setAppState] = useState<AppState>('dashboard');
  const [verificationType, setVerificationType] = useState<'age' | 'hackathon-creator' | 'recruiter'>('age');
  const [createType, setCreateType] = useState<'stake-pool' | 'hackathon' | 'job'>('stake-pool');
  const [placeholderData, setPlaceholderData] = useState({ title: '', message: '' });

  const handleWalletConnect = () => {
    setUser({
      ...user,
      id: 'user-123',
      address: '0x1234...5678',
      isConnected: true
    });
  };

  const handleWalletDisconnect = () => {
    setUser({
      id: '',
      address: '',
      isConnected: false,
      isVerified: false
    });
  };

  const handleVerify = async (type: 'age' | 'hackathon-creator' | 'recruiter') => {
    setVerificationType(type);

    if (!user.id) {
      alert('User wallet not connected');
      return;
    }

    try {
      // Call the issuer node API to get credentials for the user DID
      const response = await fetch(`/issuer-node/api/v2/identities/${encodeURIComponent(user.id)}/credentials`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
          // Add authorization headers here if needed
        }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const json = await response.json();

      // Check if any credential matches the KYC verification schema type
      const hasKycCredential = json.items?.some((cred: { vc?: { type?: string[] } }) => {
        return cred.vc?.type?.includes('KYCAgeCredential') || cred.vc?.type?.includes('KYCVerification');
      });

      setUser({
        ...user,
        isVerified: hasKycCredential,
        verificationType: type
      });

      setAppState('verification-result');
    } catch (error) {
      console.error('Verification failed:', error);
      alert('Verification failed. Please try again later.');
    }
  };

  const handleCreateSelect = (type: 'stake-pool' | 'hackathon' | 'job') => {
    setCreateType(type);
    setAppState('create-form');
  };

  const handleCreateSubmit = (data: any) => {
    const titles = {
      'stake-pool': 'Stake Pool Created!',
      'hackathon': 'Hackathon Created!',
      'job': 'Job Posted!'
    };
    
    const messages = {
      'stake-pool': 'Your stake pool has been successfully created and is now live.',
      'hackathon': 'Your hackathon has been posted and participants can now register.',
      'job': 'Your job posting is now live and candidates can apply.'
    };

    setPlaceholderData({
      title: titles[createType],
      message: messages[createType]
    });
    setAppState('placeholder');
  };

  const handleJoinAction = (type: string, id: string) => {
    const titles = {
      'stake-pool': 'Staking Successful!',
      'hackathon': 'Registration Complete!',
      'job': 'Application Submitted!'
    };
    
    const messages = {
      'stake-pool': 'You have successfully joined the stake pool. Your tokens are now earning rewards.',
      'hackathon': 'You are now registered for the hackathon. Check your email for further details.',
      'job': 'Your application has been submitted. The company will review and contact you soon.'
    };

    setPlaceholderData({
      title: titles[type as keyof typeof titles],
      message: messages[type as keyof typeof messages]
    });
    setAppState('placeholder');
  };

  const handleBackToDashboard = () => {
    setAppState('dashboard');
  };

  if (appState === 'verification-result') {
    return (
      <VerificationResult
        verificationType={verificationType}
        onContinue={handleBackToDashboard}
      />
    );
  }

  if (appState === 'create-form') {
    return (
      <CreateForm
        type={createType}
        onSubmit={handleCreateSubmit}
        onBack={handleBackToDashboard}
      />
    );
  }

  if (appState === 'placeholder') {
    return (
      <Placeholder
        title={placeholderData.title}
        message={placeholderData.message}
        onBack={handleBackToDashboard}
      />
    );
  }

  return (
    <div className="min-h-screen relative">
      <InteractiveBackground />
      
      <Header
        user={user}
        onWalletConnect={handleWalletConnect}
        onWalletDisconnect={handleWalletDisconnect}
        onVerify={handleVerify}
        onCreateSelect={handleCreateSelect}
      />
      
      <MainContent
        onJoinStakePool={(id) => handleJoinAction('stake-pool', id)}
        onJoinHackathon={(id) => handleJoinAction('hackathon', id)}
        onApplyJob={(id) => handleJoinAction('job', id)}
      />
    </div>
  );
}

export default App;