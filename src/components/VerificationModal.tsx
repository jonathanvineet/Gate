import React, { useState, useEffect } from 'react';
import { X, QrCode, Smartphone, CheckCircle, XCircle, Loader } from 'lucide-react';
import QRCode from 'qrcode';
import { verificationService, QRData } from '../services/verificationService';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerificationComplete: (success: boolean) => void;
}

const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  onVerificationComplete
}) => {
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'verifying' | 'success' | 'failed'>('loading');
  const [error, setError] = useState<string>('');
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [isRequestInProgress, setIsRequestInProgress] = useState<boolean>(false);
  const [verifierWindow, setVerifierWindow] = useState<Window | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  useEffect(() => {
    if (isOpen) {
      // Only initialize if we haven't already started
      if (status === 'loading') {
        initializeVerification();
      }
      addDebugInfo("Modal opened, setting up message listener");
      
      const handleVerificationMessage = (event: MessageEvent) => {
        // Filter out MetaMask and other noise messages
        if (event.data && 
            (event.data.target === 'metamask-inpage' || 
             event.data.type === 'wallet_events' ||
             event.data.type === 'wallet_ready' ||
             !event.data.type)) {
          return;
        }
        
        addDebugInfo(`Received message: ${event.data?.type || 'unknown'}`);
        console.log('🔍 Received relevant postMessage event:', {
          origin: event.origin,
          data: event.data,
          type: event.data?.type
        });
        
        if (event.data && event.data.type) {
          if (event.data.type === 'verificationSuccess') {
            addDebugInfo("SUCCESS message received!");
            console.log("✅ Received SUCCESS message from child window:", event.data);
            setStatus('success');
            setVerificationMessage(event.data.message || 'Verification successful!');
            if (pollingInterval) clearInterval(pollingInterval);
            setTimeout(() => {
              onVerificationComplete(true);
              onClose();
            }, 2000);
            
            if (verifierWindow && !verifierWindow.closed) {
              verifierWindow.close();
            }
            setVerifierWindow(null);
          } else if (event.data.type === 'verificationFailure') {
            addDebugInfo("FAILURE message received!");
            console.log("❌ Received FAILURE message from child window:", event.data);
            setStatus('failed');
            setVerificationMessage(event.data.message || 'Verification failed');
            if (pollingInterval) clearInterval(pollingInterval);
            setTimeout(() => {
              onVerificationComplete(false);
            }, 2000);
            
            if (verifierWindow && !verifierWindow.closed) {
              verifierWindow.close();
            }
            setVerifierWindow(null);
          }
        }
      };
      
      window.addEventListener('message', handleVerificationMessage);
      return () => {
        window.removeEventListener('message', handleVerificationMessage);
        if (verifierWindow && !verifierWindow.closed) {
          verifierWindow.close();
        }
        if (pollingInterval) clearInterval(pollingInterval);
      };
    }
  }, [isOpen, verifierWindow, pollingInterval]);

  const initializeVerification = async () => {
    if (isRequestInProgress || status !== 'loading') {
      console.log('Request already in progress or not in loading state, skipping...');
      return;
    }

    try {
      setIsRequestInProgress(true);
      setStatus('loading');
      setError('');
      
      console.log('Starting verification initialization...');
      
      // Clear any cached data first
      verificationService.clearCache();
      
      const data = await verificationService.getQRData();
      console.log('QR data received:', data);
      
      // Additional validation
      if (!data.qrData) {
        throw new Error('Invalid QR data received from server');
      }

      setQrData(data);
      
      // Generate QR code with error handling
      try {
        const qrUrl = await QRCode.toDataURL(data.qrData, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(qrUrl);
      } catch (qrError) {
        console.error('QR code generation error:', qrError);
        throw new Error('Failed to generate QR code. Please try again.');
      }
      
      setStatus('ready');
    } catch (err) {
      console.error('Verification initialization error:', err);
      
      let errorMessage = 'Failed to initialize verification';
      
      if (err instanceof Error) {
        if (err.message.includes('JSON LD Context')) {
          errorMessage = 'Verification protocol error. Please try refreshing the page.';
        } else if (err.message.includes('Invalid protocol message')) {
          errorMessage = 'Invalid verification protocol. Please contact support if this persists.';
        } else if (err.message.includes('Network error')) {
          errorMessage = 'Network connection error. Please check your internet and try again.';
        } else if (err.message.includes('fetch')) {
          errorMessage = 'Verification service is temporarily unavailable. Please try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setStatus('failed');
    } finally {
      setIsRequestInProgress(false);
    }
  };

  const startPolling = (sessionId: number) => {
    addDebugInfo("Starting polling for verification status");
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`https://7fbab6d82de1.ngrok-free.app/api/verification-status/${sessionId}`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        if (response.ok) {
          const status = await response.json();
          if (status.completed) {
            addDebugInfo(`Polling detected completion: ${status.success ? 'SUCCESS' : 'FAILURE'}`);
            clearInterval(interval);
            setPollingInterval(null);
            if (status.success) {
              setStatus('success');
              setVerificationMessage('Verification completed successfully!');
              setTimeout(() => {
                onVerificationComplete(true);
                onClose();
              }, 2000);
            } else {
              setStatus('failed');
              setVerificationMessage('Verification failed');
              setTimeout(() => {
                onVerificationComplete(false);
              }, 2000);
            }
          }
        }
      } catch (error) {
        console.log('Polling error (expected if endpoint not implemented):', error);
      }
    }, 2000);
    
    setPollingInterval(interval);
  };

  const openVerifierWindow = (walletUrl: string) => {
    addDebugInfo("Opening verifier window");
    const width = 480;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const verifier = window.open(
      walletUrl,
      'VerifierWindow',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
    
    if (!verifier) {
      setError('Popup blocked. Please allow popups for this site and try again.');
      setStatus('failed');
      return null;
    }
    
    setVerifierWindow(verifier);
    setStatus('verifying');
    
    // Start polling as backup
    if (qrData) {
      startPolling(qrData.sessionId);
    }
    
    // Monitor if window is closed manually by user
    const checkClosed = setInterval(() => {
      if (verifier.closed) {
        clearInterval(checkClosed);
        setVerifierWindow(null);
        if (status === 'verifying') {
          setStatus('failed');
          setError('Verification window was closed before completion');
        }
      }
    }, 1000);
    
    return verifier;
  };

  const handleOpenWallet = () => {
    if (qrData) {
      openVerifierWindow(qrData.walletUrl);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Verify Your Identity</h2>

          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <Loader className="animate-spin text-blue-500" size={48} />
              <p className="text-gray-600">Preparing verification...</p>
            </div>
          )}

          {status === 'ready' && qrCodeUrl && (
            <div className="flex flex-col items-center gap-6">
              <div className="bg-gray-50 p-4 rounded-xl">
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-600">
                  Scan the QR code with your Privado ID wallet or click the button below
                </p>
                
                <button
                  onClick={handleOpenWallet}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition"
                >
                  <Smartphone size={20} />
                  Open Wallet
                </button>
              </div>
            </div>
          )}

          {status === 'verifying' && (
            <div className="flex flex-col items-center gap-4">
              <Loader className="animate-spin text-blue-500" size={48} />
              <p className="text-gray-600">Waiting for verification...</p>
              <p className="text-sm text-gray-500">
                Take your time to complete the verification in your wallet app
              </p>
              
              {/* Debug info */}
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600 max-w-sm">
                <div className="font-semibold mb-1">Debug Info:</div>
                {debugInfo.map((info, idx) => (
                  <div key={idx} className="text-xs">{info}</div>
                ))}
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="text-green-500" size={48} />
              <p className="text-green-600 font-semibold">Verification Successful!</p>
              {verificationMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 max-w-sm">
                  <p className="text-sm text-green-700">{verificationMessage}</p>
                </div>
              )}
            </div>
          )}

          {status === 'failed' && (
            <div className="flex flex-col items-center gap-4">
              <XCircle className="text-red-500" size={48} />
              <p className="text-red-600 font-semibold">Verification Failed</p>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-w-sm">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              {verificationMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-w-sm">
                  <p className="text-sm text-red-700">{verificationMessage}</p>
                </div>
              )}
              <button
                onClick={initializeVerification}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;
