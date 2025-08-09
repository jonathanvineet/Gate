import path from 'path';
import express from 'express';
import { auth, resolver } from '@iden3/js-iden3-auth';
import getRawBody from 'raw-body';
import cors from 'cors';
import { fileURLToPath } from 'url';

// Simple in-memory rate limiter
class RateLimiter {
  constructor(windowMs = 60000, maxRequests = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.requests = new Map();
  }

  isAllowed(identifier) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    
    // Clean old entries
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const userRequests = this.requests.get(identifier);
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }

  getRemainingRequests(identifier) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(identifier)) {
      return this.maxRequests;
    }
    
    const userRequests = this.requests.get(identifier);
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    return Math.max(0, this.maxRequests - validRequests.length);
  }

  getResetTime(identifier) {
    if (!this.requests.has(identifier) || this.requests.get(identifier).length === 0) {
      return 0;
    }
    
    const userRequests = this.requests.get(identifier);
    const oldestRequest = Math.min(...userRequests);
    return Math.max(0, (oldestRequest + this.windowMs) - Date.now());
  }
}

// Create rate limiters for different endpoints
const qrDataLimiter = new RateLimiter(60000, 5); // 5 requests per minute
const callbackLimiter = new RateLimiter(60000, 10); // 10 requests per minute

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 8000;

// Ensure correct client IP and host when behind ngrok/proxies
app.set('trust proxy', true);

// Add support for JSON body parsing
app.use(express.json());
app.use('/v2/agent', express.text());

// Serve static files at /static path
app.use('/static', express.static(path.join(__dirname, "../static")));

// New, pattern-based allowlist with optional env overrides
const allowedOriginPatterns = [
  /^http:\/\/localhost(:\d+)?$/,
  /^https:\/\/[a-z0-9-]+\.ngrok-free\.app$/,
  /^https:\/\/wallet\.privado\.id$/
];
const extraAllowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow non-browser clients
    if (extraAllowedOrigins.includes(origin) || allowedOriginPatterns.some(rx => rx.test(origin))) {
      return callback(null, true);
    }
    return callback(null, false); // Do not throw; returning false disables CORS for that origin without 500
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'ngrok-skip-browser-warning'],
  credentials: false
}));

// Global preflight handler to guarantee CORS headers on any OPTIONS route
app.use((req, res, next) => {
  if (req.method !== 'OPTIONS') return next();

  const origin = req.headers.origin;
  const isAllowed =
    !origin ||
    extraAllowedOrigins.includes(origin) ||
    allowedOriginPatterns.some(rx => rx.test(origin));

  if (origin && isAllowed) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  } else if (!origin) {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, ngrok-skip-browser-warning');
  res.header('Access-Control-Max-Age', '86400');

  // Optional: debug to confirm this path is hit
  console.log('CORS preflight:', { origin, path: req.path });

  return res.status(204).end();
});

// Middleware to check rate limiting
function checkRateLimit(limiter, key, res) {
  if (!limiter.isAllowed(key)) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests, please try again later',
      remaining: limiter.getRemainingRequests(key),
      resetIn: limiter.getResetTime(key)
    });
  }
}

app.get("/api/sign-in", (req, res) => {
  console.log("get Auth Request");
  getAuthRequest(req, res);
});

app.post("/api/callback", (req, res) => {
  const rateLimitCheck = checkRateLimit(callbackLimiter, req.ip, res);
  if (rateLimitCheck) return rateLimitCheck;
  console.log("Callback received");
  console.log("Host:", req.get("host"));
  console.log("Protocol:", req.protocol);
  console.log("Session ID:", req.query.sessionId);
  callback(req, res);
});

// Add this route to serve index.html at the root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../static/index.html'));
});

// Create a test endpoint to verify API works
app.get("/api/test", (req, res) => {
  res.status(200).json({ message: "API is working!" });
});

// Add better CORS handling for the v2/agent endpoint
app.options('/v2/agent', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  res.status(204).end();
});

const ISSUER_URL = 'https://880557ac9c31.ngrok-free.app'; // your issuer ngrok URL (updated)

// Proxy agent requests to the issuer
app.all('/v2/agent', async (req, res) => {
  try {
    console.log('Proxying agent request to issuer:', req.body);
    const issuerResponse = await fetch(`${ISSUER_URL}/v2/agent`, {
      method: req.method,
      headers: {
        'Content-Type': 'text/plain',
      },
      body: req.body,
    });
    console.log('Issuer response status:', issuerResponse.status);
    const data = await issuerResponse.json();
    console.log('Issuer response data:', data);
    res.status(issuerResponse.status).json(data);
  } catch (error) {
    console.error('Error proxying to issuer:', error);
    res.status(500).json({ error: 'Failed to proxy request to issuer' });
  }
});

// Add this new endpoint for QR data that the verification modal is trying to access
app.get("/api/qr-data", (req, res) => {
  const rateLimitCheck = checkRateLimit(qrDataLimiter, req.ip, res);
  if (rateLimitCheck) return rateLimitCheck;
  console.log("get QR Data for React");
  // Just call generateQRData, do not set CORS headers manually
  generateQRData(req, res);
});

// Add OPTIONS handler for QR data endpoint
app.options("/api/qr-data", (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, ngrok-skip-browser-warning');
  res.header('Access-Control-Max-Age', '86400');
  res.status(204).end();
});

// Ensure preflight for verification status succeeds
app.options('/api/verification-status/:sessionId', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, ngrok-skip-browser-warning');
  res.header('Access-Control-Max-Age', '86400');
  // Optional: debug to confirm this path is hit
  console.log('CORS preflight (verification-status):', { origin: req.headers.origin, path: req.path });
  res.status(204).end();
});

app.get("/api/verification-status/:sessionId", (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Vary', 'Origin');
    const sessionId = req.params.sessionId;
    const result = verificationResults.get(sessionId);
    return res.status(200).json({
      completed: !!result,
      success: result?.success || false,
      message: result?.message || '',
      timestamp: result?.timestamp || null,
      credentialDetails: result?.response?.verifications?.[0]?.proof?.credential?.credentialSubject || null
    });
  } catch (e) {
    console.error('verification-status error:', e);
    return res.status(200).json({
      completed: false,
      success: false,
      message: '',
      timestamp: null,
      credentialDetails: null
    });
  }
});

app.listen(port, () => {
  console.log("server running on port 8000");
});

// Create a map to store the auth requests and their session IDs
const requestMap = new Map();

function replaceLocalhostUrls(obj, ngrokUrl) {
  if (typeof obj === 'string') {
    return obj.replace(/localhost:\d+|localhost/g, ngrokUrl.replace('https://', ''));
  }
  if (typeof obj === 'object' && obj !== null) {
    for (let key in obj) {
      obj[key] = replaceLocalhostUrls(obj[key], ngrokUrl);
    }
  }
  return obj;
}

const ISSUER_DID = "did:polygonid:polygon:amoy:2qVM1DRgEDDd2RYn7PETLbCUqbgUSNqCVEfrnFkCVs"; // Updated issuer DID
const SUBJECT_DID = "did:iden3:privado:main:2ScwqMj93k1wGLto2qp7MJ6UNzRULo8jnVcf23rF8M";

// GetQR returns auth request
async function getAuthRequest(req, res) {
  try {
    // Audience is verifier id
    const sessionId = Date.now();
    const callbackURL = "/api/callback";
    
    // Force HTTPS for ngrok URLs
    let hostUrl;
    if (req.get("host").includes("ngrok")) {
      hostUrl = `https://${req.get("host")}`;
    } else {
      hostUrl = "https://53da73e8d660.ngrok-free.app"; // Updated backend ngrok URL
    }
    
    const audience = ISSUER_DID;
    const uri = `${hostUrl}${callbackURL}?sessionId=${sessionId}`;
    
    console.log("Using callback URI:", uri);

    // Generate request for basic authentication with proper structure
    const request = auth.createAuthorizationRequest("Age Verification Request", audience, uri);

    // Set agent URL to your own server instance
    request.agentUrl = `${ISSUER_URL}/v2/agent`;
    
    // Add request for a specific proof with corrected context
    const proofRequest = {
      id: 1,
      circuitId: "credentialAtomicQuerySigV2",
      query: {
        allowedIssuers: ["*"],
        type: "KYCAgeCredential",
        context: "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld",
        credentialSubject: {
          birthday: {
            $lt: 20060101 // Born before 2006 (18+ years old)
          }
        }
      }
    };

    // Ensure body exists and has proper structure
    if (!request.body) {
      request.body = {};
    }
    
    const scope = request.body.scope ?? [];
    request.body.scope = [...scope, proofRequest];

    // Add proper message structure
    request.body.callbackUrl = uri;
    request.body.reason = "Age verification for accessing 18+ staking pools";
    request.body.message = "Please verify your age to access restricted content";

    // Store auth request in map associated with session ID
    requestMap.set(`${sessionId}`, request);

    console.log("Full authorization request:", JSON.stringify(request, null, 2));

    return res.status(200).set("Content-Type", "application/json").send(request);
  } catch (error) {
    console.error("Error generating auth request:", error);
    return res.status(500).json({ 
      error: "Failed to generate authorization request",
      message: error.message 
    });
  }
}

// Store verification results
const verificationResults = new Map();

// Callback verifies the proof after sign-in callbacks
async function callback(req, res) {
  try {
    const sessionId = req.query.sessionId;
    const raw = await getRawBody(req);
    const tokenStr = raw.toString().trim();

    console.log("Callback sessionId:", sessionId);
    console.log("Callback token length:", tokenStr.length);

    if (!tokenStr) {
      throw new Error("No token received in callback");
    }

    const keyDIR = "../keys";

    const resolvers = {
      ["polygon:amoy"]: new resolver.EthStateResolver(
        "https://rpc-amoy.polygon.technology",
        "0x1a4cC30f2aA0377b0c3bc9848766D90cb4404124"
      ),
      ["privado:main"]: new resolver.EthStateResolver(
        "https://rpc-mainnet.privado.id",
        "0x3C9acB2205Aa72A05F6D77d708b5Cf85FCa3a896"
      ),
    };

    // Fetch authRequest from sessionID
    const authRequest = requestMap.get(`${sessionId}`);

    if (!authRequest) {
      console.error("Auth request not found for session:", sessionId);
      throw new Error("Invalid session - auth request not found");
    }

    console.log("Found auth request for session:", sessionId);

    // EXECUTE VERIFICATION with enhanced options
    const verifier = await auth.Verifier.newVerifier({
      stateResolver: resolvers,
      circuitsDir: path.join(__dirname, keyDIR),
      ipfsGatewayURL: "https://ipfs.io",
      AcceptedStateTransitionDelay: 5 * 60 * 1000, // 5 minutes
    });

    const opts = {
      acceptedStateTransitionDelay: 5 * 60 * 1000,
      acceptedProofGenerationDelay: 5 * 60 * 1000
    };

    const authResponse = await verifier.fullVerify(tokenStr, authRequest, opts);
    console.log("Verification successful for session:", sessionId);

    // Store verification result
    verificationResults.set(sessionId, {
      success: true,
      message: 'Age verification completed successfully!',
      timestamp: Date.now(),
      response: authResponse
    });

    // Return success HTML with enhanced messaging
    return res.set('ngrok-skip-browser-warning', 'true').send(`
      <html>
        <head>
          <title>Age Verification Complete</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              margin: 0;
            }
            .container { 
              background: rgba(255, 255, 255, 0.1); 
              padding: 40px; 
              border-radius: 20px; 
              backdrop-filter: blur(10px);
              max-width: 400px;
              margin: 0 auto;
            }
            .success { color: #4ade80; font-size: 48px; margin-bottom: 20px; }
            .title { font-size: 24px; margin-bottom: 15px; font-weight: 600; }
            .message { font-size: 16px; margin-bottom: 10px; opacity: 0.9; }
            .small { font-size: 12px; opacity: 0.7; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success">✅</div>
            <div class="title">Age Verification Successful!</div>
            <div class="message">You are verified as 18+ years old</div>
            <div class="message">You can now access all staking pools</div>
            <div class="small">This window will close automatically...</div>
          </div>
          
          <script>
            console.log('🚀 Age verification callback page loaded');
            
            function sendSuccessMessage() {
              const message = {
                type: 'verificationSuccess',
                sessionId: '${sessionId}',
                message: 'Age verification completed successfully! You are now verified as 18+ years old.',
                timestamp: Date.now(),
                verificationType: 'age'
              };
              
              console.log('📤 Sending age verification SUCCESS message:', message);
              
              // Try multiple methods to communicate with parent
              if (window.opener) {
                window.opener.postMessage(message, '*');
                console.log('✅ Message sent via window.opener');
              }
              
              if (window.parent !== window) {
                window.parent.postMessage(message, '*');
                console.log('✅ Message sent via window.parent');
              }
              
              // Broadcast to all windows
              try {
                parent.postMessage(message, '*');
              } catch (e) {
                console.log('Broadcast attempt failed:', e.message);
              }
            }
            
            // Send message multiple times to ensure delivery
            sendSuccessMessage();
            setTimeout(sendSuccessMessage, 500);
            setTimeout(sendSuccessMessage, 1000);
            
            // Auto-close window
            setTimeout(() => {
              console.log('🔒 Auto-closing verification window');
              try {
                window.close();
              } catch (e) {
                console.log('Window close failed:', e.message);
              }
            }, 3000);
          </script>
        </body>
      </html>
    `);

  } catch (error) {
    console.error("Verification error:", error);
    
    const sessionId = req.query.sessionId;
    
    // Store failure result
    verificationResults.set(sessionId, {
      success: false,
      message: `Age verification failed: ${error.message}`,
      timestamp: Date.now(),
      error: error.message
    });
    
    // Return failure HTML
    return res.set('ngrok-skip-browser-warning', 'true').send(`
      <html>
        <head>
          <title>Verification Failed</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
              color: white;
              margin: 0;
            }
            .container { 
              background: rgba(255, 255, 255, 0.1); 
              padding: 40px; 
              border-radius: 20px; 
              backdrop-filter: blur(10px);
              max-width: 400px;
              margin: 0 auto;
            }
            .error { color: #fca5a5; font-size: 48px; margin-bottom: 20px; }
            .title { font-size: 24px; margin-bottom: 15px; font-weight: 600; }
            .message { font-size: 16px; margin-bottom: 10px; opacity: 0.9; }
            .small { font-size: 12px; opacity: 0.7; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error">❌</div>
            <div class="title">Age Verification Failed</div>
            <div class="message">Unable to verify your age credentials</div>
            <div class="message">Please try again or contact support</div>
            <div class="small">Error: ${error.message}</div>
            <div class="small">This window will close automatically...</div>
          </div>
          
          <script>
            console.log('🚀 Verification failure callback page loaded');
            
            function sendFailureMessage() {
              const message = {
                type: 'verificationFailure',
                sessionId: '${sessionId}',
                message: 'Age verification failed: ${error.message}',
                error: '${error.message}',
                timestamp: Date.now()
              };
              
              console.log('📤 Sending age verification FAILURE message:', message);
              
              if (window.opener) {
                window.opener.postMessage(message, '*');
              }
              
              if (window.parent !== window) {
                window.parent.postMessage(message, '*');
              }
            }
            
            sendFailureMessage();
            setTimeout(sendFailureMessage, 500);
            
            setTimeout(() => {
              console.log('🔒 Auto-closing verification window');
              try {
                window.close();
              } catch (e) {
                console.log('Window close failed:', e.message);
              }
            }, 3000);
          </script>
        </body>
      </html>
    `);
  }
}

// Function to generate QR data
async function generateQRData(req, res) {
  try {
    // Audience is verifier id
    const sessionId = Date.now(); // Use timestamp for unique session ID
    const callbackURL = "/api/callback";
    
    // Force HTTPS for ngrok URLs
    let hostUrl;
    if (req.get("host").includes("ngrok")) {
      hostUrl = `https://${req.get("host")}`;
    } else {
      // For local development, force the ngrok URL instead of localhost
      hostUrl = "https://53da73e8d660.ngrok-free.app"; // Updated backend ngrok URL
    }
    const audience = ISSUER_DID;
    const uri = `${hostUrl}${callbackURL}?sessionId=${sessionId}`;    
    
    console.log("Using callback URI for QR data:", uri);
    
    // Generate request for basic authentication with proper message structure
    const request = auth.createAuthorizationRequest("Age Verification", audience, uri);

    // Set agent URL
    request.agentUrl = `${ISSUER_URL}/v2/agent`;

    // Enhanced proof request with proper context and query structure
    const proofRequest = {
      id: 1,
      circuitId: "credentialAtomicQuerySigV2",
      query: {
        allowedIssuers: ["*"],
        type: "KYCAgeCredential",
        context: "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld",
        credentialSubject: {
          birthday: {
            $lt: 20060101 // Must be born before 2006-01-01 (18+ years old)
          }
        }
      }
    };

    // Ensure proper request body structure
    if (!request.body) {
      request.body = {};
    }

    // Set required fields
    request.body.callbackUrl = uri;
    request.body.reason = "Age verification required";
    request.body.message = "Please verify that you are 18 years or older";
    
    const scope = request.body.scope ?? [];
    request.body.scope = [...scope, proofRequest];

    // Store auth request
    requestMap.set(`${sessionId}`, request);

    // Create wallet URL with proper encoding
    const requestString = JSON.stringify(request);
    const encodedRequest = Buffer.from(requestString).toString('base64');
    const walletUrl = `https://wallet.privado.id/#i_m=${encodedRequest}`;

    // Return structured response
    const responseData = {
      sessionId,
      qrData: requestString,
      walletUrl,
      request: request,
      debug: {
        contextUrl: proofRequest.query.context,
        queryType: proofRequest.query.type,
        agentUrl: request.agentUrl
      }
    };
    
    console.log('QR Data generated successfully');
    console.log('Context URL:', proofRequest.query.context);
    
    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Error generating QR data:', error);
    return res.status(500).json({ 
      error: 'Failed to generate QR data',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Global error handler (keep last)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const origin = req.headers.origin || '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Vary', 'Origin');
  if (typeof err?.message === 'string' && err.message.toLowerCase().includes('cors')) {
    return res.status(403).json({ error: 'CORS not allowed', origin });
  }
  return res.status(500).json({ error: 'Internal Server Error' });
});