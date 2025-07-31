import React, { useState } from 'react';
import { Shield, Upload, X, CheckCircle, AlertCircle, QrCode, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react'; // Import QRCode library

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
  const [mockDob, setMockDob] = useState<string | null>(null);
  const [showCorsHelp, setShowCorsHelp] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null); // State to store the QR code URL
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingCredential, setIsCreatingCredential] = useState(false);
  const ISSUER_DID = "did:polygonid:polygon:amoy:2qRjbs95WgzMDEA5w7XEkERbsn6ptrHTn7ftnPcyig"; // Updated issuer DID
  const SUBJECT_DID = "did:iden3:privado:main:2ScwqMj93k1wGLto2qp7MJ6UNzRULo8jnVcf23rF8M";

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
      setIsLoading(true);
      
      // Simulate document reading with 3-second delay
      setTimeout(() => {
        setMockDob('01-01-1990'); // Mock DOB
        setIsLoading(false);
        setIsOpen(false);
        setSelectedType(null);
        setProofFile(null);
      }, 3000);
    }
  };

  const handleConfirm = async () => {
    if (!mockDob) return;

    const birthday = mockDob.split('-').reverse().join(''); // Convert to YYYYMMDD format
    const payload = {
      credentialSchema: "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json/KYCAgeCredential-v3.json",
      type: "KYCAgeCredential",
      credentialSubject: {
        id: SUBJECT_DID,
        birthday: parseInt(birthday, 10),
        documentType: 2
      },
      expiration: 1903357766
    };

    try {
      console.log("Creating credential with payload:", payload);

      // Updated API call with new issuer DID URL encoding
      const encodedIssuerDID = encodeURIComponent(ISSUER_DID);
      const credentialUrl = `/v2/identities/${encodedIssuerDID}/credentials`;
      
      console.log("Credential URL:", credentialUrl);

      const response = await fetch(credentialUrl, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Authorization": "Basic dXNlci1pc3N1ZXI6cGFzc3dvcmQtaXNzdWVy",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      console.log("Credential response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Credential creation failed:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Credential created with ID:", result.id);

      // Wait for 2 seconds before fetching the offer
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Updated offer URL with new issuer DID
      const offerUrl = `/v2/identities/${encodedIssuerDID}/credentials/${result.id}/offer?type=universalLink`;
      
      console.log("Fetching universal link from:", offerUrl);
      
      const offerResponse = await fetch(offerUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Authorization": "Basic dXNlci1pc3N1ZXI6cGFzc3dvcmQtaXNzdWVy"
        }
      });

      console.log("Offer response status:", offerResponse.status);

      if (!offerResponse.ok) {
        const errorText = await offerResponse.text();
        console.error("Offer fetch failed:", errorText);
        throw new Error(`Offer HTTP error! status: ${offerResponse.status}`);
      }

      const offerResult = await offerResponse.json();
      console.log("Offer result:", offerResult);

      if (offerResult.universalLink) {
        handleUniversalLink(offerResult.universalLink);
      } else {
        throw new Error("No universalLink found in response");
      }

    } catch (error) {
      console.error("API call failed:", error);
      
      // Check if it's a network error (likely CORS)
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        setShowCorsHelp(true);
        alert(`Network error: ${error.message}\n\nThis is likely a CORS issue. Check the CORS help section below for solutions.`);
      } else {
        alert(`API call failed: ${error.message}`);
      }
    }
  };

  const handleManualFlow = () => {
    const credentialId = prompt("Enter the credential ID from the curl response:");
    if (credentialId) {
      handleOfferFlow(credentialId);
    }
  };

  const handleOfferFlow = async (credentialId: string) => {
    // Updated curl command with new issuer DID
    const encodedIssuerDID = encodeURIComponent(ISSUER_DID);
    const offerCurl = `curl -X GET "https://3c52dc2d710d.ngrok-free.app/v2/identities/${encodedIssuerDID}/credentials/${credentialId}/offer?type=universalLink" \\
  -H "Accept: application/json" \\
  -H "Authorization: Basic dXNlci1pc3N1ZXI6cGFzc3dvcmQtaXNzdWVy" \\
  -H "ngrok-skip-browser-warning: true"`;

    console.log("=== OFFER CURL COMMAND ===");
    console.log(offerCurl);
    console.log("=== END CURL COMMAND ===");

    try {
      await navigator.clipboard.writeText(offerCurl);
      
      const universalLink = prompt(`Step 2: Get Universal Link

The curl command for getting the universal link has been copied to clipboard.

1. Paste and run it in your terminal
2. Copy the 'universalLink' value from the response
3. Paste it below:

Curl command: ${offerCurl}`);

      if (universalLink) {
        handleUniversalLink(universalLink);
      }
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      const universalLink = prompt(`Run this curl command and paste the universalLink here:\n\n${offerCurl}`);
      if (universalLink) {
        handleUniversalLink(universalLink);
      }
    }
  };

  const handleUniversalLink = async (universalLink: string) => {
    console.log("Using Universal Link:", universalLink);
    
    setQrUrl(universalLink); // Set the URL for QR code generation

    const confirmResult = window.confirm(
      "Success! Your credential has been created.\n\n" +
      "Click 'OK' to open the universal link in a new tab, or 'Cancel' to copy it to clipboard.\n\n" +
      `Link: ${universalLink}`
    );

    if (confirmResult) {
      window.open(universalLink, "_blank");
    } else {
      try {
        await navigator.clipboard.writeText(universalLink);
        alert("Universal link copied to clipboard!");
      } catch (error) {
        console.error("Failed to copy to clipboard:", error);
        alert(`Universal link: ${universalLink}`);
      }
    }
  };

  const handleCloseQR = () => {
    setQrUrl(null);
    setMockDob(null);
  };

  if (!isConnected) {
    return (
      <button className="flex items-center gap-2 bg-gray-600 text-gray-300 px-4 py-2 rounded-lg cursor-not-allowed">
        <Shield size={18} />
        <span className="hidden sm:inline">Get Credentials</span>
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
                disabled={!selectedType || !proofFile || isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Reading Document...
                  </>
                ) : (
                  'Verify Identity'
                )}
              </button>

              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
                  <div className="text-center">
                    <Loader2 className="animate-spin mx-auto mb-3 text-purple-400" size={32} />
                    <p className="text-gray-200 font-medium">Reading Document...</p>
                    <p className="text-gray-400 text-sm mt-1">Please wait while we process your document</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {mockDob && (
        <div className="mt-4 p-6 bg-gray-800 rounded-lg text-center shadow-lg border border-gray-700">
          <p className="text-gray-200 text-lg font-semibold mb-4">Date of Birth: {mockDob}</p>
          <button
            onClick={handleConfirm}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105"
          >
            Confirm & Get Credential
          </button>
        </div>
      )}

      {qrUrl && (
        <div className="mt-4 p-6 bg-gray-800 rounded-lg text-center shadow-lg border border-gray-700">
          <h3 className="text-gray-200 text-lg font-semibold mb-4">Scan using your phone</h3>
          <div className="flex justify-center mb-4">
            <QRCodeSVG value={qrUrl} size={200} className="rounded-lg" />
          </div>
          <p className="text-sm text-gray-400 break-all mb-4">{qrUrl}</p>
          <button
            onClick={handleCloseQR}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            OK
          </button>
        </div>
      )}

      {showCorsHelp && (
        <div className="mt-4 p-6 bg-yellow-900/50 rounded-lg border border-yellow-600/50">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-400 mt-1 flex-shrink-0" size={20} />
            <div className="text-sm text-yellow-100">
              <h4 className="font-semibold mb-2">CORS Solutions:</h4>
              <ol className="list-decimal list-inside space-y-1 mb-3">
                <li>Install "CORS Unblock" browser extension</li>
                <li>Add CORS headers to your API server</li>
                <li>Use ngrok with authentication token (paid plan)</li>
                <li>Run Chrome with --disable-web-security flag (dev only)</li>
              </ol>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCorsHelp(false)}
                  className="text-yellow-400 hover:text-yellow-300 underline"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => {
                    setShowCorsHelp(false);
                    handleManualFlow();
                  }}
                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
                >
                  Use Manual Process
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyDropdown;