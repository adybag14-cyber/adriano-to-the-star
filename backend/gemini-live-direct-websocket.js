/**
 * Direct WebSocket implementation for Gemini Live API
 * Bypasses SDK compatibility issues by using direct WebSocket with access tokens
 */

const WS = require('ws');
const { execFileSync } = require('child_process');
const debugMonitor = require('./debug-monitor');
const googleCloudBackend = require('./google-cloud-backend');

/**
 * Get access token from Google Cloud
 */
async function getAccessToken() {
    try {
        // Try using gcloud CLI first (fastest)
        return execFileSync('gcloud', ['auth', 'application-default', 'print-access-token'], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
            timeout: 5000
        }).trim();
    } catch (error) {
        // Fallback: Use service account credentials via GoogleAuth
        try {
            const { GoogleAuth } = require('google-auth-library');
            const auth = new GoogleAuth({
                scopes: ['https://www.googleapis.com/auth/cloud-platform']
            });
            const client = await auth.getClient();
            const tokenResponse = await client.getAccessToken();
            return tokenResponse.token;
        } catch (e) {
            throw new Error('Failed to get access token: ' + e.message);
        }
    }
}

/**
 * Try connecting to a specific WebSocket URL
 */
async function tryConnect(wsUrl, accessToken, liveModelName, contents, clientWs, useApiKey = false, apiKey = null, projectId = null, location = null, formatAttempt = 0, clientContentFormatAttempt = 0) {
    return new Promise((resolve, reject) => {
        let setupComplete = false;
        let responseText = '';
        let responseSent = false;
        const setupFormats = [
            // Format 1: models/ prefix (official API format per documentation)
            `models/${liveModelName}`,
            // Format 2: Full Vertex AI resource path (for Vertex AI endpoint)
            `projects/${projectId || 'adriano-broadband'}/locations/${location || 'us-central1'}/publishers/google/models/${liveModelName}`,
            // Format 3: Just model name (simplest)
            liveModelName,
            // Format 4: publishers/google/models/ prefix
            `publishers/google/models/${liveModelName}`
        ];

        // Client content formats to try
        // According to API docs: BidiGenerateContentClientContent requires 'turns' array and 'turnComplete' boolean
        const clientContentFormats = [
            // Format 1: Correct Live API format - turns array with turnComplete (per API documentation)
            (text) => ({
                clientContent: {
                    turns: [{
                        role: 'user',
                        parts: [{ text: text }]
                    }],
                    turnComplete: true
                }
            }),
            // Format 2: Turns array without turnComplete (for incremental updates)
            (text) => ({
                clientContent: {
                    turns: [{
                        role: 'user',
                        parts: [{ text: text }]
                    }],
                    turnComplete: false
                }
            }),
            // Format 3: Single turn object (alternative structure)
            (text) => ({
                clientContent: {
                    turns: [{
                        role: 'user',
                        parts: [{ text: text }]
                    }]
                }
            }),
            // Format 4: Direct turns array (fallback)
            (text) => ({
                clientContent: {
                    turns: [{
                        parts: [{ text: text }]
                    }],
                    turnComplete: true
                }
            })
        ];

        // Use the format attempt index
        const setupAttempts = Math.min(formatAttempt, setupFormats.length - 1);
        const clientContentFormat = Math.min(clientContentFormatAttempt, clientContentFormats.length - 1);

        // Build WebSocket options
        const wsOptions = {};
        if (useApiKey && apiKey) {
            // API key: use x-goog-api-key header (per documentation)
            wsOptions.headers = {
                'x-goog-api-key': apiKey,
                'Content-Type': 'application/json'
            };
        } else if (accessToken) {
            // Vertex AI: use Bearer token in headers
            wsOptions.headers = {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            };
        }

        const geminiWs = new WS(wsUrl, wsOptions);

        geminiWs.on('open', () => {
            debugMonitor.log('info', '[Gemini Live Direct] ✅ WebSocket connected to Live API', {
                model: liveModelName
            });

            // Send setup message
            // Try different model name formats until one works
            const currentModelFormat = setupFormats[setupAttempts] || setupFormats[0];
            const setupMessage = {
                setup: {
                    model: currentModelFormat,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 8192,
                        responseModalities: ['TEXT']  // Can also use ['AUDIO'] for audio output
                    }
                }
            };

            debugMonitor.log('debug', '[Gemini Live Direct] Setup message attempt', {
                attempt: setupAttempts + 1,
                modelFormat: currentModelFormat,
                totalFormats: setupFormats.length
            });

            debugMonitor.log('debug', '[Gemini Live Direct] Setup message', {
                model: setupMessage.setup.model,
                responseModalities: setupMessage.setup.generationConfig.responseModalities
            });

            geminiWs.send(JSON.stringify(setupMessage));
            debugMonitor.log('info', '[Gemini Live Direct] Setup message sent');
        });

        geminiWs.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());

                // Log all incoming messages for debugging
                debugMonitor.log('debug', '[Gemini Live Direct] Received message', {
                    messageKeys: Object.keys(message),
                    hasServerContent: !!message.serverContent,
                    hasSetupComplete: !!(message.setupComplete || message.BidiGenerateContentSetupComplete),
                    hasModelTurn: !!(message.serverContent?.modelTurn),
                    hasParts: !!(message.serverContent?.parts),
                    generationComplete: message.serverContent?.generationComplete,
                    turnComplete: message.serverContent?.turnComplete
                });

                // Check for setup completion
                if (message.setupComplete || message.BidiGenerateContentSetupComplete) {
                    setupComplete = true;
                    debugMonitor.log('info', '[Gemini Live Direct] Setup complete, sending content');

                    // Send user content
                    // For Vertex AI Live API, try different client content formats
                    const contentParts = contents
                        .filter(part => part.text)
                        .map(part => part.text)
                        .join(' ');

                    // Use the current client content format
                    const clientMessage = clientContentFormats[clientContentFormat](contentParts);

                    debugMonitor.log('debug', '[Gemini Live Direct] Sending client content', {
                        formatAttempt: clientContentFormat + 1,
                        totalFormats: clientContentFormats.length,
                        textLength: contentParts.length,
                        format: clientContentFormat === 0 ? 'turns with turnComplete=true' :
                            clientContentFormat === 1 ? 'turns with turnComplete=false' :
                                clientContentFormat === 2 ? 'turns without turnComplete' : 'turns with parts only',
                        messageStructure: JSON.stringify(clientMessage).substring(0, 200)
                    });

                    geminiWs.send(JSON.stringify(clientMessage));
                }

                // Handle server content (response)
                // According to API docs: serverContent.modelTurn contains the actual response
                if (message.serverContent) {
                    let textFound = false;

                    // Log the actual structure for debugging
                    if (message.serverContent.modelTurn) {
                        debugMonitor.log('debug', '[Gemini Live Direct] modelTurn structure', {
                            hasParts: !!message.serverContent.modelTurn.parts,
                            partsType: Array.isArray(message.serverContent.modelTurn.parts) ? 'array' : typeof message.serverContent.modelTurn.parts,
                            partsLength: Array.isArray(message.serverContent.modelTurn.parts) ? message.serverContent.modelTurn.parts.length : 'N/A',
                            modelTurnKeys: Object.keys(message.serverContent.modelTurn)
                        });
                    }

                    // Try modelTurn.parts first (per API documentation)
                    if (message.serverContent.modelTurn?.parts) {
                        message.serverContent.modelTurn.parts.forEach((part, index) => {
                            if (part.text) {
                                debugMonitor.log('debug', '[Gemini Live Direct] Found text in part', {
                                    partIndex: index,
                                    textLength: part.text.length,
                                    textPreview: part.text.substring(0, 50)
                                });
                                responseText += part.text;
                                textFound = true;
                            }
                        });
                    }

                    // Fallback to direct parts (for compatibility)
                    if (!textFound && message.serverContent.parts) {
                        message.serverContent.parts.forEach((part, index) => {
                            if (part.text) {
                                debugMonitor.log('debug', '[Gemini Live Direct] Found text in direct parts', {
                                    partIndex: index,
                                    textLength: part.text.length
                                });
                                responseText += part.text;
                                textFound = true;
                            }
                        });
                    }

                    // If still no text found, log the entire modelTurn structure
                    if (!textFound && message.serverContent.modelTurn) {
                        debugMonitor.log('warn', '[Gemini Live Direct] No text found in modelTurn', {
                            modelTurn: JSON.stringify(message.serverContent.modelTurn).substring(0, 500)
                        });
                    }

                    // Forward ALL serverContent messages to client in real-time
                    // This includes messages with text, generationComplete, turnComplete, etc.
                    if (clientWs.readyState === WS.OPEN) {
                        const messageStr = JSON.stringify(message);
                        clientWs.send(messageStr);
                        debugMonitor.log('debug', '[Gemini Live Direct] Forwarded message to client', {
                            messageSize: messageStr.length,
                            hasModelTurn: !!message.serverContent?.modelTurn,
                            hasParts: !!(message.serverContent?.modelTurn?.parts || message.serverContent?.parts),
                            turnComplete: message.serverContent?.turnComplete,
                            clientWsReady: clientWs.readyState === WS.OPEN
                        });
                    } else {
                        debugMonitor.log('warn', '[Gemini Live Direct] Client WebSocket not ready', {
                            readyState: clientWs.readyState,
                            hasModelTurn: !!message.serverContent?.modelTurn
                        });
                    }

                    // Check for turn completion (per API docs: turnComplete indicates model is done)
                    if (message.serverContent.turnComplete) {
                        debugMonitor.log('info', '[Gemini Live Direct] Turn complete', {
                            responseLength: responseText.length,
                            generationComplete: message.serverContent.generationComplete,
                            responseTextPreview: responseText.substring(0, 100)
                        });

                        // Send final response in multiple formats to ensure frontend receives it
                        if (responseText && clientWs.readyState === WS.OPEN) {
                            // Format 1: Standard parts format (for compatibility)
                            if (!responseSent) {
                                clientWs.send(JSON.stringify({
                                    serverContent: {
                                        parts: [{ text: responseText }],
                                        turnComplete: true
                                    }
                                }));
                                responseSent = true;
                            }

                            // Format 2: Also send with modelTurn format (per API spec)
                            clientWs.send(JSON.stringify({
                                serverContent: {
                                    modelTurn: {
                                        parts: [{ text: responseText }]
                                    },
                                    turnComplete: true
                                }
                            }));

                            debugMonitor.log('info', '[Gemini Live Direct] Final response sent to client', {
                                responseLength: responseText.length,
                                clientWsReady: clientWs.readyState === WS.OPEN
                            });
                        }

                        // Small delay to ensure messages are sent before closing
                        setTimeout(() => {
                            resolve(responseText);
                            geminiWs.close();
                        }, 100);
                    }
                }

                // Legacy completion check (for backward compatibility)
                if (message.done) {
                    if (!responseSent && responseText) {
                        if (clientWs.readyState === WS.OPEN) {
                            clientWs.send(JSON.stringify({
                                serverContent: {
                                    parts: [{ text: responseText }]
                                }
                            }));
                        }
                        responseSent = true;
                    }
                    resolve(responseText);
                    geminiWs.close();
                }
            } catch (error) {
                debugMonitor.log('error', '[Gemini Live Direct] Error parsing message', {
                    error: error.message,
                    stack: error.stack
                });
            }
        });

        geminiWs.on('error', (error) => {
            debugMonitor.log('error', '[Gemini Live Direct] WebSocket error', {
                error: error.message,
                model: liveModelName
            });
            reject(error);
        });

        geminiWs.on('close', (code, reason) => {
            const reasonStr = reason.toString();
            debugMonitor.log('info', '[Gemini Live Direct] WebSocket closed', {
                code: code,
                reason: reasonStr,
                model: liveModelName,
                setupComplete: setupComplete,
                responseLength: responseText.length
            });

            // If we get "Publisher Model not found" or "Permission denied" (1008), try next model format
            if (code === 1008 && (reasonStr.includes('not found') || reasonStr.includes('Permission denied')) && !setupComplete) {
                const errorType = reasonStr.includes('not found') ? 'Model not found' : 'Permission denied';
                if (formatAttempt < setupFormats.length - 1) {
                    debugMonitor.log('info', '[Gemini Live Direct] Model error, will retry with next format', {
                        errorType: errorType,
                        currentFormat: setupFormats[formatAttempt],
                        nextFormat: setupFormats[formatAttempt + 1],
                        formatAttempt: formatAttempt,
                        error: reasonStr
                    });
                    reject(new Error(`MODEL_NOT_FOUND:${formatAttempt}:${reasonStr}`));
                } else {
                    // Last format failed, reject with exhausted error
                    debugMonitor.log('info', '[Gemini Live Direct] All model formats exhausted', {
                        errorType: errorType,
                        currentFormat: setupFormats[formatAttempt],
                        formatAttempt: formatAttempt,
                        totalFormats: setupFormats.length,
                        error: reasonStr
                    });
                    reject(new Error(`MODEL_NOT_FOUND:${formatAttempt}:${reasonStr}:EXHAUSTED`));
                }
                return;
            }

            // If we get "Invalid resource field value" and haven't tried all formats, signal retry
            if (code === 1007 && reasonStr.includes('Invalid resource field value') && !setupComplete) {
                // Use setupAttempts which is the actual index being used
                const currentAttempt = Math.min(formatAttempt, setupFormats.length - 1);
                if (currentAttempt < setupFormats.length - 1) {
                    debugMonitor.log('info', '[Gemini Live Direct] Invalid model format, will retry with next format', {
                        currentFormat: setupFormats[currentAttempt],
                        nextFormat: setupFormats[currentAttempt + 1],
                        formatAttempt: formatAttempt,
                        currentAttempt: currentAttempt
                    });
                    reject(new Error(`INVALID_MODEL_FORMAT:${formatAttempt}:${reasonStr}`));
                } else {
                    // Last format failed, reject with exhausted error
                    debugMonitor.log('warn', '[Gemini Live Direct] All model formats exhausted - stopping retries', {
                        currentFormat: setupFormats[currentAttempt],
                        formatAttempt: formatAttempt,
                        currentAttempt: currentAttempt,
                        totalFormats: setupFormats.length,
                        error: reasonStr
                    });
                    reject(new Error(`INVALID_MODEL_FORMAT:${formatAttempt}:${reasonStr}:EXHAUSTED`));
                }
                return;
            }

            // If we get "Unknown name parts" or similar error, it means setup worked but client content format is wrong
            if (code === 1007 && (reasonStr.includes('Unknown name') || reasonStr.includes('Cannot find field')) && setupComplete && clientContentFormat < clientContentFormats.length - 1) {
                debugMonitor.log('info', '[Gemini Live Direct] Client content format incorrect, will retry with next format', {
                    error: reasonStr,
                    currentFormat: clientContentFormat,
                    nextFormat: clientContentFormat + 1,
                    note: 'Setup succeeded but client_content format is wrong'
                });
                reject(new Error(`INVALID_CLIENT_CONTENT_FORMAT:${clientContentFormat}:${reasonStr}`));
                return;
            }

            if (responseText && !responseSent) {
                if (clientWs.readyState === WS.OPEN) {
                    clientWs.send(JSON.stringify({
                        serverContent: {
                            parts: [{ text: responseText }]
                        }
                    }));
                }
                resolve(responseText);
            } else if (!responseText && !setupComplete) {
                reject(new Error(`WebSocket closed: ${code} ${reasonStr}`));
            } else if (responseText) {
                // Response received, resolve
                resolve(responseText);
            } else {
                reject(new Error(`WebSocket closed without response: ${code} ${reasonStr}`));
            }
        });

        // Timeout after 30 seconds
        setTimeout(() => {
            if (!responseText && !responseSent) {
                geminiWs.close();
                reject(new Error('Timeout waiting for response'));
            }
        }, 30000);
    });
}

/**
 * Connect to Gemini Live API via direct WebSocket
 * Supports both API key and Vertex AI authentication
 */
async function connectToGeminiLive(modelName, contents, clientWs) {
    // For Live API WebSocket, OAuth2 (Vertex AI) is REQUIRED
    // API keys don't work for Live API WebSocket (they return 400 errors)
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    let useApiKey = false;
    let accessToken = null;
    let projectId = null;
    let location = null;

    // Prioritize Vertex AI OAuth2 (required for Live API WebSocket)
    if (googleCloudBackend.isAvailable) {
        projectId = googleCloudBackend.projectId;
        location = googleCloudBackend.location;

        try {
            accessToken = await getAccessToken();
            debugMonitor.log('info', '[Gemini Live Direct] Using Vertex AI OAuth2 (required for Live API)', {
                tokenLength: accessToken ? accessToken.length : 0,
                project: projectId,
                location: location,
                note: 'Live API WebSocket requires OAuth2, not API keys'
            });
        } catch (error) {
            debugMonitor.log('warn', '[Gemini Live Direct] Failed to get Vertex AI token, trying API key (will likely fail)', {
                error: error.message
            });
            // Fallback to API key if Vertex AI fails (will likely get 400 error)
            if (GEMINI_API_KEY) {
                useApiKey = true;
                debugMonitor.log('warn', '[Gemini Live Direct] Using API key - Live API WebSocket requires OAuth2', {
                    apiKeyLength: GEMINI_API_KEY.length,
                    expectedError: '400 Bad Request'
                });
            } else {
                throw new Error('Vertex AI OAuth2 required for Live API WebSocket. Failed to get access token: ' + error.message);
            }
        }
    } else if (GEMINI_API_KEY) {
        // No Vertex AI available, try API key (will likely fail with 400)
        useApiKey = true;
        debugMonitor.log('warn', '[Gemini Live Direct] Using API key - Live API WebSocket requires OAuth2', {
            apiKeyLength: GEMINI_API_KEY.length,
            expectedError: '400 Bad Request - Live API WebSocket needs Vertex AI OAuth2'
        });
    } else {
        throw new Error('Live API WebSocket requires Vertex AI OAuth2. Set up Google Cloud Vertex AI.');
    }

    // Try different Live API model names (in order of preference)
    // ⚠️ IMPORTANT: gemini-2.0-flash-live-preview-04-09 is currently the only working model
    // ⚠️ DEPRECATION: Gemini 2.0 series scheduled for shutdown no earlier than February 2026
    // 💡 RECOMMENDATION: Request access to Gemini 2.5+ models for longer-term support
    //    (Gemini 2.5 series: shutdown no earlier than June 2026)
    const liveModelNames = [
        'gemini-2.0-flash-live-preview-04-09',             // ✅ Currently working (deprecated Feb 2026)
        'gemini-2.5-flash-live',                          // ⚠️ May require additional access (deprecated June 2026+)
        'gemini-2.5-flash-native-audio-preview-09-2025',   // ⚠️ Latest model (may require additional access)
        'gemini-live-2.5-flash-preview',                  // ⚠️ Preview version (deprecated Dec 09, 2025)
        'gemini-live-2.5-flash'                           // Alternative name
    ];

    // Try each model name until one works
    let lastError = null;
    for (const liveModelName of liveModelNames) {
        try {
            let wsUrl;

            if (useApiKey) {
                // API key authentication - try different Live API endpoint formats
                // Note: Live API WebSocket typically requires Vertex AI (OAuth2), but we try API key formats
                // 400 errors suggest endpoint format issue - Live API may not support API keys for WebSocket
                const apiKeyEndpoints = [
                    // Format 1: WebSocket service path with key in query (most compatible)
                    `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService/BidiGenerateContent?key=${GEMINI_API_KEY}`,
                    // Format 2: WebSocket service path (header auth)
                    `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService/BidiGenerateContent`,
                    // Format 3: REST API style (unlikely to work for WebSocket)
                    `wss://generativelanguage.googleapis.com/v1beta/models/${liveModelName}:BidiGenerateContent?key=${GEMINI_API_KEY}&alt=ws`,
                ];

                // Try first endpoint format (query parameter auth)
                wsUrl = apiKeyEndpoints[0];
                debugMonitor.log('info', '[Gemini Live Direct] Using API key endpoint (query parameter)', {
                    model: liveModelName,
                    endpoint: 'generativelanguage.googleapis.com',
                    format: 'ws/.../BidiGenerateContent?key=***',
                    authMethod: 'query parameter',
                    note: 'Live API WebSocket may require Vertex AI (OAuth2) - 400 errors expected'
                });
            } else {
                // Vertex AI authentication - use Live API WebSocket endpoint (BidiGenerateContent, not streamGenerateContent)
                // Live API WebSocket uses different endpoint format than REST streaming
                wsUrl = `wss://${location}-aiplatform.googleapis.com/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent`;
                debugMonitor.log('info', '[Gemini Live Direct] Using Vertex AI Live API WebSocket endpoint', {
                    model: liveModelName,
                    endpoint: `${location}-aiplatform.googleapis.com`,
                    service: 'LlmBidiService/BidiGenerateContent',
                    note: 'Live API WebSocket endpoint (not REST streaming)'
                });
            }

            debugMonitor.log('info', '[Gemini Live Direct] Trying model', {
                model: liveModelName,
                url: wsUrl.replace(/\/v1\/projects\/[^/]+/, '/v1/projects/***')
                    .replace(/key=[^&]+/, 'key=***')
                    .replace(/Bearer\s+\S+/, 'Bearer ***'),
                authMethod: useApiKey ? 'API Key' : 'Vertex AI'
            });

            // Try connecting with this model name
            // Retry with different model formats AND client content formats
            let result = null;
            let formatAttempt = 0;
            let clientContentFormatAttempt = 0;
            const maxFormatAttempts = 4; // Try all 4 model formats
            const maxClientContentFormatAttempts = 4; // Try all 4 client content formats
            let formatsExhausted = false; // Flag to prevent further retries

            while (formatAttempt < maxFormatAttempts && !result && !formatsExhausted) {
                // Reset client content format attempt for each model format attempt
                clientContentFormatAttempt = 0;

                while (clientContentFormatAttempt < maxClientContentFormatAttempts && !result && !formatsExhausted) {
                    try {
                        // Pass formatAttempt and clientContentFormatAttempt to tryConnect
                        result = await tryConnect(wsUrl, useApiKey ? null : accessToken, liveModelName, contents, clientWs, useApiKey, useApiKey ? GEMINI_API_KEY : null, projectId, location, formatAttempt, clientContentFormatAttempt);
                        debugMonitor.log('info', '[Gemini Live Direct] ✅ Success with model', {
                            model: liveModelName,
                            formatAttempt: formatAttempt + 1,
                            clientContentFormatAttempt: clientContentFormatAttempt + 1
                        });
                        return result;
                    } catch (error) {
                        // Check if it's a client content format error that we can retry
                        if (error.message && error.message.startsWith('INVALID_CLIENT_CONTENT_FORMAT:') && clientContentFormatAttempt < maxClientContentFormatAttempts - 1) {
                            const parts = error.message.split(':');
                            clientContentFormatAttempt = parseInt(parts[1]) + 1 || clientContentFormatAttempt + 1;
                            debugMonitor.log('info', '[Gemini Live Direct] Retrying with different client content format', {
                                model: liveModelName,
                                clientContentFormatAttempt: clientContentFormatAttempt + 1,
                                maxAttempts: maxClientContentFormatAttempts
                            });
                            // Continue inner loop to retry with next client content format
                        } else if (error.message && (error.message.startsWith('MODEL_NOT_FOUND:') || error.message.startsWith('INVALID_MODEL_FORMAT:'))) {
                            const parts = error.message.split(':');
                            const reportedFormatAttempt = parseInt(parts[1]) || formatAttempt;

                            // Check if all formats are exhausted
                            if (error.message.includes(':EXHAUSTED') || reportedFormatAttempt >= maxFormatAttempts - 1) {
                                // All formats exhausted, break both loops and try next model
                                debugMonitor.log('warn', '[Gemini Live Direct] All model formats exhausted for this model - stopping all retries', {
                                    model: liveModelName,
                                    formatAttempt: reportedFormatAttempt + 1,
                                    maxAttempts: maxFormatAttempts,
                                    error: error.message
                                });
                                lastError = error;
                                formatsExhausted = true; // Set flag to prevent further retries
                                formatAttempt = maxFormatAttempts; // Set to max to exit outer loop
                                break; // Break inner loop
                            } else if (formatAttempt < maxFormatAttempts - 1) {
                                // Model format error (not found, permission denied, or invalid), break inner loop and try next model format
                                formatAttempt = reportedFormatAttempt + 1;

                                const errorType = error.message.startsWith('MODEL_NOT_FOUND:') ?
                                    (error.message.includes('Permission denied') ? 'Permission denied' : 'Model not found') :
                                    'Invalid format';
                                debugMonitor.log('info', '[Gemini Live Direct] Retrying with different model format', {
                                    model: liveModelName,
                                    formatAttempt: formatAttempt + 1,
                                    maxAttempts: maxFormatAttempts,
                                    errorType: errorType,
                                    previousFormatAttempt: reportedFormatAttempt
                                });
                                break; // Break inner loop, continue outer loop
                            } else {
                                // Should not reach here, but handle it
                                lastError = error;
                                break;
                            }
                        } else {
                            // Other error or exhausted retries, break both loops and try next model
                            debugMonitor.log('info', '[Gemini Live Direct] Non-retryable error, moving to next model', {
                                model: liveModelName,
                                formatAttempt: formatAttempt + 1,
                                error: error.message
                            });
                            lastError = error;
                            formatAttempt = maxFormatAttempts; // Set to max to exit outer loop
                            break;
                        }
                    }
                }

                // If we exhausted client content format retries, try next model format
                if (!result && !formatsExhausted && clientContentFormatAttempt >= maxClientContentFormatAttempts) {
                    formatAttempt++;
                    if (formatAttempt < maxFormatAttempts) {
                        debugMonitor.log('info', '[Gemini Live Direct] All client content formats failed, trying next model format', {
                            model: liveModelName,
                            formatAttempt: formatAttempt + 1
                        });
                    }
                }

                // If formats are exhausted, break outer loop immediately
                if (formatsExhausted) {
                    break;
                }
            }

            // If we exhausted all retries, throw error to try next model
            if (!result) {
                throw lastError || new Error('All model and client content formats failed');
            }
        } catch (error) {
            lastError = error;
            debugMonitor.log('warn', '[Gemini Live Direct] Model failed, trying next', {
                model: liveModelName,
                error: error.message
            });
            continue;
        }
    }

    // All models failed
    throw lastError || new Error('All Live model names failed');
}

module.exports = {
    connectToGeminiLive
};
