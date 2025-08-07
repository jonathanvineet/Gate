import React, { useState, useEffect } from 'react';
import { X, QrCode, Smartphone, CheckCircle, XCircle, Loader, Briefcase } from 'lucide-react';
import QRCode from 'qrcode';
import { recruiterVerificationService } from '../services/recruiterVerificationService';

interface RecruiterVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerificationComplete: (success: boolean, details?: any) => void;
  companyName?: string;
}

const RecruiterVerificationModal: React.FC<RecruiterVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerificationComplete,
  companyName = 'TechCorp Solutions'
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'verifying' | 'success' | 'failed'>('loading');
  const [error, setError] = useState<string>('');
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [verificationDetails, setVerificationDetails] = useState<any>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [expectedX, setExpectedX] = useState<string>('');
  const [verifierWindow, setVerifierWindow] = useState<Window | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [walletUrl, setWalletUrl] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      initializeRecruiterVerification();
    }
  }, [isOpen, companyName]);

  const initializeRecruiterVerification = async () => {
    try {
      setStatus('loading');
      setError('');

      // Calculate expected X value for the company
      const companyX = recruiterVerificationService.getExpectedXForCompany(companyName);
      setExpectedX(companyX);

      console.log(`Initializing recruiter verification for ${companyName} (X: ${companyX})`);

      // Generate QR data for recruiter verification
      const data = await recruiterVerificationService.generateRecruiterVerificationQR(companyX);
      setSessionId(data.sessionId);
      setWalletUrl(data.walletUrl);

      // Generate QR code
      const qrUrl = await QRCode.toDataURL(data.qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrUrl);
      setStatus('ready');

      // Set up message listener for verification results
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'recruiterVerificationSuccess') {
          setStatus('success');
          setVerificationMessage('Recruiter credentials verified successfully!');
          setVerificationDetails(event.data.details);
          if (pollingInterval) clearInterval(pollingInterval);
          if (verifierWindow && !verifierWindow.closed) {
            verifierWindow.close();
          }
          setTimeout(() => {
            onVerificationComplete(true, event.data.details);
            onClose();
          }, 2000);
        } else if (event.data?.type === 'recruiterVerificationFailure') {
          setStatus('failed');
          setVerificationMessage(event.data.message || 'Recruiter verification failed');
          setVerificationDetails(event.data.details);
          if (pollingInterval) clearInterval(pollingInterval);
          if (verifierWindow && !verifierWindow.closed) {
            verifierWindow.close();
          }
          setTimeout(() => {
            onVerificationComplete(false, event.data.details);
          }, 2000);
        }
      };

      window.addEventListener('message', handleMessage);
      return () => {
        window.removeEventListener('message', handleMessage);
        if (verifierWindow && !verifierWindow.closed) {
          verifierWindow.close();
        }
        if (pollingInterval) clearInterval(pollingInterval);
      };

    } catch (err) {
      console.error('Recruiter verification initialization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize recruiter verification');
      setStatus('failed');
    }
  };

  const openVerifierWindow = (walletUrl: string) => {
    console.log('Opening recruiter verifier window with URL:', walletUrl);
    
    const width = 480;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const verifier = window.open(
      walletUrl,
      'RecruiterVerifierWindow',
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
    if (sessionId) {
      startPolling(sessionId);
    }
    
    // Monitor if window is closed manually by user
    const checkClosed = setInterval(() => {
      if (verifier.closed) {
        clearInterval(checkClosed);
        setVerifierWindow(null);
        if (pollingInterval) clearInterval(pollingInterval);
        if (status === 'verifying') {
          setStatus('failed');
          setError('Verification window was closed before completion');
        }
      }
    }, 1000);
    
    return verifier;
  };

  const startPolling = (sessionId: number) => {
    console.log("Starting polling for recruiter verification status");
    const interval = setInterval(async () => {
      try {
        const result = await recruiterVerificationService.checkVerificationStatus(sessionId);
        console.log('Polling result:', result);
        
        if (result.success) {
          clearInterval(interval);
          setPollingInterval(null);
          setStatus('success');
          setVerificationMessage(result.message);
          setVerificationDetails(result.credentialDetails);
          if (verifierWindow && !verifierWindow.closed) {
            verifierWindow.close();
          }
          setTimeout(() => {
            onVerificationComplete(true, result.credentialDetails);
            onClose();
          }, 2000);
        } else if (result.credentialFound !== undefined) {
          // Verification completed but failed
          clearInterval(interval);
          setPollingInterval(null);
          setStatus('failed');
          setVerificationMessage(result.message);
          setVerificationDetails(result.credentialDetails);
          if (verifierWindow && !verifierWindow.closed) {
            verifierWindow.close();
          }
          setTimeout(() => {
            onVerificationComplete(false, result.credentialDetails);
          }, 2000);
        }
      } catch (error) {
        console.log('Polling error:', error);
      }
    }, 2000);
    
    setPollingInterval(interval);
  };

  const handleOpenWallet = () => {
    if (walletUrl) {
      openVerifierWindow(walletUrl);
    } else {
      setError('Wallet URL not available. Please try again.');
      setStatus('failed');
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
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-purple-100 p-3 rounded-full">
              <Briefcase className="text-purple-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Verify Recruiter Credentials</h2>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Company:</strong> {companyName}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Expected X value: {expectedX}
            </p>
          </div>

          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <Loader className="animate-spin text-purple-500" size={48} />
              <p className="text-gray-600">Preparing recruiter verification...</p>
            </div>
          )}

          {status === 'ready' && qrCodeUrl && (
            <div className="flex flex-col items-center gap-6">
              <div className="bg-gray-50 p-4 rounded-xl">
                <img src={qrCodeUrl} alt="Recruiter Verification QR Code" className="w-48 h-48" />
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-600">
                  Prove you have recruiter credentials for <strong>{companyName}</strong> by showing your existing AuthBJJCredential with X value: <strong>{expectedX}</strong>
                </p>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                  <p className="text-yellow-800">
                    <strong>Note:</strong> This will verify your existing credential, not create a new one.
                  </p>
                </div>
                
                <button
                  onClick={handleOpenWallet}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition"
                >
                  <Smartphone size={20} />
                  Prove Credentials
                </button>
              </div>
            </div>
          )}

          {status === 'verifying' && (
            <div className="flex flex-col items-center gap-4">
              <Loader className="animate-spin text-purple-500" size={48} />
              <p className="text-gray-600">Verifying your recruiter credentials...</p>
              <p className="text-sm text-gray-500">
                Please confirm the verification in your wallet
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="text-green-500" size={48} />
              <p className="text-green-600 font-semibold">Recruiter Verification Successful!</p>
              {verificationMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 max-w-sm">
                  <p className="text-sm text-green-700">{verificationMessage}</p>
                </div>
              )}
              {verificationDetails && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-w-sm text-left">
                  <p className="text-xs text-gray-600 mb-2">Credential Details:</p>
                  <p className="text-xs"><strong>Company X:</strong> {verificationDetails.x}</p>
                  <p className="text-xs"><strong>Employee Y:</strong> {verificationDetails.y}</p>
                  <p className="text-xs"><strong>Issuer:</strong> {verificationDetails.issuer?.slice(0, 30)}...</p>
                </div>
              )}
            </div>
          )}

          {status === 'failed' && (
            <div className="flex flex-col items-center gap-4">
              <XCircle className="text-red-500" size={48} />
              <p className="text-red-600 font-semibold">Recruiter Verification Failed</p>
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
              {verificationDetails && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-w-sm text-left">
                  <p className="text-xs text-gray-600 mb-2">Found Credential:</p>
                  <p className="text-xs"><strong>Company X:</strong> {verificationDetails.x}</p>
                  <p className="text-xs"><strong>Expected:</strong> {expectedX}</p>
                </div>
              )}
              <button
                onClick={initializeRecruiterVerification}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition"
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

export default RecruiterVerificationModal;
