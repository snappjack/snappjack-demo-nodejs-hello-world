# Snappjack Node.js Hello World Demo

A minimal example demonstrating how to create a Snapp (Snappjack-enabled application) that AI agents can control.

## What This Example Demonstrates

This hello world app shows all four components of the Snappjack ecosystem working together:

1. **The Secure Backend**: Express.js server that handles authentication tokens and serves the SDK
2. **The Snapp**: HTML page with integrated Snappjack SDK
3. **The Snappjack Bridge**: Routes messages between your app and AI agents
4. **The AI Agent**: Your AI assistant that can control the app

When complete, you'll be able to tell an AI agent: *"Change the message on my Hello World app to 'Greetings from AI!'"* and watch it update in real-time.

## Prerequisites

1. **Snappjack Account**: Sign up at [snappjack.com](https://snappjack.com)
2. **Snapp ID**: Your unique application identifier from the Snappjack dashboard
3. **Snapp API Key**: Your secret API key starting with `wak_` from the Snappjack dashboard
4. **Node.js**: Version 16 or higher

## Quick Setup

### 1. Install Dependencies

```bash
cd snappjack-demo-nodejs-hello-world
npm install
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your Snappjack configuration:
# SNAPP_ID=your_snapp_id_from_dashboard
# SNAPP_API_KEY=wak_your_secret_api_key_here
```

### 3. Start the Server

```bash
npm start
```

The server will start at `http://localhost:3001`

### 4. Open in Browser

Navigate to `http://localhost:3001` in your web browser.

You should see:
- A "Hello, World!" title
- A shared textarea for user and agent interaction
- Control buttons for managing the app
- Connection status section (will show "Connected" when ready)
- MCP configuration details for your AI agent

### 5. Connect Your AI Agent

When the status shows "Connected", copy the MCP configuration that appears on the page and add it to your AI assistant (Claude Desktop, etc.).

### 6. Test It!

Tell your AI assistant one of these commands:
> "Write 'Hello from AI!' in the shared textarea"
> "What's currently in the shared text area?"
> "Add your message to whatever is in the textarea"

Watch the textarea update in real-time! 🎉

### 7. Optional: Toggle Authentication

The app includes a "Toggle Auth" button that allows you to enable/disable Bearer token authentication for MCP connections:

- **Auth Enabled** (default): Agents must include the Bearer token in their requests
- **Auth Disabled**: Agents can connect without authentication (useful for testing)

When you toggle authentication, you'll need to reconnect your AI assistant with the updated configuration.

## File Structure

```
snappjack-demo-nodejs-hello-world/
├── server.js          # Express backend with secure token generation and SDK serving
├── index.html         # Client-side Snapp HTML structure
├── script.js          # Client-side JavaScript with SDK integration
├── styles.css         # Application styles
├── package.json       # Dependencies and scripts
├── .env.example       # Environment variables template
├── LICENSE            # MIT License
└── README.md         # This file

Note: The SDK is served from node_modules/@snappjack/sdk-js/dist via the /sdk route
```

## Key Concepts

This example demonstrates the core Snappjack integration patterns:

### Server Architecture
- **Configuration Management**: Centralized app config served from `/api/config`
- **User Session Management**: Unified `/api/user/session` endpoint handles user creation and validation
- **Secure Authentication**: API keys stay server-side, ephemeral tokens for WebSocket connections

### Client Integration
- **Shared Textarea**: Both users and AI agents can read and write to the same text area
- **Tool Registration**: `update_textarea` and `get_textarea` tools expose app functionality to agents
- **Event-Driven Connection**: Real-time status updates and automatic MCP configuration
- **User Persistence**: LocalStorage maintains user identity across sessions

Refer to the source files for implementation details.

## Troubleshooting

### "Token generation failed"
- Verify your `SNAPP_API_KEY` in the `.env` file
- Make sure the API key starts with `wak_`
- Check that you have a valid Snappjack account

### "Connection failed"
- Ensure the Snappjack Bridge server is accessible
- Check your network connection
- Try refreshing the page

### "Agent not connecting"
- Double-check the MCP configuration in your AI assistant
- Verify the authorization header is included
- Try regenerating a new user ID with the "Generate New User" button

### Server won't start
- Make sure port 3001 is not already in use
- Run `npm install` to ensure dependencies are installed
- Check that Node.js version is 16 or higher

## Next Steps

After you get this example working:

1. **Explore the Demo Apps**: Check out the `snappjack-demo-nextjs` project for more complex examples
2. **Read the Full SDK Documentation**: See the main README.md for comprehensive integration guides
3. **Build Your Own Snapp**: Use this example as a template for integrating Snappjack into your own application
