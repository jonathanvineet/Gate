export interface RecruiterCredential {
  credential: {
    id: string;
    credentialSubject: {
      id: string;
      type: string;
      x: string;
      y: string;
    };
    type: string[];
    issuer: string;
  };
}

export interface RecruiterVerificationRequest {
  expectedX: string; // The company identifier we expect
}

export interface RecruiterVerificationResponse {
  success: boolean;
  message: string;
  credentialFound?: boolean;
  companyMatches?: boolean;
  credentialDetails?: {
    x: string;
    y: string;
    issuer: string;
  };
}

class RecruiterVerificationService {
  private baseUrl = 'http://localhost:8000'; // Changed from 8001 to 8000

  // Generate QR data for recruiter verification request
  async generateRecruiterVerificationQR(expectedX: string): Promise<{
    qrData: string;
    sessionId: number;
    walletUrl: string;
  }> {
    const requestBody = {
      expectedX: expectedX,
      type: 'recruiter_verification_proof', // Changed to indicate proof request
      callbackUrl: `${this.baseUrl}/api/recruiter-verification-callback`
    };

    console.log('Generating recruiter PROOF verification QR with:', requestBody);

    const response = await fetch(`${this.baseUrl}/api/recruiter-verification-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Failed to generate verification request: ${response.status}`);
    }

    const data = await response.json();
    
    // For QR codes, use the wallet URL directly
    const qrData = data.walletUrl || data.qrData;
    
    return {
      qrData: qrData, // Use wallet URL for QR code
      sessionId: data.sessionId || Date.now(),
      walletUrl: data.walletUrl || qrData
    };
  }

  // Check verification status
  async checkVerificationStatus(sessionId: number): Promise<RecruiterVerificationResponse> {
    const response = await fetch(`${this.baseUrl}/api/recruiter-verification-status/${sessionId}`, {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to check verification status: ${response.status}`);
    }

    return await response.json();
  }

  // Verify a recruiter credential manually (for testing)
  verifyRecruiterCredential(credential: RecruiterCredential, expectedX: string): RecruiterVerificationResponse {
    try {
      // Check if it's an AuthBJJCredential
      const isAuthCredential = credential.credential.type.includes('AuthBJJCredential');
      
      if (!isAuthCredential) {
        return {
          success: false,
          message: 'Invalid credential type. Expected AuthBJJCredential.',
          credentialFound: true,
          companyMatches: false
        };
      }

      // Check if the x value matches (company identifier)
      const credentialX = credential.credential.credentialSubject.x;
      const companyMatches = credentialX === expectedX;

      if (companyMatches) {
        return {
          success: true,
          message: 'Recruiter verification successful! Company credentials verified.',
          credentialFound: true,
          companyMatches: true,
          credentialDetails: {
            x: credentialX,
            y: credential.credential.credentialSubject.y,
            issuer: credential.credential.issuer
          }
        };
      } else {
        return {
          success: false,
          message: `Company identifier mismatch. Expected: ${expectedX}, Found: ${credentialX}`,
          credentialFound: true,
          companyMatches: false,
          credentialDetails: {
            x: credentialX,
            y: credential.credential.credentialSubject.y,
            issuer: credential.credential.issuer
          }
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to verify credential: ' + (error instanceof Error ? error.message : 'Unknown error'),
        credentialFound: false,
        companyMatches: false
      };
    }
  }

  // Helper to convert company name to x value (same logic as in VerifyDropdown)
  stringToNumbers(str: string): { x: string, y: string } {
    const cleanStr = str.toLowerCase().replace(/[^a-z0-9]/g, '');
    let xStr = '';
    let yStr = '';
    
    for (let i = 0; i < cleanStr.length; i++) {
      const char = cleanStr[i];
      let num: string;
      
      if (char >= '0' && char <= '9') {
        num = char;
      } else {
        num = (char.charCodeAt(0) - 97).toString();
      }
      
      if (i % 2 === 0) {
        xStr += num;
      } else {
        yStr += num;
      }
    }
    
    const x = xStr || '12345';
    const y = yStr || '1234';
    
    return { x, y };
  }

  // Get expected X value for a company name
  getExpectedXForCompany(companyName: string): string {
    return this.stringToNumbers(companyName).x;
  }
}

export const recruiterVerificationService = new RecruiterVerificationService();
