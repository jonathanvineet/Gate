import React, { useState, useEffect } from 'react';
import { X, QrCode, Smartphone, CheckCircle, XCircle, Loader } from 'lucide-react';
import QRCode from 'qrcode';
import { verificationService, QRData, VerificationStatus } from '../services/verificationService';

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

  useEffect(() => {
    if (isOpen) {
      initializeVerification();
      // Listen for URL changes (when user returns from wallet)
      const handleUrlChange = () => {
        checkVerificationResult();
      };
      window.addEventListener('popstate', handleUrlChange);
      return () => window.removeEventListener('popstate', handleUrlChange);
    }
  }, [isOpen]);

  const initializeVerification = async () => {
    try {
      setStatus('loading');
      setError('');
      
      console.log('Starting verification initialization...');
      const data = await verificationService.getQRData();
      console.log('QR data received:', data);
      setQrData(data);
      
      // Generate QR code
      const qrUrl = await QRCode.toDataURL(data.qrData);
      setQrCodeUrl(qrUrl);
      
      setStatus('ready');
    } catch (err) {
      console.error('Verification initialization error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize verification';
      setError(errorMessage);
      setStatus('failed');
    }
  };

  const checkVerificationResult = async () => {
    if (!qrData) return;
    
    try {
      const result = await verificationService.checkVerificationStatus(qrData.sessionId);
      
      if (result.status === 'success') {
        setStatus('success');
        setTimeout(() => {
          onVerificationComplete(true);
          onClose();
        }, 2000);
      } else if (result.status === 'failed') {
        setStatus('failed');
        setTimeout(() => {
          onVerificationComplete(false);
        }, 2000);
      }
    } catch (err) {
      console.error('Error checking verification status:', err);
    }
  };

  const handleOpenWallet = () => {
    if (qrData) {
      setStatus('verifying');
      verificationService.openWallet(qrData.walletUrl);
      
      // Poll for verification result
      const pollInterval = setInterval(() => {
        checkVerificationResult();
      }, 2000);
      
      // Stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
      }, 300000);
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
                Complete the verification in your wallet app
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="text-green-500" size={48} />
              <p className="text-green-600 font-semibold">Verification Successful!</p>
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
