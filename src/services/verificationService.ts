export interface QRData {
  sessionId: number;
  qrData: string;
  walletUrl: string;
  request: any;
  debug?: {
    contextUrl: string;
    queryType: string;
    agentUrl: string;
  };
}

class VerificationService {
  private baseUrl: string;
  private cachedQRData: QRData | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.baseUrl = this.getBaseUrl();
    console.log('VerificationService initialized with baseUrl:', this.baseUrl);
  }

  private getBaseUrl(): string {
    if (typeof window !== 'undefined') {
      // Check if we're running in development
      if (window.location.hostname === 'localhost') {
        return 'https://7fbab6d82de1.ngrok-free.app'; // Updated backend ngrok URL
      }
      // Use the current domain if it's a deployed version
      return `${window.location.protocol}//${window.location.host}`;
    }
    return 'https://7fbab6d82de1.ngrok-free.app'; // Updated backend ngrok URL
  }

  // Public method to get current base URL (for debugging)
  public getCurrentBaseUrl(): string {
    return this.baseUrl;
  }

  // Public method to update base URL if needed
  public updateBaseUrl(newUrl: string): void {
    this.baseUrl = newUrl;
    console.log('VerificationService baseUrl updated to:', this.baseUrl);
    // Clear cache when URL changes
    this.clearCache();
  }

  private async makeRequest(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Making request (attempt ${attempt}/${retries}) to: ${url}`);
        
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            'Accept': 'application/json',
            ...options.headers,
          },
        });

        console.log(`Response status: ${response.status}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`HTTP ${response.status}: ${errorText}`);
          
          if (response.status >= 500 && attempt < retries) {
            console.log(`Server error, retrying in ${attempt * 1000}ms...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            continue;
          }
          
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (error) {
        console.error(`Request attempt ${attempt} failed:`, error);
        
        if (attempt === retries) {
          if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('Network error: Unable to connect to verification service. Please check your internet connection.');
          }
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
    
    throw new Error('All retry attempts failed');
  }

  private validateQRData(data: any): QRData {
    if (!data) {
      throw new Error('No data received from verification service');
    }

    if (!data.sessionId) {
      throw new Error('Invalid response: missing sessionId');
    }

    if (!data.qrData) {
      throw new Error('Invalid response: missing qrData');
    }

    if (!data.walletUrl) {
      throw new Error('Invalid response: missing walletUrl');
    }

    // Validate the QR data can be parsed
    try {
      const parsedQRData = JSON.parse(data.qrData);
      
      if (!parsedQRData.body) {
        throw new Error('Invalid QR data: missing body');
      }

      if (!parsedQRData.body.scope || !Array.isArray(parsedQRData.body.scope)) {
        throw new Error('Invalid QR data: missing or invalid scope');
      }

      // Check for age verification proof request
      const hasAgeProof = parsedQRData.body.scope.some((scope: any) => 
        scope.query?.type === 'KYCAgeCredential'
      );

      if (!hasAgeProof) {
        throw new Error('Invalid QR data: missing age verification proof request');
      }

      console.log('QR data validation successful');
    } catch (parseError) {
      console.error('QR data validation failed:', parseError);
      throw new Error(`Invalid QR data format: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
    }

    return data as QRData;
  }

  public async getQRData(): Promise<QRData> {
    try {
      // Check cache first
      if (this.cachedQRData && Date.now() < this.cacheExpiry) {
        console.log('Returning cached QR data');
        return this.cachedQRData;
      }

      const url = `${this.baseUrl}/api/qr-data`;
      console.log('Fetching QR data from:', url);
      console.log('Environment DEV:', import.meta.env.DEV);
      console.log('Base URL:', this.baseUrl);

      const response = await this.makeRequest(url, {
        method: 'GET',
        cache: 'no-cache',
      });

      const data = await response.json();
      
      // Validate the response
      const validatedData = this.validateQRData(data);
      
      // Cache the result
      this.cachedQRData = validatedData;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;
      
      console.log('QR data received successfully');
      return validatedData;

    } catch (error) {
      console.error('Error in getQRData:', error);
      
      // Clear cache on error
      this.cachedQRData = null;
      this.cacheExpiry = 0;
      
      if (error instanceof Error) {
        // Provide more user-friendly error messages
        if (error.message.includes('Network error')) {
          throw new Error('Unable to connect to verification service. Please check your internet connection and try again.');
        }
        
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Verification service is temporarily unavailable. Please try again in a few moments.');
        }
        
        if (error.message.includes('JSON LD Context') || error.message.includes('Invalid protocol message')) {
          throw new Error('Verification protocol error. Please try refreshing the page and attempting verification again.');
        }
        
        throw error;
      }
      
      throw new Error('Unknown error occurred while setting up verification. Please try again.');
    }
  }

  public async checkVerificationStatus(sessionId: number): Promise<{
    completed: boolean;
    success: boolean;
    message: string;
    timestamp?: number;
  }> {
    try {
      const url = `${this.baseUrl}/api/verification-status/${sessionId}`;
      const response = await this.makeRequest(url);
      return await response.json();
    } catch (error) {
      console.error('Error checking verification status:', error);
      return {
        completed: false,
        success: false,
        message: 'Unable to check verification status'
      };
    }
  }

  public clearCache(): void {
    this.cachedQRData = null;
    this.cacheExpiry = 0;
    console.log('Verification service cache cleared');
  }
}

export const verificationService = new VerificationService();
