export interface QRData {
  sessionId: number;
  qrData: string;
  walletUrl: string;
  request: any;
}

export interface VerificationStatus {
  status: 'pending' | 'success' | 'failed';
  sessionId?: number;
}

class VerificationService {
  private baseUrl: string;

  constructor() {
    // Use your current ngrok URL
    this.baseUrl = '';
  }

  async getQRData(): Promise<QRData> {
    try {
      const url = `${this.baseUrl}/api/qr-data`;
      console.log('Fetching QR data from:', url);
      console.log('Environment DEV:', import.meta.env.DEV);
      console.log('Base URL:', this.baseUrl);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        mode: 'cors',
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response:', responseText.substring(0, 200));
        throw new Error('Server returned non-JSON response');
      }
      
      const data = await response.json();
      console.log('QR data received:', data);
      return data;
    } catch (error) {
      console.error('Error getting QR data:', error);
      throw error;
    }
  }

  async checkVerificationStatus(sessionId: number): Promise<VerificationStatus> {
    // This would need to be implemented on the server side
    // For now, we'll use URL parameters to detect verification result
    const urlParams = new URLSearchParams(window.location.search);
    const verification = urlParams.get('verification');
    
    if (verification === 'success') {
      return { status: 'success', sessionId };
    } else if (verification === 'failed') {
      return { status: 'failed', sessionId };
    }
    
    return { status: 'pending', sessionId };
  }

  openWallet(walletUrl: string): void {
    window.open(walletUrl, '_blank');
  }
}

export const verificationService = new VerificationService();
