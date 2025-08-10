/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type VerificationKind = 'age' | 'hackathon-creator' | 'recruiter';

interface VerificationPerTypeState {
  verified: boolean;
  verificationDate: string | null;
}

interface VerificationState {
  // Backward-compatible fields (age-focused)
  isVerified: boolean; // represents AGE verification for legacy checks
  verificationDate: string | null; // date for AGE verification
  verificationType: VerificationKind | null; // last verified type
  // New per-type map
  byType: Record<VerificationKind, VerificationPerTypeState>;
}

interface VerificationContextType {
  verificationState: VerificationState;
  setVerified: (success: boolean, type?: VerificationKind) => void;
  clearVerification: (type?: VerificationKind) => void;
  isTypeVerified: (type: VerificationKind) => boolean;
}

const VerificationContext = createContext<VerificationContextType | undefined>(undefined);

interface VerificationProviderProps {
  children: ReactNode;
}

export const VerificationProvider: React.FC<VerificationProviderProps> = ({ children }) => {
  // Initial state with per-type map; legacy fields derive from age type
  const [verificationState, setVerificationState] = useState<VerificationState>({
    isVerified: false,
    verificationType: null,
    verificationDate: null,
    byType: {
      age: { verified: false, verificationDate: null },
      'hackathon-creator': { verified: false, verificationDate: null },
      recruiter: { verified: false, verificationDate: null },
    },
  });

  // Load verification state from sessionStorage on component mount
  useEffect(() => {
    const stored = sessionStorage.getItem('verification_state');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log('🔍 VerificationProvider: Loading verification state from sessionStorage:', parsed);

        // Migration: if old shape (no byType), convert to new
        if (!parsed.byType) {
          const byType: Record<VerificationKind, VerificationPerTypeState> = {
            age: { verified: false, verificationDate: null },
            'hackathon-creator': { verified: false, verificationDate: null },
            recruiter: { verified: false, verificationDate: null },
          };
          const ageVerified = Boolean(parsed.isVerified);
          const ageDate = parsed.verificationDate ?? null;
          byType.age = { verified: ageVerified, verificationDate: ageDate };
          const newState: VerificationState = {
            isVerified: ageVerified,
            verificationDate: ageDate,
            verificationType: parsed.verificationType ?? (ageVerified ? 'age' : null),
            byType,
          };
          setVerificationState(newState);
        } else {
          setVerificationState(parsed as VerificationState);
        }
      } catch (error) {
        console.error('Error parsing verification state:', error);
        sessionStorage.removeItem('verification_state');
      }
    }
  }, []);

  // Save verification state to sessionStorage whenever it changes
  useEffect(() => {
    if (verificationState) {
      console.log('💾 VerificationProvider: Saving verification state to sessionStorage:', verificationState);
      sessionStorage.setItem('verification_state', JSON.stringify(verificationState));
    }
  }, [verificationState]);

  const setVerified = (success: boolean, type: VerificationKind = 'age') => {
    console.log('🔐 VerificationProvider: setVerified called with:', { success, type });
    setVerificationState(prev => {
      const next = { ...prev, byType: { ...prev.byType } } as VerificationState;
      const date = success ? new Date().toISOString() : null;
      next.byType[type] = { verified: success, verificationDate: date };
      // Legacy fields mirror AGE only to keep gating behavior unchanged
      if (type === 'age') {
        next.isVerified = success;
        next.verificationDate = date;
      }
      next.verificationType = success ? type : prev.verificationType;
      return next;
    });
    
    if (success) {
      // Dispatch custom event to notify all components
      window.dispatchEvent(new CustomEvent('verificationComplete', { 
        detail: { success: true, type } 
      }));
    }
  };

  const clearVerification = (type?: VerificationKind) => {
    console.log('🗑️ VerificationProvider: clearVerification called', type ? `for ${type}` : '(all)');
    setVerificationState(prev => {
      if (!type) {
        const cleared: VerificationState = {
          isVerified: false,
          verificationDate: null,
          verificationType: null,
          byType: {
            age: { verified: false, verificationDate: null },
            'hackathon-creator': { verified: false, verificationDate: null },
            recruiter: { verified: false, verificationDate: null },
          },
        };
        sessionStorage.removeItem('verification_state');
        window.dispatchEvent(new CustomEvent('verificationCleared'));
        return cleared;
      }
      const next = { ...prev, byType: { ...prev.byType } } as VerificationState;
      next.byType[type] = { verified: false, verificationDate: null };
      if (type === 'age') {
        next.isVerified = false;
        next.verificationDate = null;
      }
      window.dispatchEvent(new CustomEvent('verificationCleared', { detail: { type } }));
      return next;
    });
  };

  const isTypeVerified = (type: VerificationKind) => Boolean(verificationState.byType?.[type]?.verified);

  return (
    <VerificationContext.Provider value={{
      verificationState,
      setVerified,
      clearVerification,
      isTypeVerified,
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
