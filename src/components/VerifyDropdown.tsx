import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Download, Calendar, Trophy, Briefcase, Upload, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface VerifyDropdownProps {
  isConnected: boolean;
  isVerified: boolean;
  onVerify: (type: 'age' | 'hackathon-creator' | 'recruiter', proof: File) => void;
}

const VerifyDropdown: React.FC<VerifyDropdownProps> = ({ 
  isConnected, 
  isVerified
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'age' | 'hackathon-creator' | 'recruiter' | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [mockDob, setMockDob] = useState<string | null>(null);
  const [mockCompanyInfo, setMockCompanyInfo] = useState<{companyName: string, employeeId: string} | null>(null);
  const [showCorsHelp, setShowCorsHelp] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [verifyingRecruiter, setVerifyingRecruiter] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // DIDs and constants
  const ISSUER_DID = "did:polygonid:polygon:amoy:2qVM1DRgEDDd2RYn7PETLbCUqbgUSNqCVEfrnFkCVs";
  const SUBJECT_DID = "did:iden3:privado:main:2ScwqMj93k1wGLto2qp7MJ6UNzRULo8jnVcf23rF8M";

  // Debug logs
  console.log('VerifyDropdown Debug:', {
    isConnected,
    isVerified,
    isOpen,
    selectedType,
    mockDob,
    mockCompanyInfo
  });

  const verificationOptions = [
    { id: 'age', label: 'Age Verification', icon: <Calendar size={16} /> },
    { id: 'hackathon-creator', label: 'Hackathon Creator', icon: <Trophy size={16} /> },
    { id: 'recruiter', label: 'Recruiter Verification', icon: <Briefcase size={16} /> }
  ];

  const credentialOptions = [
    { id: 'recruiter', label: 'Recruiter Credentials', icon: <Briefcase size={16} /> },
    { id: 'age', label: 'Age Verification Certificate', icon: <Calendar size={16} /> },
    { id: 'hackathon-creator', label: 'Creator Credentials', icon: <Trophy size={16} /> }
  ];

  const handleGetCredentials = (type: 'age' | 'hackathon-creator' | 'recruiter') => {
    console.log('Getting credentials for type:', type);
    
    // Set the selected type to trigger the document upload flow
    setSelectedType(type);
    
    // Don't close the dropdown - show the upload interface
  };

  const handleVerificationSelect = (type: 'age' | 'hackathon-creator' | 'recruiter') => {
    console.log('Verification selected for type:', type);
    setSelectedType(type);
    // Don't close the dropdown, show the upload interface
  };

  // Recruiter wallet verification mock flow
  const handleOpenWalletRecruiter = () => {
    setVerifyingRecruiter(true);
    // Simulate wallet verification delay
    setTimeout(() => {
      setMockCompanyInfo({ companyName: 'TechCorp Solutions', employeeId: 'EMP001234' });
      setVerifyingRecruiter(false);
    }, 2000);
  };

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
    if (!selectedType || !proofFile) return;

    setIsLoading(true);
    
    // Simulate document processing
    setTimeout(() => {
      if (selectedType === 'age') {
        setMockDob('15-09-2005'); // Mock DOB for age verification
      } else if (selectedType === 'recruiter') {
        setMockCompanyInfo({
          companyName: 'TechCorp Solutions',
          employeeId: 'EMP001234'
        });
      } else {
        // For hackathon-creator, just set as verified
        setMockDob('verified');
      }
      setIsLoading(false);
    }, 3000);
  };

  const handleConfirm = async () => {
    if (selectedType === 'age' && mockDob) {
      await handleAgeCredential();
    } else if (selectedType === 'recruiter' && mockCompanyInfo) {
      await handleRecruiterCredential();
    } else if (selectedType === 'hackathon-creator') {
      await handleCreatorCredential();
    }
  };

  const handleAgeCredential = async () => {
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

    await createCredential(payload, 'age');
  };

  // Helper function to convert string to numbers
  const stringToNumbers = (str: string): { x: string, y: string } => {
    const cleanStr = str.toLowerCase().replace(/[^a-z0-9]/g, ''); // Remove special chars
    let xStr = '';
    let yStr = '';
    
    for (let i = 0; i < cleanStr.length; i++) {
      const char = cleanStr[i];
      let num: string;
      
      if (char >= '0' && char <= '9') {
        num = char;
      } else {
        // Convert a=0, b=1, c=2, etc.
        num = (char.charCodeAt(0) - 97).toString();
      }
      
      if (i % 2 === 0) {
        xStr += num;
      } else {
        yStr += num;
      }
    }
    
    // Ensure we have valid numbers
    const x = xStr || '12345';
    const y = yStr || '1234';
    
    return { x, y };
  };

  const handleRecruiterCredential = async () => {
    if (!mockCompanyInfo) return;

    // Convert company name to x (can be same)
    const companyNumbers = stringToNumbers(mockCompanyInfo.companyName);
    
    // Generate unique y value by adding timestamp
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const employeeNumbers = stringToNumbers(mockCompanyInfo.employeeId);
    const uniqueY = employeeNumbers.y + timestamp; // Make y unique by appending timestamp

    const payload = {
      credentialSchema: "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json/auth-v1.json",
      type: "AuthBJJCredential",
      credentialSubject: {
        id: SUBJECT_DID,
        x: companyNumbers.x, // x can be same (company)
        y: uniqueY // y must be unique (employee + timestamp)
      },
      expiration: 1903357766
    };

    console.log('Recruiter payload with converted numbers:', {
      originalCompany: mockCompanyInfo.companyName,
      originalEmployee: mockCompanyInfo.employeeId,
      convertedX: companyNumbers.x,
      originalY: employeeNumbers.y,
      uniqueY: uniqueY,
      timestamp: timestamp,
      payload
    });

    await createCredential(payload, 'recruiter');
  };

  const handleCreatorCredential = async () => {
    const payload = {
      credentialSchema: "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json/CreatorCredential-v1.json",
      type: "CreatorCredential",
      credentialSubject: {
        id: SUBJECT_DID,
        organizationName: "DevCorp Technologies",
        hackathonsHosted: 12,
        verificationLevel: "verified"
      },
      expiration: 1903357766
    };
    await createCredential(payload, 'hackathon-creator');
  };

  const createCredential = async (payload: unknown, type: 'age' | 'hackathon-creator' | 'recruiter') => {
    try {
      console.log(`Creating ${type} credential with payload:`, payload);
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

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Credential creation failed:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Credential created with ID:", result.id);

      // Wait for 2 seconds before fetching the offer
      await new Promise(resolve => setTimeout(resolve, 2000));

      const offerUrl = `/v2/identities/${encodedIssuerDID}/credentials/${result.id}/offer?type=universalLink`;
      const offerResponse = await fetch(offerUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Authorization": "Basic dXNlci1pc3N1ZXI6cGFzc3dvcmQtaXNzdWVy"
        }
      });

      if (!offerResponse.ok) {
        throw new Error(`Offer HTTP error! status: ${offerResponse.status}`);
      }

      const offerResult = await offerResponse.json();
      
      if (offerResult.universalLink) {
        handleUniversalLink(offerResult.universalLink);
      } else {
        throw new Error("No universalLink found in response");
      }
    } catch (error: unknown) {
      console.error("API call failed:", error);
      const isTypeErr = error instanceof TypeError;
      const msg = error instanceof Error ? error.message : String(error);
      if (isTypeErr && msg.includes('Failed to fetch')) {
        setShowCorsHelp(true);
        showManualCurlCommands(type);
      } else {
        alert(`API call failed: ${msg}`);
      }
    }
  };

  const showManualCurlCommands = (type: string) => {
    const encodedIssuerDID = encodeURIComponent(ISSUER_DID);
    
    let payload;
    if (type === 'age' && mockDob) {
      const birthday = mockDob.split('-').reverse().join('');
      payload = {
        credentialSchema: "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json/KYCAgeCredential-v3.json",
        type: "KYCAgeCredential",
        credentialSubject: {
          id: SUBJECT_DID,
          birthday: parseInt(birthday, 10),
          documentType: 2
        },
        expiration: 1903357766
      };
    } else if (type === 'recruiter' && mockCompanyInfo) {
      const companyNumbers = stringToNumbers(mockCompanyInfo.companyName);
      const employeeNumbers = stringToNumbers(mockCompanyInfo.employeeId);
      const timestamp = Date.now().toString().slice(-6);
      const uniqueY = employeeNumbers.y + timestamp;
      payload = {
        credentialSchema: "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json/auth-v1.json",
        type: "AuthBJJCredential",
        credentialSubject: {
          id: SUBJECT_DID,
          x: companyNumbers.x,
          y: uniqueY
        },
        expiration: 1903357766
      };
    } else {
      payload = {
        credentialSchema: "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json/CreatorCredential-v1.json",
        type: "CreatorCredential",
        credentialSubject: {
          id: SUBJECT_DID,
          organizationName: "DevCorp Technologies",
          hackathonsHosted: 12,
          verificationLevel: "verified"
        },
        expiration: 1903357766
      };
    }

    const createCurl = `curl -X POST "https://880557ac9c31.ngrok-free.app/v2/identities/${encodedIssuerDID}/credentials" \\
  -H "Accept: application/json" \\
  -H "Authorization: Basic dXNlci1pc3N1ZXI6cGFzc3dvcmQtaXNzdWVy" \\
  -H "ngrok-skip-browser-warning: true" \\
  -d '${JSON.stringify(payload)}'`;

    console.log(`=== ${type.toUpperCase()} CREDENTIAL CREATION CURL ===`);
    console.log(createCurl);
    
    if (type === 'recruiter' && mockCompanyInfo) {
      const companyNumbers = stringToNumbers(mockCompanyInfo.companyName);
      const employeeNumbers = stringToNumbers(mockCompanyInfo.employeeId);
      const timestamp = Date.now().toString().slice(-6);
      const uniqueY = employeeNumbers.y + timestamp;
      console.log('Conversion details:');
      console.log(`Company "${mockCompanyInfo.companyName}" -> x: ${companyNumbers.x}`);
      console.log(`Employee ID "${mockCompanyInfo.employeeId}" -> y: ${employeeNumbers.y} -> unique y: ${uniqueY}`);
    }
    console.log("=== END CURL COMMAND ===");

    navigator.clipboard.writeText(createCurl).then(() => {
      let promptMessage = `Step 1: Create ${type} Credential
The curl command has been copied to clipboard.

1. Paste and run it in your terminal
2. Copy the 'id' value from the response
3. Paste it below:
Curl command: ${createCurl}`;

      if (type === 'recruiter' && mockCompanyInfo) {
        const companyNumbers = stringToNumbers(mockCompanyInfo.companyName);
        const employeeNumbers = stringToNumbers(mockCompanyInfo.employeeId);
        promptMessage += `
CONVERSION INFO:
Company: "${mockCompanyInfo.companyName}" → x: ${companyNumbers.x}
Employee ID: "${mockCompanyInfo.employeeId}" → y: ${employeeNumbers.y}`;
      }

      const credentialId = prompt(promptMessage);

      if (credentialId) {
        handleOfferFlow(credentialId);
      }
    }).catch(() => {
      const credentialId = prompt(`Run this curl command and paste the credential ID here:\n\n${createCurl}`);
      if (credentialId) {
        handleOfferFlow(credentialId);
      }
    });
  };

  const handleOfferFlow = async (credentialId: string) => {
    const encodedIssuerDID = encodeURIComponent(ISSUER_DID);
    const offerCurl = `curl -X GET "https://880557ac9c31.ngrok-free.app/v2/identities/${encodedIssuerDID}/credentials/${credentialId}/offer?type=universalLink" \\
  -H "Accept: application/json" \\
  -H "Authorization: Basic dXNlci1pc3N1ZXI6cGFzc3dvcmQtaXNzdWVy" \\
  -H "ngrok-skip-browser-warning: true"`;

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
  } catch {
      const universalLink = prompt(`Run this curl command and paste the universalLink here:\n\n${offerCurl}`);
      if (universalLink) {
        handleUniversalLink(universalLink);
      }
    }
  };

  const handleUniversalLink = async (universalLink: string) => {
    console.log("Using Universal Link:", universalLink);
    setQrUrl(universalLink);

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
      } catch {
        alert(`Universal link: ${universalLink}`);
      }
    }
  };

  const handleCloseQR = () => {
    setQrUrl(null);
    setMockDob(null);
    setMockCompanyInfo(null);
    setSelectedType(null);
    setProofFile(null);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedType(null);
        setProofFile(null);
        setMockDob(null);
        setMockCompanyInfo(null);
  setVerifyingRecruiter(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!isConnected) {
    return (
      <button
        disabled
        className="px-4 py-2 rounded-md bg-gray-600 text-gray-400 cursor-not-allowed flex items-center gap-2 font-semibold"
      >
  <Briefcase size={16} />
        Credentials
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2 rounded-md transition-all duration-300 flex items-center gap-2 font-semibold transform hover:scale-105 ${
          isVerified
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/25'
            : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/25'
        }`}
      >
  <Briefcase size={16} />
  Credentials
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700/50 z-50">
          {!isVerified ? (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-100">
                  {selectedType ? `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Verification` : 'Identity Verification'}
                </h3>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setSelectedType(null);
                    setProofFile(null);
                  }}
                  className="text-gray-400 hover:text-gray-200"
                >
                  <X size={20} />
                </button>
              </div>
              {!selectedType ? (
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-300 mb-3">Choose Verification Type</div>
          {verificationOptions.map((option) => (
                    <button
                      key={option.id}
            onClick={() => handleVerificationSelect(option.id as 'age' | 'hackathon-creator' | 'recruiter')}
                      className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3 text-gray-100 rounded-lg"
                    >
                      {option.icon}
                      <span className="font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedType === 'recruiter' ? (
                    <div className="space-y-4">
                      {!verifyingRecruiter && !mockCompanyInfo && (
                        <>
                          <p className="text-sm text-gray-300">Verify your recruiter identity with your wallet.</p>
                          <button
                            onClick={handleOpenWalletRecruiter}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                          >
                            Open Wallet
                          </button>
                        </>
                      )}
                      {verifyingRecruiter && (
                        <div className="flex items-center justify-center gap-2 text-gray-200">
                          <Loader2 className="animate-spin" size={20} />
                          Verifying identity...
                        </div>
                      )}
                      {!verifyingRecruiter && mockCompanyInfo && (
                        <div className="flex items-center justify-center gap-2 text-green-400">
                          <CheckCircle size={18} />
                          Verified
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setSelectedType(null);
                          setProofFile(null);
                          setMockCompanyInfo(null);
                          setVerifyingRecruiter(false);
                        }}
                        className="w-full text-gray-400 hover:text-gray-200 py-2 text-sm"
                      >
                        ← Back to verification types
                      </button>
                    </div>
                  ) : (
                    <>
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
                            id="file-upload"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                            className="hidden"
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
                        disabled={!proofFile || isLoading}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="animate-spin" size={20} />
                            Processing Document...
                          </>
                        ) : (
                          'Get Credential'
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedType(null);
                          setProofFile(null);
                        }}
                        className="w-full text-gray-400 hover:text-gray-200 py-2 text-sm"
                      >
                        ← Back to verification types
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-100">
                  {selectedType ? `Get ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Credential` : 'Get Credentials'}
                </h3>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setSelectedType(null);
                    setProofFile(null);
                  }}
                  className="text-gray-400 hover:text-gray-200"
                >
                  <X size={20} />
                </button>
              </div>
              {!selectedType ? (
                <div className="space-y-2">
                  {credentialOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleGetCredentials(option.id as 'age' | 'hackathon-creator' | 'recruiter')}
                      className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3 text-gray-100 rounded-lg"
                    >
                      <Download size={16} />
                      <span className="font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Upload Document to Generate Credential
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
                        id="file-upload-credential"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      />
                      <label
                        htmlFor="file-upload-credential"
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
                    disabled={!proofFile || isLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Processing Document...
                      </>
                    ) : (
                      'Process Document'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedType(null);
                      setProofFile(null);
                    }}
                    className="w-full text-gray-400 hover:text-gray-200 py-2 text-sm"
                  >
                    ← Back to credential types
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {/* Confirmation UI for extracted data */}
      {(mockDob || mockCompanyInfo) && !qrUrl && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-gray-800 rounded-lg text-center shadow-lg border border-gray-700 z-50 p-6">
          <h3 className="text-gray-200 text-lg font-semibold mb-4">Verification Complete</h3>
          
          {mockDob && selectedType === 'age' && (
            <p className="text-gray-200 mb-4">Date of Birth: {mockDob}</p>
          )}
          
          {mockCompanyInfo && selectedType === 'recruiter' && (
            <div className="text-gray-200 mb-4">
              <p>Company: {mockCompanyInfo.companyName}</p>
              <p>Employee ID: {mockCompanyInfo.employeeId}</p>
              <div className="mt-2 p-2 bg-gray-700 rounded text-xs">
                <p>Will convert to:</p>
                <p>x: {stringToNumbers(mockCompanyInfo.companyName).x}</p>
                <p>y: {stringToNumbers(mockCompanyInfo.employeeId).y + Date.now().toString().slice(-6)} (unique)</p>
              </div>
            </div>
          )}
          
          {selectedType === 'hackathon-creator' && (
            <p className="text-gray-200 mb-4">Creator status verified</p>
          )}
          
          <button
            onClick={handleConfirm}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 mr-3"
          >
            Confirm & Get Credential
          </button>
          
          <button
            onClick={() => {
              setMockDob(null);
              setMockCompanyInfo(null);
              setSelectedType(null);
              setProofFile(null);
            }}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
      {qrUrl && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-gray-800 rounded-lg text-center shadow-lg border border-gray-700 z-50 p-6">
          <h3 className="text-gray-200 text-lg font-semibold mb-4">Scan with your phone</h3>
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
        <div className="absolute top-full right-0 mt-2 w-96 bg-yellow-900/50 rounded-lg border border-yellow-600/50 p-6 z-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-400 mt-1 flex-shrink-0" size={20} />
            <div>
              <h4 className="font-semibold mb-2">CORS Solutions:</h4>
              <ol className="list-decimal list-inside space-y-1 mb-3">
                <li>Install "CORS Unblock" browser extension</li>
                <li>Run Chrome with --disable-web-security flag (dev only)</li>
                <li>Add CORS headers to your API server</li>
                <li>Use ngrok with authentication token (paid plan)</li>
              </ol>
              <button
                onClick={() => setShowCorsHelp(false)}
                className="text-yellow-400 hover:text-yellow-300 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyDropdown;