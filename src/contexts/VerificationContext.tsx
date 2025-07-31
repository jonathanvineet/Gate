import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface VerificationState {
  isVerified: boolean;
  verificationDate: string | null;
  verificationType: 'age' | 'hackathon-creator' | 'recruiter' | null;
}

interface VerificationContextType {
  verificationState: VerificationState;
  setVerified: (success: boolean, type?: 'age' | 'hackathon-creator' | 'recruiter') => void;
  clearVerification: () => void;
}

const VerificationContext = createContext<VerificationContextType | undefined>(undefined);

interface VerificationProviderProps {
  children: ReactNode;
}

export const VerificationProvider: React.FC<VerificationProviderProps> = ({ children }) => {
  const [verificationState, setVerificationState] = useState<VerificationState>({
    isVerified: false,
    verificationDate: null,
    verificationType: null
  });

  // Load verification state from sessionStorage on component mount
  useEffect(() => {
    const stored = sessionStorage.getItem('verification_state');
    if (stored) {
      try {
        const parsedState = JSON.parse(stored);
        console.log('🔍 VerificationProvider: Loading verification state from sessionStorage:', parsedState);
        setVerificationState(parsedState);
      } catch (error) {
        console.error('Error parsing verification state:', error);
        sessionStorage.removeItem('verification_state');
      }
    }
  }, []);

  // Save verification state to sessionStorage whenever it changes
  useEffect(() => {
    if (verificationState.isVerified || verificationState.verificationDate) {
      console.log('💾 VerificationProvider: Saving verification state to sessionStorage:', verificationState);
      sessionStorage.setItem('verification_state', JSON.stringify(verificationState));
    }
  }, [verificationState]);

  const setVerified = (success: boolean, type: 'age' | 'hackathon-creator' | 'recruiter' = 'age') => {
    console.log('🔐 VerificationProvider: setVerified called with:', { success, type });
    
    const newState: VerificationState = {
      isVerified: success,
      verificationDate: success ? new Date().toISOString() : null,
      verificationType: success ? type : null
    };
    
    setVerificationState(newState);
    
    if (success) {
      // Dispatch custom event to notify all components
      window.dispatchEvent(new CustomEvent('verificationComplete', { 
        detail: { success: true, type } 
      }));
    }
  };

  const clearVerification = () => {
    console.log('🗑️ VerificationProvider: clearVerification called');
    const newState: VerificationState = {
      isVerified: false,
      verificationDate: null,
      verificationType: null
    };
    
    setVerificationState(newState);
    sessionStorage.removeItem('verification_state');
    
    // Dispatch custom event to notify all components
    window.dispatchEvent(new CustomEvent('verificationCleared'));
  };

  return (
    <VerificationContext.Provider value={{
      verificationState,
      setVerified,
      clearVerification
    }}>
      {children}
    </VerificationContext.Provider>
  );
};

export const useVerification = () => {
  const context = useContext(VerificationContext);
  if (context === undefined) {
    throw new Error('useVerification must be used within a VerificationProvider');
  }
  return context;
};
