export interface QRData {
  sessionId: number;
  qrData: string;
  walletUrl: string;
  request: any;
}

interface RequestCache {
  data: QRData;
  timestamp: number;
  expiresIn: number;
}

class VerificationService {
  private baseUrl: string;
  private requestCache: Map<string, RequestCache> = new Map();
  private lastRequestTime: number = 0;
  private readonly MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests
  private readonly CACHE_DURATION = 60000; // 1 minute cache
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

  constructor() {
    // Use your current ngrok URL
    this.baseUrl = 'https://a402836e773f.ngrok-free.app';
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isRateLimited(): boolean {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    return timeSinceLastRequest < this.MIN_REQUEST_INTERVAL;
  }

  private getCachedData(cacheKey: string): QRData | null {
    const cached = this.requestCache.get(cacheKey);
    if (!cached) return null;
    
    const now = Date.now();
    const isExpired = (now - cached.timestamp) > cached.expiresIn;
    
    if (isExpired) {
      this.requestCache.delete(cacheKey);
      return null;
    }
    
    console.log('Returning cached QR data');
    return cached.data;
  }

  private setCachedData(cacheKey: string, data: QRData): void {
    this.requestCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      expiresIn: this.CACHE_DURATION
    });
  }

  private async makeRequest(url: string, retryCount: number = 0): Promise<QRData> {
    try {
      // Rate limiting check
      if (this.isRateLimited()) {
        const waitTime = this.MIN_REQUEST_INTERVAL - (Date.now() - this.lastRequestTime);
        console.log(`Rate limited. Waiting ${waitTime}ms before next request`);
        await this.delay(waitTime);
      }

      this.lastRequestTime = Date.now();
      
      console.log(`Making request (attempt ${retryCount + 1}/${this.MAX_RETRIES + 1}) to:`, url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        mode: 'cors',
        // Add timeout
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      console.log('Response status:', response.status);
      
      // Handle 429 (Too Many Requests) specifically
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : this.RETRY_DELAYS[Math.min(retryCount, this.RETRY_DELAYS.length - 1)];
        
        if (retryCount < this.MAX_RETRIES) {
          console.log(`Rate limited (429). Retrying after ${waitTime}ms`);
          await this.delay(waitTime);
          return this.makeRequest(url, retryCount + 1);
        } else {
          throw new Error('Rate limit exceeded. Too many requests. Please try again later.');
        }
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        
        // Retry on server errors (5xx) and some 4xx errors
        if ((response.status >= 500 || response.status === 408 || response.status === 502 || response.status === 503 || response.status === 504) && retryCount < this.MAX_RETRIES) {
          const waitTime = this.RETRY_DELAYS[Math.min(retryCount, this.RETRY_DELAYS.length - 1)];
          console.log(`Server error ${response.status}. Retrying after ${waitTime}ms`);
          await this.delay(waitTime);
          return this.makeRequest(url, retryCount + 1);
        }
        
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response:', responseText.substring(0, 200));
        throw new Error('Server returned non-JSON response');
      }
      
      const data = await response.json();
      console.log('QR data received successfully');
      return data;
      
    } catch (error) {
      // Handle network errors and timeouts
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        if (retryCount < this.MAX_RETRIES) {
          const waitTime = this.RETRY_DELAYS[Math.min(retryCount, this.RETRY_DELAYS.length - 1)];
          console.log(`Request timeout. Retrying after ${waitTime}ms`);
          await this.delay(waitTime);
          return this.makeRequest(url, retryCount + 1);
        }
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      
      // Retry on network errors
      if (error.message.includes('fetch') && retryCount < this.MAX_RETRIES) {
        const waitTime = this.RETRY_DELAYS[Math.min(retryCount, this.RETRY_DELAYS.length - 1)];
        console.log(`Network error. Retrying after ${waitTime}ms`);
        await this.delay(waitTime);
        return this.makeRequest(url, retryCount + 1);
      }
      
      throw error;
    }
  }

  async getQRData(): Promise<QRData> {
    try {
      const url = `${this.baseUrl}/api/qr-data`;
      const cacheKey = 'qr-data';
      
      // Check cache first
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      console.log('Fetching QR data from:', url);
      console.log('Environment DEV:', import.meta.env.DEV);
      console.log('Base URL:', this.baseUrl);
      
      const data = await this.makeRequest(url);
      
      // Cache the successful response
      this.setCachedData(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error('Error getting QR data:', error);
      throw error;
    }
  }

  

  openWallet(walletUrl: string): Window | null {
    return window.open(walletUrl, '_blank');
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }
}

export const verificationService = new VerificationService();
