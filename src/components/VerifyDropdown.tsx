import React, { useState } from 'react';
import { Shield, Upload, X, CheckCircle } from 'lucide-react';

interface VerifyDropdownProps {
  isConnected: boolean;
  isVerified: boolean;
  onVerify: (type: 'age' | 'hackathon-creator' | 'recruiter', proof: File) => void;
}

const VerifyDropdown: React.FC<VerifyDropdownProps> = ({ 
  isConnected, 
  isVerified, 
  onVerify 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'age' | 'hackathon-creator' | 'recruiter' | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileUpload = (file: File) => {
    setProofFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleVerify = () => {
    if (selectedType && proofFile) {
      onVerify(selectedType, proofFile);
      setIsOpen(false);
      setSelectedType(null);
      setProofFile(null);
    }
  };

  if (!isConnected) {
    return (
      <button className="flex items-center gap-2 bg-gray-600 text-gray-300 px-4 py-2 rounded-lg cursor-not-allowed">
        <Shield size={18} />
        <span className="hidden sm:inline">Verify</span>
      </button>
    );
  }

  if (isVerified) {
    return (
      <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg">
        <CheckCircle size={18} />
        <span className="hidden sm:inline">Verified</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 futuristic-button hover-glow"
      >
        <Shield size={18} />
        <span className="hidden sm:inline">Verify</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700/50 z-50">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-100">Identity Verification</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Verification Type
                </label>
                <select
                  value={selectedType || ''}
                  onChange={(e) => setSelectedType(e.target.value as any)}
                  className="w-full p-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-800 text-gray-100"
                >
                  <option value="">Select type...</option>
                  <option value="age">Age Verification</option>
                  <option value="hackathon-creator">Hackathon Creator</option>
                  <option value="recruiter">Recruiter</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Upload Proof Document
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragOver 
                      ? 'border-purple-400 bg-purple-900/30' 
                      : 'border-gray-700 hover:border-purple-400'
                  }`}
                >
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-300 mb-2">
                    Drag and drop your document here, or
                  </p>
                  <input
                    type="file"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer transition-colors"
                  >
                    Choose File
                  </label>
                  {proofFile && (
                    <p className="mt-2 text-sm text-green-400">
                      ✓ {proofFile.name}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleVerify}
                disabled={!selectedType || !proofFile}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Verify Identity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyDropdown;