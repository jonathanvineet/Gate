import React, { useState, useEffect } from 'react';
import { X, Smartphone, CheckCircle, XCircle, Loader, Briefcase } from 'lucide-react';
import QRCode from 'qrcode';

interface RecruiterVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerificationComplete: (success: boolean, details?: unknown) => void;
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

  useEffect(() => {
    if (isOpen) {
      initializeRecruiterVerification();
    }
  }, [isOpen, companyName]);

  const initializeRecruiterVerification = async () => {
    try {
      setStatus('loading');
      setError('');

      // Mocked session and QR payload (no backend call)
      const sessionId = Date.now();
      const qrPayload = `recruiter://verify?session=${sessionId}`;

      const qrUrl = await QRCode.toDataURL(qrPayload, {
        width: 256,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      });
      setQrCodeUrl(qrUrl);
      setStatus('ready');
    } catch (err) {
      console.error('Recruiter verification initialization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize recruiter verification');
      setStatus('failed');
    }
  };

  // Mocked wallet open handler: show verifying and then mark success with hidden details
  const handleOpenWallet = () => {
    setStatus('verifying');
    setVerificationMessage(null);
    setError('');
    setTimeout(() => {
      const details = { companyName: 'TechCorp Solutions', employeeId: 'EMP001234' };
      setStatus('success');
      setVerificationMessage('Recruiter verified successfully.');
      setTimeout(() => {
        onVerificationComplete(true, details);
        onClose();
      }, 1500);
    }, 2000);
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

          {/* Intentionally not showing company details here to keep identity private */}

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
                <p className="text-gray-600">Scan the QR with your wallet to verify recruiter credentials.</p>
                <button
                  onClick={handleOpenWallet}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition"
                >
                  <Smartphone size={20} />
                  Open Wallet
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
