/**
 * Gemini Live API WebSocket Proxy
 * 
 * Proxies WebSocket connections to Gemini Live API since browsers
 * can't connect directly due to CORS restrictions.
 * 
 * Live models (gemini-2.5-flash-live) ONLY work via WebSocket bidiGenerateContent
 * Automatically uses Google Cloud Vertex AI if available
 */

const WebSocket = require('ws');
const http = require('http');
const debugMonitor = require('./debug-monitor');
const errorHandler = require('./error-handler');
const googleCloudBackend = require('./google-cloud-backend');
const { GoogleAuth } = require('google-auth-library');
const { connectToGeminiLive: connectDirectLive } = require('./gemini-live-direct-websocket');
const liveAPIBridge = require('./live-api-bridge');

const GEMINI_API_KEY_ENV = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY_2;

const NODE_ENV = process.env.NODE_ENV || 'development';
const allowedOrigins = (process.env.CORS_ORIGINS && NODE_ENV === 'production')
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : null;
const wsAuthToken = process.env.GEMINI_WS_TOKEN || process.env.API_TOKEN || null;
const maxPayloadBytes = Number(process.env.GEMINI_WS_MAX_PAYLOAD_BYTES || 262144);
const maxConnectionsPerIp = Number(process.env.GEMINI_WS_MAX_CONNECTIONS_PER_IP || (NODE_ENV === 'production' ? 3 : 50));
const maxMessagesPerWindow = Number(process.env.GEMINI_WS_MAX_MESSAGES_PER_10S || (NODE_ENV === 'production' ? 40 : 200));
const messageWindowMs = 10_000;

function safeClientErrorDetails(err) {
    if (NODE_ENV === 'production') return undefined;
    return err && (err.message || err.toString()) ? (err.message || err.toString()) : undefined;
}

const connectionsByIp = new Map();

function isOriginAllowed(origin) {
    if (!origin) return true;
    if (NODE_ENV !== 'production') return true;
    if (!allowedOrigins) return false;
    return allowedOrigins.includes(origin);
}

function extractAuthToken(req) {
    try {
        const auth = req.headers?.authorization || '';
        if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
            return auth.slice('Bearer '.length).trim();
        }
    } catch (_e) { }
    try {
        const url = new URL(req.url || '', 'http://localhost');
        const token = url.searchParams.get('token');
        if (token) return token;
    } catch (_e) { }
    return '';
}

function shouldRequireAuth() {
    return NODE_ENV === 'production';
}

/**
 * Create WebSocket proxy server for Gemini Live API
 */
function createGeminiLiveProxy(server) {
    const wss = new WebSocket.Server({
        server,
        path: '/api/gemini-live',
        maxPayload: maxPayloadBytes,
        perMessageDeflate: false,
        verifyClient(info, done) {
            try {
                const origin = info.origin || info.req.headers?.origin || '';
                if (!isOriginAllowed(origin)) {
                    return done(false, 403, 'Origin not allowed');
                }

                const ip = info.req.socket?.remoteAddress || 'unknown';
                const current = connectionsByIp.get(ip) || 0;
                if (current >= maxConnectionsPerIp) {
                    return done(false, 429, 'Too many connections');
                }

                if (shouldRequireAuth()) {
                    if (!wsAuthToken) {
                        return done(false, 403, 'Disabled in production unless GEMINI_WS_TOKEN or API_TOKEN is set');
                    }
                    const provided = extractAuthToken(info.req);
                    if (!provided || provided !== wsAuthToken) {
                        return done(false, 401, 'Unauthorized');
                    }
                }

                return done(true);
            } catch (_e) {
                return done(false, 400, 'Bad request');
            }
        }
    });

    wss.on('connection', async (clientWs, req) => {
        const clientIp = req.socket.remoteAddress;
        connectionsByIp.set(clientIp, (connectionsByIp.get(clientIp) || 0) + 1);
        clientWs.on('close', () => {
            const current = connectionsByIp.get(clientIp) || 0;
            if (current <= 1) connectionsByIp.delete(clientIp);
            else connectionsByIp.set(clientIp, current - 1);
        });

        console.log(`[Gemini Live Proxy] ✅ Client connected from ${clientIp}`);
        debugMonitor.log('info', '[Gemini Live Proxy] Client connected', {
            ip: clientIp
        });

        clientWs.__msgWindowStart = Date.now();
        clientWs.__msgCount = 0;

        // Check for API key or Google Cloud
        if (!GEMINI_API_KEY_ENV && !googleCloudBackend.isAvailable) {
            debugMonitor.log('error', 'No authentication method available', {
                hasApiKey: !!GEMINI_API_KEY_ENV,
                hasGoogleCloud: googleCloudBackend.isAvailable
            });
            clientWs.close(1008, 'Gemini API key or Google Cloud not configured');
            return;
        }

        // Connect to Gemini Live API WebSocket
        // IMPORTANT: Live models (gemini-2.5-flash-live) require Vertex AI, not REST API keys
        // - REST API keys: Only work with standard models via REST API (streamGenerateContent)
        // - Vertex AI: Required for Live models via WebSocket (BidiGenerateContent)
        // 
        // Based on official documentation:
        // - REST API keys use: google.ai.generativelanguage.v1beta.GenerativeService (404 for Live models)
        // - Vertex AI uses: google.cloud.aiplatform.v1beta1.LlmBidiService (works for Live models)

        const baseUrl = 'wss://generativelanguage.googleapis.com';
        let geminiWsUrl;

        // Check if Google Cloud Vertex AI is available
        // Try direct WebSocket for Live models first, then fallback to SDK streaming
        if (googleCloudBackend.isAvailable) {
            let modelName = null;
            let contents = [];
            let setupReceived = false;
            let useDirectWebSocket = false;

            clientWs.on('message', async (message) => {
                try {
                    const now = Date.now();
                    if (now - clientWs.__msgWindowStart > messageWindowMs) {
                        clientWs.__msgWindowStart = now;
                        clientWs.__msgCount = 0;
                    }
                    clientWs.__msgCount += 1;
                    if (clientWs.__msgCount > maxMessagesPerWindow) {
                        debugMonitor.log('warn', '[Gemini Live Proxy] Client rate limit exceeded', {
                            ip: clientIp,
                            count: clientWs.__msgCount
                        });
                        clientWs.close(1008, 'Rate limit exceeded');
                        return;
                    }

                    const size = typeof message === 'string' ? Buffer.byteLength(message) : (message?.length || 0);
                    if (size > maxPayloadBytes) {
                        debugMonitor.log('warn', '[Gemini Live Proxy] Client message too large', {
                            ip: clientIp,
                            size,
                            maxPayloadBytes
                        });
                        clientWs.close(1009, 'Message too large');
                        return;
                    }

                    const data = JSON.parse(message);
                    console.log(`[Gemini Live Proxy] 📨 Received message from client:`, {
                        hasSetup: !!data.setup,
                        hasClientContent: !!data.clientContent,
                        model: data.setup?.model,
                        messageLength: message.length
                    });

                    // Handle setup message
                    if (data.setup) {
                        if (data.setup.model) {
                            modelName = data.setup.model.replace(/^models\//, '');

                            // Check if this is a Live model - try direct WebSocket first
                            if (modelName.includes('live') || modelName.includes('flash-live')) {
                                useDirectWebSocket = true;
                                debugMonitor.log('info', '[Gemini Live Proxy] Detected Live model, trying direct WebSocket', {
                                    model: modelName
                                });

                                // Send setup complete immediately (we'll handle connection)
                                clientWs.send(JSON.stringify({
                                    setupComplete: true,
                                    BidiGenerateContentSetupComplete: true
                                }));
                                setupReceived = true;
                                return;
                            } else {
                                // Standard model - use SDK streaming
                                useDirectWebSocket = false;
                            }
                        }

                        if (!useDirectWebSocket) {
                            // Send setup complete for SDK path
                            clientWs.send(JSON.stringify({
                                setupComplete: true,
                                BidiGenerateContentSetupComplete: true
                            }));
                            setupReceived = true;
                        }
                    }

                    // Handle client content
                    if (data.clientContent && setupReceived) {
                        console.log(`[Gemini Live Proxy] 📝 Processing client content:`, {
                            hasTurns: !!data.clientContent.turns,
                            hasParts: !!data.clientContent.parts,
                            turnComplete: data.clientContent.turnComplete
                        });

                        // Support both formats: turns (Live API) and parts (legacy)
                        if (data.clientContent.turns && Array.isArray(data.clientContent.turns)) {
                            // Extract parts from turns array (Live API format)
                            contents = data.clientContent.turns.flatMap(turn => turn.parts || []);
                            const userText = contents.filter(p => p.text).map(p => p.text).join(' ');
                            console.log(`[Gemini Live Proxy] 💬 User message: "${userText.substring(0, 100)}${userText.length > 100 ? '...' : ''}"`);
                        } else {
                            // Legacy format: direct parts array
                            contents = data.clientContent.parts || [];
                            const userText = contents.filter(p => p.text).map(p => p.text).join(' ');
                            console.log(`[Gemini Live Proxy] 💬 User message (legacy): "${userText.substring(0, 100)}${userText.length > 100 ? '...' : ''}"`);
                        }

                        if (useDirectWebSocket && modelName) {
                            console.log(`[Gemini Live Proxy] 🚀 Using Live API for model: ${modelName}`);
                            // Try Python Live API service first (true Live API)
                            if (liveAPIBridge.isAvailable()) {
                                debugMonitor.log('info', '[Gemini Live Proxy] Using Python Live API service', {
                                    model: modelName
                                });

                                try {
                                    const allText = contents
                                        .filter(part => part.text)
                                        .map(part => part.text)
                                        .join(' ');

                                    console.log(`[Gemini Live Proxy] 🔄 Sending to Python Live API service...`);
                                    // Send request with client WebSocket for streaming
                                    const responseText = await liveAPIBridge.sendRequest(modelName, allText, ['TEXT'], clientWs);

                                    if (responseText) {
                                        // Final response already sent via streaming, but send complete message
                                        console.log(`[Gemini Live Proxy] ✅ Python Live API succeeded (${responseText.length} chars)`);
                                        debugMonitor.log('info', '[Gemini Live Proxy] ✅ Python Live API succeeded', {
                                            responseLength: responseText.length,
                                            model: modelName
                                        });
                                        return; // Success, exit early
                                    }
                                } catch (pythonError) {
                                    console.log(`[Gemini Live Proxy] ⚠️ Python Live API failed: ${pythonError.message}`);
                                    debugMonitor.log('warn', '[Gemini Live Proxy] Python Live API failed, trying direct WebSocket', {
                                        error: pythonError.message
                                    });
                                    // Continue to direct WebSocket fallback
                                }
                            }

                            // Try direct WebSocket for Live models (fallback)
                            debugMonitor.log('info', '[Gemini Live Proxy] Attempting direct WebSocket for Live model', {
                                model: modelName
                            });

                            try {
                                const responseText = await connectDirectLive(modelName, contents, clientWs);
                                if (responseText) {
                                    debugMonitor.log('info', '[Gemini Live Proxy] ✅ Direct WebSocket succeeded', {
                                        responseLength: responseText.length
                                    });
                                    return; // Success, exit early
                                }
                            } catch (directError) {
                                debugMonitor.log('warn', '[Gemini Live Proxy] Direct WebSocket failed, falling back to SDK', {
                                    error: directError.message
                                });

                                // Fallback to SDK with standard model
                                useDirectWebSocket = false;
                                modelName = 'gemini-2.5-flash';

                                // Continue to SDK streaming fallback below
                            }
                        }

                        if (!useDirectWebSocket) {
                            // Use SDK streaming - try Live model first, then fallback to standard
                            const allText = contents
                                .filter(part => part.text)
                                .map(part => part.text)
                                .join(' ');

                            const vertexContents = [{
                                role: 'user',
                                parts: [{ text: allText || '' }]
                            }];

                            // Try Live model first if it was requested, then fallback to standard
                            let finalModelName = modelName || 'gemini-2.5-flash';

                            // If Live model was requested, try it first with SDK
                            // SDK streaming may support Live models in Vertex AI
                            if (modelName && (modelName.includes('live') || modelName.includes('flash-live'))) {
                                debugMonitor.log('info', '[Gemini Live Proxy] Trying Live model with SDK streaming', {
                                    model: modelName
                                });
                            } else {
                                // Standard model requested or no model specified
                                finalModelName = 'gemini-2.5-flash';
                            }

                            debugMonitor.log('info', '[Gemini Live Proxy] Using SDK streaming', {
                                model: finalModelName,
                                originalRequest: modelName
                            });

                            try {
                                const responseText = await googleCloudBackend.streamGeminiLive(
                                    finalModelName,
                                    vertexContents,
                                    {
                                        temperature: 0.7,
                                        maxOutputTokens: 8192
                                    }
                                );

                                if (responseText) {
                                    clientWs.send(JSON.stringify({
                                        serverContent: {
                                            parts: [{ text: responseText }]
                                        }
                                    }));
                                    debugMonitor.log('info', '[Gemini Live Proxy] ✅ SDK streaming completed', {
                                        responseLength: responseText.length
                                    });
                                }
                            } catch (error) {
                                debugMonitor.log('error', '[Gemini Live Proxy] SDK streaming error', {
                                    error: error.message
                                });
                                clientWs.send(JSON.stringify({
                                    error: {
                                        message: NODE_ENV === 'production' ? 'Internal server error' : error.message,
                                        code: 'SDK_STREAMING_ERROR'
                                    }
                                }));
                            }
                        }
                    }
                } catch (error) {
                    debugMonitor.log('error', '[Gemini Live Proxy] Error processing message', {
                        error: error.message
                    });
                }
            });

            clientWs.on('close', () => {
                debugMonitor.log('info', '[Gemini Live Proxy] Client disconnected');
            });

            return; // Exit early - handled above
        } else {
            // Fallback: Try REST API endpoint (will likely fail with 404 for Live models)
            geminiWsUrl = `${baseUrl}/ws/google.ai.generativelanguage.v1beta.GenerativeService/BidiGenerateContent?key=${GEMINI_API_KEY_ENV}`;

            debugMonitor.log('warn', '[Gemini Live Proxy] Using REST API WebSocket endpoint (may not work for Live models)', {
                endpoint: 'google.ai.generativelanguage.v1beta.GenerativeService',
                note: 'Live models require Vertex AI. This will likely return 404.',
                suggestion: 'Set up Google Cloud Vertex AI for Live model support'
            });
        }

        debugMonitor.log('info', '[Gemini Live Proxy] Connecting to Gemini WebSocket', {
            url: geminiWsUrl.replace(/\?key=.*$/, '?key=***'),
            hasApiKey: !!GEMINI_API_KEY_ENV,
            apiKeyLength: GEMINI_API_KEY_ENV ? GEMINI_API_KEY_ENV.length : 0,
            usingVertexAI: googleCloudBackend.isAvailable
        });

        // For Vertex AI, we need to get an access token and add it to headers
        let wsOptions = {};
        if (googleCloudBackend.isAvailable) {
            try {
                const auth = new GoogleAuth({
                    scopes: ['https://www.googleapis.com/auth/cloud-platform']
                });
                const client = await auth.getClient();
                const accessToken = await client.getAccessToken();

                debugMonitor.log('info', '[Gemini Live Proxy] Got Vertex AI access token', {
                    tokenLength: accessToken.token ? accessToken.token.length : 0
                });

                // Add access token to WebSocket headers
                wsOptions = {
                    headers: {
                        'Authorization': `Bearer ${accessToken.token}`
                    }
                };
            } catch (error) {
                debugMonitor.log('error', '[Gemini Live Proxy] Failed to get access token', {
                    error: error.message
                });
                // Fall through - will likely fail but let it try
            }
        }

        const geminiWs = new WebSocket(geminiWsUrl, wsOptions);
        let geminiReady = false;
        let pendingMessages = [];

        // Wait for Gemini WebSocket to be ready
        geminiWs.on('open', () => {
            debugMonitor.log('info', '[Gemini Live Proxy] ✅ Successfully connected to Gemini API WebSocket', {
                endpoint: 'BidiGenerateContent',
                readyState: geminiWs.readyState
            });
            geminiReady = true;
            // Send any pending messages
            pendingMessages.forEach(msg => {
                geminiWs.send(msg);
            });
            pendingMessages = [];
        });

        let setupComplete = false;

        // Forward messages from client to Gemini
        clientWs.on('message', (message) => {
            try {
                const data = JSON.parse(message);

                debugMonitor.log('debug', '[Gemini Live Proxy] Received message from client', {
                    hasSetup: !!data.setup,
                    hasClientContent: !!data.clientContent,
                    messageType: Object.keys(data)[0] || 'unknown'
                });

                // If this is the setup message, ensure it has the correct model
                if (data.setup) {
                    // Normalize model name - always use gemini-2.5-flash-live for WebSocket
                    // Map any live model variants to the correct one
                    if (data.setup.model) {
                        const modelName = data.setup.model.replace(/^models\//, '');
                        // Map all live model variants to gemini-2.5-flash-live
                        if (modelName.includes('live') || modelName.includes('flash-live')) {
                            data.setup.model = 'models/gemini-2.5-flash-live';
                            debugMonitor.log('info', '[Gemini Live Proxy] Normalized model name', {
                                original: modelName,
                                normalized: 'gemini-2.5-flash-live',
                                generationConfig: data.setup.generationConfig || 'default'
                            });
                        }
                    } else {
                        // Default to gemini-2.5-flash-live if no model specified
                        data.setup.model = 'models/gemini-2.5-flash-live';
                        debugMonitor.log('info', '[Gemini Live Proxy] Using default model: gemini-2.5-flash-live');
                    }

                    debugMonitor.log('info', '[Gemini Live Proxy] Sending setup message to Gemini', {
                        model: data.setup.model,
                        hasGenerationConfig: !!data.setup.generationConfig
                    });
                }

                const messageStr = JSON.stringify(data);
                if (geminiReady && geminiWs.readyState === WebSocket.OPEN) {
                    geminiWs.send(messageStr);
                    debugMonitor.log('debug', '[Gemini Live Proxy] Message sent to Gemini', {
                        messageType: data.setup ? 'setup' : data.clientContent ? 'clientContent' : 'other'
                    });
                } else {
                    // Queue message until Gemini WebSocket is ready
                    pendingMessages.push(messageStr);
                    debugMonitor.log('debug', '[Gemini Live Proxy] Queuing message (Gemini not ready yet)', {
                        pendingCount: pendingMessages.length,
                        geminiReady: geminiReady,
                        geminiReadyState: geminiWs.readyState
                    });
                }
            } catch (error) {
                console.error('[Gemini Live Proxy] Error forwarding client message:', error);
                debugMonitor.log('error', '[Gemini Live Proxy] Error parsing client message', {
                    error: error.message,
                    messagePreview: message.toString().substring(0, 200)
                });
            }
        });

        // Forward messages from Gemini to client
        geminiWs.on('message', (message) => {
            try {
                const data = JSON.parse(message);

                debugMonitor.log('debug', '[Gemini Live Proxy] Received message from Gemini', {
                    hasSetupComplete: !!(data.setupComplete || data.BidiGenerateContentSetupComplete),
                    hasServerContent: !!data.serverContent,
                    hasError: !!data.error,
                    messageType: Object.keys(data)[0] || 'unknown'
                });

                // Check for setup completion
                if (data.setupComplete || data.BidiGenerateContentSetupComplete) {
                    setupComplete = true;
                    debugMonitor.log('info', '[Gemini Live Proxy] ✅ Setup completed successfully', {
                        setupComplete: true
                    });
                }

                if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(JSON.stringify(data));
                } else {
                    debugMonitor.log('warn', '[Gemini Live Proxy] Client WebSocket not open, cannot forward message', {
                        clientReadyState: clientWs.readyState
                    });
                }
            } catch (error) {
                console.error('[Gemini Live Proxy] Error forwarding Gemini message:', error);
                debugMonitor.log('error', '[Gemini Live Proxy] Error parsing/forwarding Gemini message', {
                    error: error.message,
                    messagePreview: message.toString().substring(0, 200)
                });
            }
        });

        geminiWs.on('error', async (error) => {
            // Sanitize error object to avoid circular reference issues
            const errorMessage = error.message || error.toString();
            const errorCode = error.code || 'UNKNOWN';

            // Advanced debugging: Log full error details
            debugMonitor.log('error', '[Gemini Live Proxy] Gemini WebSocket error', {
                error: errorMessage,
                errorCode: errorCode,
                endpoint: 'websocket',
                url: geminiWsUrl.replace(/\?key=.*$/, '?key=***'),
                readyState: geminiWs.readyState,
                hasApiKey: !!GEMINI_API_KEY_ENV,
                apiKeyPrefix: GEMINI_API_KEY_ENV ? GEMINI_API_KEY_ENV.substring(0, 10) + '...' : 'none'
            });

            // If 404, try alternative endpoint format
            if (errorMessage && errorMessage.includes('404')) {
                const currentEndpoint = googleCloudBackend.isAvailable
                    ? 'google.cloud.aiplatform.v1beta1.LlmBidiService (Vertex AI)'
                    : 'google.ai.generativelanguage.v1beta.GenerativeService (REST API)';

                debugMonitor.log('warn', '[Gemini Live Proxy] 404 error - Trying to diagnose endpoint issue', {
                    currentEndpoint: currentEndpoint,
                    usingVertexAI: googleCloudBackend.isAvailable,
                    project: googleCloudBackend.projectId,
                    location: googleCloudBackend.location,
                    suggestion: googleCloudBackend.isAvailable
                        ? 'Vertex AI WebSocket endpoint returned 404. The endpoint format or model availability may be the issue.'
                        : 'This endpoint should work with REST API keys. If it fails, Live models may require Vertex AI.',
                    alternativeEndpoint: 'Will fallback to REST API streaming with gemini-2.5-flash',
                    troubleshooting: [
                        '1. Verify the model gemini-2.5-flash-live is available in your region',
                        '2. Check if Vertex AI API is enabled in your project',
                        '3. Check if the service account has proper permissions',
                        '4. The WebSocket endpoint format might need adjustment',
                        '5. Frontend will automatically fallback to REST API streaming'
                    ]
                });

                // Close client connection and let frontend fallback to REST
                if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(JSON.stringify({
                        error: {
                            message: 'WebSocket endpoint returned 404. Live models may require Vertex AI. Frontend will use REST API fallback.',
                            code: 'WEBSOCKET_NOT_AVAILABLE',
                            suggestion: 'Using gemini-2.5-flash via REST API streaming instead',
                            endpoint: geminiWsUrl.replace(/\?key=.*$/, '?key=***')
                        }
                    }));
                    clientWs.close();
                }
                return;
            }

            // Try error recovery
            const handled = await errorHandler.handleError(error, {
                endpoint: 'websocket',
                type: 'WEBSOCKET_ERROR',
                ws: geminiWs
            });

            if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({
                    error: {
                        message: 'Gemini WebSocket connection failed',
                        details: safeClientErrorDetails(error),
                        errorCode: error.code,
                        recovered: handled.success || false
                    }
                }));
            }
        });

        geminiWs.on('close', (code, reason) => {
            const closeReason = reason ? reason.toString() : 'No reason provided';
            debugMonitor.log('info', '[Gemini Live Proxy] Gemini WebSocket closed', {
                code: code,
                reason: closeReason,
                setupComplete: setupComplete,
                commonCodes: {
                    1000: 'Normal closure',
                    1001: 'Going away',
                    1006: 'Abnormal closure (no close frame)',
                    1008: 'Policy violation',
                    1011: 'Internal server error'
                }
            });
            console.log(`[Gemini Live Proxy] Gemini WebSocket closed: ${code} ${closeReason}`);

            if (clientWs.readyState === WebSocket.OPEN) {
                // If closed before setup and no response, send error to client
                if (!setupComplete && code !== 1000) {
                    clientWs.send(JSON.stringify({
                        error: {
                            message: `WebSocket closed before setup: ${code} ${closeReason}`,
                            code: 'WEBSOCKET_CLOSED',
                            closeCode: code
                        }
                    }));
                }
                clientWs.close();
            }
        });

        clientWs.on('close', () => {
            console.log('[Gemini Live Proxy] Client disconnected');
            if (geminiWs.readyState === WebSocket.OPEN) {
                geminiWs.close();
            }
        });

        clientWs.on('error', (error) => {
            console.error('[Gemini Live Proxy] Client WebSocket error:', error);
        });
    });

    console.log('[Gemini Live Proxy] WebSocket proxy server ready at /api/gemini-live');
    return wss;
}

module.exports = { createGeminiLiveProxy };


