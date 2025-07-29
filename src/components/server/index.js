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

// Add support for JSON body parsing
app.use(express.json());

// Serve static files at /static path
app.use('/static', express.static(path.join(__dirname, "../static")));

// Replace this:
const allowedOrigins = [
  'http://localhost:5173',
  'https://7e0f9b142388.ngrok-free.app', // your frontend ngrok URL
  'https://a402836e773f.ngrok-free.app', // your backend ngrok URL (optional)
  'https://wallet.privado.id'
];
app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'ngrok-skip-browser-warning'],
  credentials: false
}));

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

// Improve existing agent endpoint
app.all('/v2/agent', (req, res) => {
  console.log('Agent request received:', req.method);
  console.log('Agent request headers:', req.headers);
  console.log('Agent request body:', req.body);
  
  // Do not set CORS headers manually here
  return res.status(200).json({
    revoked: false,
    statusCode: 200,
    message: "Credential is valid and not revoked"
  });
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

const ISSUER_DID = "did:polygonid:polygon:amoy:2qY78akW9i87q2hKuPpjP3ews85TnvZPrcJwHBra1a";
const SUBJECT_DID = "did:iden3:privado:main:2ScwqMj93k1wGLto2qp7MJ6UNzRULo8jnVcf23rF8M";

// GetQR returns auth request
async function getAuthRequest(req, res) {
  // Audience is verifier id
  const sessionId = 1;
  const callbackURL = "/api/callback";
  
  // Force HTTPS for ngrok URLs
  let hostUrl;
  if (req.get("host").includes("ngrok")) {
    hostUrl = `https://${req.get("host")}`;
  } else {
    // For local development, force the ngrok URL instead of localhost
    hostUrl = "https://a402836e773f.ngrok-free.app"; // Replace with your actual ngrok URL
  }
  
  const audience = ISSUER_DID;

  const uri = `${hostUrl}${callbackURL}?sessionId=${sessionId}`;
  
  console.log("Using callback URI:", uri);

  // Generate request for basic authentication
  const request = auth.createAuthorizationRequest("test flow", audience, uri);

  // Set agent URL to your own server instance
  // Use the server that's already running
  request.agentUrl = "https://a402836e773f.ngrok-free.app/v2/agent";
  
  // Force all URLs in the request to use ngrok URLs instead of localhost
  if (request.from && request.from.includes('localhost')) {
    request.from = request.from.replace('localhost:3000', 'a402836e773f.ngrok-free.app');
  }
  
  if (request.thid && typeof request.thid === 'string' && request.thid.includes('localhost')) {
    request.thid = request.thid.replace('localhost:3000', 'a402836e773f.ngrok-free.app');
  }
  
  // Check if there are any URLs in the request body
  if (request.body) {
    const bodyStr = JSON.stringify(request.body);
    if (bodyStr.includes('localhost')) {
      const updatedBodyStr = bodyStr.replace(/localhost:3000/g, 'a402836e773f.ngrok-free.app');
      request.body = JSON.parse(updatedBodyStr);
    }
  }
  
  // Add request for a specific proof
  const proofRequest = {
    id: 1,
    circuitId: "credentialAtomicQuerySigV2",
    query: {
      allowedIssuers: ["*"],
      type: "KYCAgeCredential",
      context: "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld",
      credentialSubject: {
        birthday: {
          $lt: 20000101,
        },
      },
    },
  };
  const scope = request.body.scope ?? [];
  request.body.scope = [...scope, proofRequest];

  // Store auth request in map associated with session ID
  requestMap.set(`${sessionId}`, request);

  // Log the full request for debugging
  console.log("Full authorization request:", JSON.stringify(request, null, 2));

  const ngrokHost = "a402836e773f.ngrok-free.app";
  const ngrokUrl = `https://${ngrokHost}`;
  
  // Replace localhost URLs in the request object
  const fullRequest = replaceLocalhostUrls(request, ngrokHost);

  // Encode the request URL for debugging
  const encodedUrl = Buffer.from(JSON.stringify(fullRequest)).toString('base64');
  console.log("Encoded URL:", encodedUrl);

  // Send the updated request
  return res.status(200).set("Content-Type", "application/json").send(fullRequest);
}

// Store verification results
const verificationResults = new Map();

// Add verification status endpoint
app.get("/api/verification-status/:sessionId", (req, res) => {
  const sessionId = req.params.sessionId;
  const result = verificationResults.get(sessionId);
  
  res.json({
    completed: !!result,
    success: result?.success || false,
    message: result?.message || '',
    timestamp: result?.timestamp || null
  });
});

// Callback verifies the proof after sign-in callbacks
async function callback(req, res) {
  try {
    // Get session ID from request
    const sessionId = req.query.sessionId;

    // get JWZ token params from the post request
    const raw = await getRawBody(req);
    const tokenStr = raw.toString().trim();

    console.log("Callback sessionId:", sessionId);
    console.log("Callback raw body:", tokenStr);

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

    // fetch authRequest from sessionID
    const authRequest = requestMap.get(`${sessionId}`);

    if (!authRequest) {
      console.error("Auth request not found for session:", sessionId);
      return res.status(400).send({ error: "Invalid session" });
    }

    // EXECUTE VERIFICATION
    const verifier = await auth.Verifier.newVerifier({
      stateResolver: resolvers,
      circuitsDir: path.join(__dirname, keyDIR),
      ipfsGatewayURL: "https://ipfs.io",
      AcceptedStateTransitionDelay: 5 * 60 * 1000, // 5 minute
    });
    const opts = {};
    const authResponse = await verifier.fullVerify(tokenStr, authRequest, opts);
    console.log("Verification successful:", authResponse);

    // Store verification result
    verificationResults.set(sessionId, {
      success: true,
      message: 'Verification completed successfully!',
      timestamp: Date.now()
    });

    // Send HTML with JavaScript that posts message to parent window
    return res.set('ngrok-skip-browser-warning', 'true').send(`
      <html>
        <head>
          <title>Verification Complete</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f0f8ff; }
            .success { color: #22c55e; font-size: 24px; margin-bottom: 20px; }
            .message { color: #333; font-size: 16px; margin-bottom: 10px; }
            .small { color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="success">✅ Verification Successful!</div>
          <div class="message">Your identity has been verified.</div>
          <div class="small">This window will close automatically...</div>
          <div class="small" style="margin-top: 10px;">Session: ${sessionId}</div>
          
          <script>
            console.log('🚀 Callback page loaded - sending postMessage to parent');
            console.log('window.opener exists:', !!window.opener);
            console.log('window.parent exists:', !!window.parent);
            console.log('Session ID:', '${sessionId}');
            
            function sendMessage() {
              const message = {
                type: 'verificationSuccess',
                sessionId: '${sessionId}',
                message: 'Verification completed successfully! Your identity has been verified.',
                timestamp: Date.now()
              };
              
              console.log('📤 Attempting to send SUCCESS message:', message);
              
              let sent = false;
              
              // Try window.opener (popup scenario)
              if (window.opener && typeof window.opener.postMessage === 'function') {
                console.log('📤 Sending via window.opener');
                window.opener.postMessage(message, '*');
                sent = true;
              }
              
              // Try window.parent (iframe scenario)
              if (window.parent && window.parent !== window && typeof window.parent.postMessage === 'function') {
                console.log('📤 Sending via window.parent');
                window.parent.postMessage(message, '*');
                sent = true;
              }
              
              // Try to broadcast to all windows (last resort)
              if (!sent) {
                console.log('📤 Broadcasting message');
                // This won't work due to security restrictions, but worth trying
                try {
                  parent.postMessage(message, '*');
                } catch (e) {
                  console.log('❌ Broadcast failed:', e.message);
                }
              }
              
              return sent;
            }
            
            // Try to send message multiple times
            let attempts = 0;
            const maxAttempts = 10;
            
            function attemptSend() {
              attempts++;
              console.log(\`📤 Send attempt \${attempts}/\${maxAttempts}\`);
              
              const sent = sendMessage();
              
              if (!sent && attempts < maxAttempts) {
                setTimeout(attemptSend, 500);
              } else if (sent) {
                console.log('✅ Message sent successfully');
              } else {
                console.log('❌ Failed to send message after all attempts');
              }
            }
            
            // Start sending attempts
            attemptSend();
            
            // Auto-close window after message delivery attempts
            setTimeout(() => {
              console.log('🔒 Auto-closing verification window');
              window.close();
            }, 5000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Verification error:", error);
    
    // Store verification result
    verificationResults.set(req.query.sessionId, {
      success: false,
      message: `Verification failed: ${error.message || "Unknown error"}`,
      timestamp: Date.now()
    });
    
    // Send HTML with JavaScript for failure case
    return res.set('ngrok-skip-browser-warning', 'true').send(`
      <html>
        <head>
          <title>Verification Failed</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #fff5f5; }
            .error { color: #ef4444; font-size: 24px; margin-bottom: 20px; }
            .message { color: #333; font-size: 16px; margin-bottom: 10px; }
            .small { color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="error">❌ Verification Failed</div>
          <div class="message">Please try again.</div>
          <div class="small">This window will close automatically...</div>
          
          <script>
            console.log('🚀 Callback page loaded (FAILED) - sending postMessage to parent');
            console.log('window.opener exists:', !!window.opener);
            console.log('Error:', '${error.message || "Unknown error"}');
            
            function sendMessage() {
              if (window.opener && typeof window.opener.postMessage === 'function') {
                const message = {
                  type: 'verificationFailure',
                  sessionId: '${req.query.sessionId}',
                  message: 'Verification failed: ${error.message || "Unknown error"}',
                  error: '${error.message || "Unknown error"}',
                  timestamp: Date.now()
                };
                
                console.log('📤 Sending FAILURE message to parent:', message);
                window.opener.postMessage(message, '*');
                return true;
              } else {
                console.error('❌ No opener window available or postMessage not supported');
                return false;
              }
            }
            
            // Try to send message immediately
            const sent = sendMessage();
            
            // Try again after a short delay
            if (sent) {
              setTimeout(sendMessage, 100);
            }
            
            // Auto-close window
            setTimeout(() => {
              console.log('🔒 Auto-closing verification window');
              window.close();
            }, 2000);
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
      hostUrl = "https://a402836e773f.ngrok-free.app"; // Replace with your actual ngrok URL
    }
    const audience = ISSUER_DID;
    const uri = `${hostUrl}${callbackURL}?sessionId=${sessionId}`;    
    
    console.log("Using callback URI for QR data:", uri);
    
    // Generate request for basic authentication
    const request = auth.createAuthorizationRequest("test flow", audience, uri);

    // Set agent URL to your own server
    request.agentUrl = `${hostUrl}/v2/agent`;

    // Add request for a specific proof
    const proofRequest = {
      id: 1,
      circuitId: "credentialAtomicQuerySigV2",
      query: {
        allowedIssuers: ["*"],
        type: "KYCAgeCredential",
        context: "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld",
        credentialSubject: {
          birthday: {
            $lt: 20000101,
          },
        },
      },
    };
    const scope = request.body.scope ?? [];
    request.body.scope = [...scope, proofRequest];

    // Store auth request in map associated with session ID
    requestMap.set(`${sessionId}`, request);

    // Create wallet URL
    const encodedRequest = Buffer.from(JSON.stringify(request)).toString('base64');
    const walletUrl = `https://wallet.privado.id/#i_m=${encodedRequest}`;

    // Return QR data and wallet URL
    const responseData = {
      sessionId,
      qrData: JSON.stringify(request),
      walletUrl,
      request: request
    };
    
    console.log('Sending QR data response');
    
    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Error generating QR data:', error);
    return res.status(500).json({ 
      error: 'Failed to generate QR data',
      message: error.message 
    });
  }
}