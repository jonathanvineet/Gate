import express from 'express';
import cors from 'cors';

const app = express();
const port = 3001;

// Enable CORS for all routes
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: false
}));

// Add support for JSON body parsing
app.use(express.json());

// Handle preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.sendStatus(200);
});

// Agent endpoint for credential status verification
app.all('/v2/agent', (req, res) => {
  console.log('Agent request received:', req.method);
  console.log('Agent request headers:', req.headers);
  console.log('Agent request body:', req.body);
  
  // Add CORS headers explicitly
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Return appropriate response based on the request
  if (req.method === 'POST') {
    // Handle credential status verification
    return res.status(200).json({
      revoked: false,
      statusCode: 200,
      message: "Credential is valid and not revoked"
    });
  } else {
    // Handle other requests
    return res.status(200).json({
      status: "success",
      message: "Agent endpoint is working"
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.status(200).json({ status: 'Agent server is running' });
});

app.listen(port, () => {
  console.log(`Agent server running on port ${port}`);
});
