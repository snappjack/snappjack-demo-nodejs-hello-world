const express = require('express');
const path = require('path');
const { SnappjackServerHelper } = require('@snappjack/sdk-js/server');
require('dotenv').config();

const SNAPP_ID = process.env.SNAPP_ID ?? (()=>{throw new Error('SNAPP_ID is required')})();
const SNAPP_API_KEY = process.env.SNAPP_API_KEY ?? (()=>{throw new Error('SNAPP_API_KEY is required')})();
const SNAPPJACK_BRIDGE_SERVER_URL = process.env.SNAPPJACK_BRIDGE_SERVER_URL; // optional: only required if running a local bridge server

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Serve the Snappjack SDK from the installed npm package
app.use('/sdk', express.static('node_modules/@snappjack/sdk-js/dist'));

// Initialize Snappjack Server Helper
// Your secret API key - NEVER expose this client-side
const serverHelper = new SnappjackServerHelper({
  snappId: SNAPP_ID,
  snappApiKey: SNAPP_API_KEY, // wak_...
  serverUrl: SNAPPJACK_BRIDGE_SERVER_URL // optional: only required if running a local bridge server
});

// Secure token endpoint
app.post('/api/token', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    console.log(`Generating ephemeral token for user: ${userId}`);

    // Generate ephemeral token (expires in 10 seconds)
    const tokenData = await serverHelper.generateEphemeralToken(userId);

    console.log(`Token generated successfully, expires at: ${new Date(tokenData.expiresAt)}`);

    res.json({ token: tokenData.token });
  } catch (error) {
    console.error('Token generation failed:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Unified user session endpoint - handles all user identity scenarios
app.post('/api/user/session', async (req, res) => {
  try {
    const { existingUserId, forceNew = false } = req.body;

    // If forceNew is true, create a new user immediately
    if (forceNew) {
      console.log('Creating new user (forced)');
      const result = await serverHelper.createUser();
      console.log(`Created new user: ${result.userId}`);

      return res.json({
        userId: result.userId,
        userApiKey: result.userApiKey,
        snappId: result.snappId,
        mcpEndpoint: result.mcpEndpoint,
        createdAt: result.createdAt,
        isNew: true,
        message: 'Created new user'
      });
    }

    // If we have an existing user ID, try to validate it
    // Note: Using generateEphemeralToken as validation is a workaround
    // since the SDK doesn't provide a direct validateUser method
    if (existingUserId) {
      try {
        await serverHelper.generateEphemeralToken(existingUserId);
        console.log(`Existing user validated: ${existingUserId}`);

        return res.json({
          userId: existingUserId,
          isNew: false,
          message: 'Using existing user ID'
        });
      } catch (error) {
        console.log(`Existing user ID invalid: ${existingUserId}, creating new user`);
      }
    }

    // Create new user if no existing ID provided or validation failed
    const result = await serverHelper.createUser();
    console.log(`Created new user: ${result.userId}`);

    res.json({
      userId: result.userId,
      userApiKey: result.userApiKey,
      snappId: result.snappId,
      mcpEndpoint: result.mcpEndpoint,
      createdAt: result.createdAt,
      isNew: true,
      message: 'Created new user'
    });
  } catch (error) {
    console.error('User session management failed:', error);
    res.status(500).json({ error: 'Failed to manage user session' });
  }
});

// Get app configuration
app.get('/api/config', (req, res) => {
  res.json({
    snappId: SNAPP_ID,
    appName: 'Hello World Snapp',
    serverUrl: SNAPPJACK_BRIDGE_SERVER_URL // optional: only required if running a local bridge server
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Also serve HTML for any unmatched routes (SPA fallback)
app.get('*', (req, res, next) => {
  // Skip API routes and static assets
  if (req.path.startsWith('/api') || req.path.startsWith('/sdk')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Hello World Snapp Server running on http://localhost:${PORT}`);
  console.log(`📝 Open http://localhost:${PORT} in your browser to test the example`);
  console.log(`🔑 Make sure to set SNAPP_API_KEY in your .env file\n`);

  if (!process.env.SNAPP_API_KEY) {
    console.warn('⚠️  WARNING: SNAPP_API_KEY not found in environment variables');
    console.warn('⚠️  Copy .env.example to .env and add your API key');
  }
});