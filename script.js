// Application configuration - will be loaded from server
let appConfig = null;
let userId = null;
let currentAuthRequirement = true; // Default to requiring auth

// Logging utilities
function addLog(message, type = 'info') {
    const logs = document.getElementById('logs');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logs.appendChild(entry);
    logs.scrollTop = logs.scrollHeight;
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// Centralized API client helper - eliminates repeated fetch logic
async function apiCall(endpoint, options = {}) {
    try {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Automatically stringify JSON body if provided
        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        const response = await fetch(endpoint, config);

        if (!response.ok) {
            throw new Error(`Request failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        // Centralized error handling
        addLog(`API call to ${endpoint} failed: ${error.message}`, 'error');
        throw error;
    }
}

// Load app configuration from server
async function loadAppConfig() {
    addLog('Loading app configuration...', 'info');

    appConfig = await apiCall('/api/config');
    addLog(`✅ Loaded config: ${appConfig.appName} (${appConfig.snappId})`, 'success');
    return appConfig;
}

// Get or create user session
async function getUserSession(forceNew = false) {
    const existingUserId = forceNew ? null : localStorage.getItem('hello-world-user-id');

    if (forceNew) {
        addLog('Creating new user (forced)...', 'info');
    } else {
        addLog(existingUserId ? `Checking existing user: ${existingUserId}` : 'No existing user found, creating new user...', 'info');
    }

    const userData = await apiCall('/api/user/session', {
        method: 'POST',
        body: { existingUserId, forceNew }
    });

    userId = userData.userId;
    localStorage.setItem('hello-world-user-id', userId);

    if (userData.isNew) {
        addLog(`✨ Created new user: ${userId}`, 'success');
    } else {
        addLog(`✅ Using existing user: ${userId}`, 'success');
    }

    return userData;
}

// Token provider calls your secure backend
async function getToken() {
    if (!userId) {
        throw new Error('No user ID available');
    }

    addLog(`Requesting ephemeral token for user: ${userId}`, 'info');

    const result = await apiCall('/api/token', {
        method: 'POST',
        body: { userId }
    });

    addLog('Ephemeral token received successfully', 'success');
    return result.token;
}

// Initialize your Snapp - will be set after user creation
let snappjack = null;

async function initializeSnappjack() {
    try {
        addLog('Initializing application...', 'info');
        await loadAppConfig();
        await getUserSession();

        addLog('Creating Snappjack instance...', 'info');
        snappjack = new Snappjack({
            snappId: appConfig.snappId,
            userId: userId,
            serverUrl: appConfig.serverUrl, // optional: only required is running a local bridge server
            tokenProvider: getToken,

            tools: [{
                name: 'update_textarea',
                description: 'Update the shared textarea content. Use this when the user wants to change or add text to the shared text area that both user and agent can see.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        text: {
                            type: 'string',
                            description: 'The new text content for the shared textarea',
                            maxLength: 2000
                        }
                    },
                    required: ['text']
                },
                handler: async (args) => {
                    try {
                        addLog(`Agent updated shared textarea: "${args.text.substring(0, 50)}${args.text.length > 50 ? '...' : ''}"`, 'info');

                        // Update the shared textarea
                        const textarea = document.getElementById('shared-textarea');
                        if (!textarea) {
                            throw new Error('Shared textarea element not found');
                        }

                        textarea.value = args.text;
                        addLog(`Shared textarea updated successfully`, 'success');

                        return {
                            content: [{
                                type: 'text',
                                text: `Update successful.`
                            }],
                            isError: false
                        };
                    } catch (error) {
                        addLog(`Failed to update textarea: ${error.message}`, 'error');
                        return {
                            content: [{
                                type: 'text',
                                text: `Error updating shared textarea: ${error.message}`
                            }],
                            isError: true
                        };
                    }
                }
            }, {
                name: 'get_textarea',
                description: 'Get the current content of the shared textarea. Use this to see what the user has typed or what is currently in the shared text area.',
                inputSchema: {
                    type: 'object',
                    properties: {}
                },
                handler: async (args) => {
                    try {
                        const textarea = document.getElementById('shared-textarea');
                        if (!textarea) {
                            throw new Error('Shared textarea element not found');
                        }

                        const currentText = textarea.value;
                        addLog(`Agent read shared textarea content`, 'info');

                        return {
                            content: [{
                                type: 'text',
                                text: currentText || '(textarea is empty)'
                            }],
                            isError: false
                        };
                    } catch (error) {
                        addLog(`Failed to read textarea: ${error.message}`, 'error');
                        return {
                            content: [{
                                type: 'text',
                                text: `Error reading shared textarea: ${error.message}`
                            }],
                            isError: true
                        };
                    }
                }
            }]
        });

        // Event-driven connection lifecycle
        setupEventListeners();

        // Connect to Snappjack Bridge
        addLog('Connecting to Snappjack Bridge...', 'info');
        await snappjack.connect();
        addLog('Connection attempt initiated', 'info');

    } catch (error) {
        addLog(`Initialization failed: ${error.message}`, 'error');
        showError(`Failed to initialize: ${error.message}`);
    }
}

function setupEventListeners() {
    snappjack.on('status', (status) => {
        addLog(`Connection status changed: ${status}`, status === 'bridged' ? 'success' : 'info');

        const statusEl = document.getElementById('status');
        statusEl.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        statusEl.className = `status-indicator ${status}`;

        if (status === 'bridged') {
            addLog('🎉 Agent connected! Your Hello World app is now controllable by AI!', 'success');
        } else if (status === 'connected') {
            addLog('✅ Connected to Snappjack Bridge. Waiting for AI agent connection...', 'info');
        }
    });

    snappjack.on('connection-info-updated', (connectionData) => {
        addLog('Connection information received', 'success');

        // Update auth requirement state
        currentAuthRequirement = connectionData.requireAuthHeader;
        updateAuthToggleButton();

        // Build MCP configuration from the event data
        const connection = {
            type: 'streamableHttp',
            url: connectionData.mcpEndpoint
        };

        if (connectionData.requireAuthHeader) {
            connection.headers = {
                Authorization: `Bearer ${connectionData.userApiKey}`
            };
        }

        const config = {
            "hello-world": connection
        };

        // Display the configuration
        document.getElementById('mcp-config').textContent = JSON.stringify(config, null, 2);
        document.getElementById('connection-info').classList.add('visible');

        addLog('MCP configuration ready for agent setup', 'info');
    });

    snappjack.on('agent-connected', (data) => {
        addLog(`🤖 AI Agent connected (session: ${data.agentSessionId})`, 'success');
    });

    snappjack.on('agent-disconnected', (data) => {
        addLog(`🤖 AI Agent disconnected (session: ${data.agentSessionId})`, 'warning');
    });

    snappjack.on('error', (error) => {
        addLog(`Error: ${error.message || error}`, 'error');
        showError(`Snappjack Error: ${error.message || error}`);
    });
}

// User interaction functions

function clearLogs() {
    document.getElementById('logs').innerHTML = '<div class="log-entry info">Logs cleared</div>';
}


function updateAuthToggleButton() {
    const button = document.getElementById('auth-toggle');

    // Clear any inline styles to ensure consistent appearance
    button.style.backgroundColor = '';
    button.style.color = '';
    button.style.borderColor = '';

    if (currentAuthRequirement) {
        button.textContent = 'Disable Auth';
    } else {
        button.textContent = 'Enable Auth';
    }
    button.disabled = false;
}

async function toggleAuth() {
    if (!userId) {
        addLog('No user ID available for auth toggle', 'error');
        return;
    }

    if (!snappjack) {
        addLog('Snappjack client not available for auth toggle', 'error');
        return;
    }

    const newAuthRequirement = !currentAuthRequirement;
    addLog(`${newAuthRequirement ? 'Enabling' : 'Disabling'} authentication requirement...`, 'info');

    try {
        await snappjack.updateAuthRequirement(newAuthRequirement);
        currentAuthRequirement = newAuthRequirement;
        updateAuthToggleButton();

        addLog(`✅ Authentication ${newAuthRequirement ? 'enabled' : 'disabled'} for user`, 'success');
        addLog('🔄 Reconnect your agent with the updated configuration below', 'info');
    } catch (error) {
        addLog(`❌ Failed to update auth requirement: ${error.message}`, 'error');
    }
}

// Initialize the application
initializeSnappjack().catch((error) => {
    addLog(`Failed to initialize application: ${error.message}`, 'error');
    showError(`Application initialization failed: ${error.message}`);
});