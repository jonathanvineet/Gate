import express from 'express';

const app = express();
const port = 3001;

// Middleware to handle CORS for all requests
app.use((req, res, next) => {
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, User-Agent');
  res.header('Access-Control-Allow-Credentials', 'false');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Preflight request received for:', req.path);
    return res.status(200).end();
  }
  
  next();
});

// Parse JSON bodies
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Agent server is running',
    timestamp: new Date().toISOString(),
    port: port
  });
});

// Main agent endpoint
app.all('/v2/agent', (req, res) => {
  console.log('Agent endpoint accessed:', req.method);
  
  const responseData = {
    revoked: false,
    statusCode: 200,
    message: "Credential is valid and not revoked",
    method: req.method,
    timestamp: new Date().toISOString()
  };
  
  console.log('Sending response:', responseData);
  res.json(responseData);
});

// Catch all other routes
app.all('*', (req, res) => {
  console.log('Unhandled route:', req.method, req.path);
  res.json({
    message: 'Agent server endpoint',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Agent server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`Agent endpoint: http://localhost:${port}/v2/agent`);
});
