import React, { useState, useEffect } from 'react';
import { Briefcase, Download, Shield, CheckCircle, Clock, AlertTriangle, Calendar, Trophy } from 'lucide-react';

interface RecruiterCredential {
  id: string;
  companyName: string;
  position: string;
  verificationLevel: 'basic' | 'premium' | 'enterprise';
  issuedDate: string;
  expiryDate: string;
  credentialHash: string;
  verificationStatus: 'active' | 'pending' | 'expired';
  companyDetails: {
    industry: string;
    size: string;
    location: string;
    website: string;
  };
}

interface CredentialManagerProps {
  credentialType?: 'age' | 'hackathon-creator' | 'recruiter';
}

// Mock data for recruiter credentials
const mockCredentials: RecruiterCredential[] = [
  {
    id: 'rec_001',
    companyName: 'TechCorp Solutions',
    position: 'Senior Technical Recruiter',
    verificationLevel: 'premium',
    issuedDate: '2024-01-15',
    expiryDate: '2025-01-15',
    credentialHash: '0x8a9b2c3d4e5f6789a1b2c3d4e5f67890abcdef12',
    verificationStatus: 'active',
    companyDetails: {
      industry: 'Software Technology',
      size: '500-1000 employees',
      location: 'San Francisco, CA',
      website: 'https://techcorp.com'
    }
  },
  {
    id: 'rec_002',
    companyName: 'Innovation Labs',
    position: 'Talent Acquisition Manager',
    verificationLevel: 'enterprise',
    issuedDate: '2024-02-01',
    expiryDate: '2025-02-01',
    credentialHash: '0x1a2b3c4d5e6f7890b2c3d4e5f6789012cdef3456',
    verificationStatus: 'active',
    companyDetails: {
      industry: 'AI & Machine Learning',
      size: '50-200 employees',
      location: 'Austin, TX',
      website: 'https://innovationlabs.ai'
    }
  },
  {
    id: 'rec_003',
    companyName: 'Global Systems Inc',
    position: 'HR Business Partner',
    verificationLevel: 'basic',
    issuedDate: '2023-12-10',
    expiryDate: '2024-12-10',
    credentialHash: '0x9f8e7d6c5b4a3928374659281047382946572839',
    verificationStatus: 'pending',
    companyDetails: {
      industry: 'Enterprise Software',
      size: '1000+ employees',
      location: 'New York, NY',
      website: 'https://globalsystems.com'
    }
  }
];

const CredentialManager: React.FC<CredentialManagerProps> = ({ credentialType = 'recruiter' }) => {
  const [credentials, setCredentials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load different credentials based on type
    setTimeout(() => {
      if (credentialType === 'recruiter') {
        setCredentials(mockCredentials);
      } else if (credentialType === 'age') {
        setCredentials([{
          id: 'age_001',
          type: 'Age Verification Certificate',
          verifiedAge: '25 years',
          issuedDate: '2024-01-15',
          expiryDate: '2025-01-15',
          credentialHash: '0xage123456789abcdef',
          verificationStatus: 'active'
        }]);
      } else if (credentialType === 'hackathon-creator') {
        setCredentials([{
          id: 'hack_001',
          type: 'Hackathon Creator Certificate',
          organizationName: 'DevCorp Technologies',
          hackathonsHosted: 12,
          issuedDate: '2024-01-15',
          expiryDate: '2025-01-15',
          credentialHash: '0xhack123456789abcdef',
          verificationStatus: 'active'
        }]);
      }
      setIsLoading(false);
    }, 1000);
  }, [credentialType]);

  const getCredentialTitle = () => {
    switch (credentialType) {
      case 'age': return 'Age Verification Certificates';
      case 'hackathon-creator': return 'Hackathon Creator Credentials';
      default: return 'Recruiter Credentials';
    }
  };

  const getCredentialIcon = () => {
    switch (credentialType) {
      case 'age': return <Calendar className="text-blue-400" size={24} />;
      case 'hackathon-creator': return <Trophy className="text-yellow-400" size={24} />;
      default: return <Briefcase className="text-purple-400" size={24} />;
    }
  };

  const downloadCredential = (credential: any) => {
    let credentialData;
    
    if (credentialType === 'age') {
      credentialData = {
        type: 'Age Verification Certificate',
        credential_id: credential.id,
        verification: {
          age_verified: credential.verifiedAge,
          status: credential.verificationStatus,
          issued_date: credential.issuedDate,
          expiry_date: credential.expiryDate,
          credential_hash: credential.credentialHash
        },
        issuer: {
          name: 'CryptoSpace Age Verification Authority',
          blockchain_network: 'Polygon',
          verification_method: 'Aadhaar Document Analysis'
        }
      };
    } else if (credentialType === 'hackathon-creator') {
      credentialData = {
        type: 'Hackathon Creator Certificate',
        credential_id: credential.id,
        creator_info: {
          organization: credential.organizationName,
          hackathons_hosted: credential.hackathonsHosted,
          status: credential.verificationStatus
        },
        verification: {
          issued_date: credential.issuedDate,
          expiry_date: credential.expiryDate,
          credential_hash: credential.credentialHash
        },
        issuer: {
          name: 'CryptoSpace Creator Verification Authority',
          blockchain_network: 'Polygon',
          verification_method: 'Portfolio and Experience Analysis'
        }
      };
    } else {
      // Recruiter credentials (existing logic)
      credentialData = {
        type: 'Recruiter Verification Credential',
        credential_id: credential.id,
        recipient: {
          company: credential.companyName,
          position: credential.position,
          industry: credential.companyDetails?.industry,
          company_size: credential.companyDetails?.size,
          location: credential.companyDetails?.location,
          website: credential.companyDetails?.website
        },
        verification: {
          level: credential.verificationLevel,
          status: credential.verificationStatus,
          issued_date: credential.issuedDate,
          expiry_date: credential.expiryDate,
          credential_hash: credential.credentialHash
        },
        issuer: {
          name: 'CryptoSpace Verification Authority',
          blockchain_network: 'Polygon',
          verification_method: 'Document Analysis + Company Verification'
        }
      };
    }

    const blob = new Blob([JSON.stringify(credentialData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${credentialType}-credential-${credential.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'pending':
        return <Clock className="text-yellow-500" size={20} />;
      case 'expired':
        return <AlertTriangle className="text-red-500" size={20} />;
      default:
        return <Shield className="text-gray-500" size={20} />;
    }
  };

  const getVerificationBadge = (level: string) => {
    const colors = {
      basic: 'bg-blue-100 text-blue-800 border-blue-200',
      premium: 'bg-purple-100 text-purple-800 border-purple-200',
      enterprise: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[level as keyof typeof colors]}`}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your {credentialType} credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getCredentialIcon()}
          <h2 className="text-2xl font-bold text-white">{getCredentialTitle()}</h2>
        </div>
        <div className="text-sm text-gray-400">
          {credentials.length} credential{credentials.length !== 1 ? 's' : ''} available
        </div>
      </div>

      <div className="grid gap-4">
        {credentials.map((credential) => (
          <div
            key={credential.id}
            className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-purple-500/50 transition-all duration-300"
          >
            {credentialType === 'recruiter' ? (
              // Existing recruiter credential layout
              <>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-2 rounded-lg">
                      <Briefcase className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{credential.companyName}</h3>
                      <p className="text-gray-400 text-sm">{credential.position}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(credential.verificationStatus)}
                    {getVerificationBadge(credential.verificationLevel)}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 mb-4">
                  <h4 className="text-white font-medium mb-3">Company Details</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-400 mb-1">Industry</p>
                      <p className="text-white">{credential.companyDetails.industry}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Company Size</p>
                      <p className="text-white">{credential.companyDetails.size}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Location</p>
                      <p className="text-white">{credential.companyDetails.location}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Website</p>
                      <a 
                        href={credential.companyDetails.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {credential.companyDetails.website.replace('https://', '')}
                      </a>
                    </div>
                  </div>
                </div>
              </>
            ) : credentialType === 'age' ? (
              // Age credential layout
              <>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg">
                      <Calendar className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Age Verification Certificate</h3>
                      <p className="text-gray-400 text-sm">Verified Age: {credential.verifiedAge}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(credential.verificationStatus)}
                  </div>
                </div>
              </>
            ) : (
              // Hackathon creator layout
              <>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-2 rounded-lg">
                      <Trophy className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{credential.organizationName}</h3>
                      <p className="text-gray-400 text-sm">Hackathons Hosted: {credential.hackathonsHosted}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(credential.verificationStatus)}
                  </div>
                </div>
              </>
            )}

            {/* Common credential info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-gray-400 text-xs mb-1">Issued Date</p>
                <p className="text-white text-sm font-medium">
                  {new Date(credential.issuedDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Expiry Date</p>
                <p className="text-white text-sm font-medium">
                  {new Date(credential.expiryDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Status</p>
                <p className={`text-sm font-medium capitalize ${
                  credential.verificationStatus === 'active' ? 'text-green-400' :
                  credential.verificationStatus === 'pending' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {credential.verificationStatus}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Credential ID</p>
                <p className="text-white text-sm font-mono">
                  {credential.id}
                </p>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-3 mb-4">
              <p className="text-gray-400 text-xs mb-1">Credential Hash</p>
              <p className="text-white text-sm font-mono break-all">
                {credential.credentialHash}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {credentialType === 'age' 
                  ? 'This certificate proves your age verification status'
                  : credentialType === 'hackathon-creator'
                  ? 'This credential allows you to create and manage hackathons'
                  : 'This credential allows you to post jobs and access verified talent pools'
                }
              </div>
              <button
                onClick={() => downloadCredential(credential)}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                <Download size={16} />
                Download
              </button>
            </div>
          </div>
        ))}
      </div>

      {credentials.length === 0 && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 text-center">
          <Briefcase className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">No {getCredentialTitle()}</h3>
          <p className="text-gray-400 mb-4">
            Complete the verification process to receive your credentials
          </p>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors">
            Start Verification
          </button>
        </div>
      )}

      {/* Information Section */}
      <div className="bg-blue-50/10 border border-blue-500/20 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-3">About Credentials</h3>
        <div className="space-y-2 text-sm text-gray-300">
          <p>• <strong>Basic:</strong> Allows posting entry-level positions and accessing basic candidate profiles</p>
          <p>• <strong>Premium:</strong> Enables posting mid-level roles with advanced filtering and search capabilities</p>
          <p>• <strong>Enterprise:</strong> Full access to all features including executive search and bulk operations</p>
        </div>
        <div className="mt-4 p-3 bg-white/5 rounded-lg">
          <p className="text-xs text-gray-400">
            All credentials are blockchain-verified and can be independently validated using the provided hash.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CredentialManager;
