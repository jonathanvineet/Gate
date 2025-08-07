export interface QRData {
  qrData: string;
  sessionId: number;
  walletUrl: string;
  request?: any;
}

class VerificationService {
  private baseUrl = 'http://localhost:8000'; // Changed from 8001 to 8000
  private cache = new Map<string, QRData>();

  async getQRData(): Promise<QRData> {
    const cacheKey = 'age_verification_qr';
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      console.log('Using cached QR data');
      return this.cache.get(cacheKey)!;
    }

    try {
      console.log('Fetching fresh QR data from:', `${this.baseUrl}/api/qr-data`);
      
      const response = await fetch(`${this.baseUrl}/api/qr-data`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Raw server response:', data);

      const validatedData = this.validateQRData(data);
      
      // Cache the validated data
      this.cache.set(cacheKey, validatedData);
      
      return validatedData;
    } catch (error) {
      console.error('Error in getQRData:', error);
      throw error;
    }
  }

  private validateQRData(data: any): QRData {
    try {
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format: Expected object');
      }

      if (!data.qrData) {
        throw new Error('Missing qrData field in response');
      }

      if (!data.sessionId) {
        throw new Error('Missing sessionId field in response');
      }

      const qrData = data.qrData;
      const walletUrl = data.walletUrl;
      
      // Validate that qrData is a string
      if (typeof qrData !== 'string') {
        throw new Error('qrData must be a string');
      }

      if (typeof walletUrl !== 'string') {
        throw new Error('walletUrl must be a string');
      }

      // For QR codes, we want the wallet URL, not the JSON
      // The mobile wallet needs a direct URL to open
      const finalQrData = walletUrl.startsWith('https://wallet.privado.id/') ? walletUrl : qrData;

      console.log('Using wallet URL for QR code:', finalQrData);

      return {
        qrData: finalQrData, // Use wallet URL for QR code scanning
        sessionId: data.sessionId,
        walletUrl: walletUrl, // Separate wallet URL for button clicks
        request: data.request
      };

    } catch (error) {
      console.error('QR data validation failed:', error);
      throw new Error(`Invalid QR data format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  clearCache(): void {
    this.cache.clear();
    console.log('VerificationService cache cleared');
  }

  async checkVerificationStatus(sessionId: number): Promise<{
    completed: boolean;
    success: boolean;
    message: string;
    timestamp?: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/verification-status/${sessionId}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking verification status:', error);
      return {
        completed: false,
        success: false,
        message: 'Failed to check verification status'
      };
    }
  }
}

export const verificationService = new VerificationService();
