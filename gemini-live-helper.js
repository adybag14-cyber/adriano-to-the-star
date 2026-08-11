/**
 * Gemini Live API Helper
 * Provides WebSocket-based access to gemini-2.5-flash-live for unlimited RPM/RPD
 * Uses backend proxy to avoid browser CORS issues
 * Reusable helper for all AI features
 */

class GeminiLiveHelper {
    constructor() {
        this.apiKey = window.GEMINI_API_KEY || (typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : null);

        // Preferred: Supabase Edge Function proxy (no API key in browser)
        this.proxyUrl = (typeof window !== 'undefined' && window.GEMINI_PROXY_URL) ? window.GEMINI_PROXY_URL : null;

        // Optional: backend WebSocket URL for local development only
        // Convert http://localhost:3001 to ws://localhost:3001/api/gemini-live
        const isLocalhost = (typeof window !== 'undefined')
            && (window.location?.hostname === 'localhost'
                || window.location?.hostname === '127.0.0.1'
                || window.location?.hostname === '0.0.0.0');

        const apiBase = isLocalhost ? (window.STELLAR_AI_BACKEND_URL || 'http://localhost:3001') : 'https://api.adrianotothestar.com';

        if (typeof window !== 'undefined') {
            const backendUrl = apiBase.replace(/^https?:\/\//, '');
            const protocol = isLocalhost ? 'ws' : 'wss';
            this.backendWsUrl = `${protocol}://${backendUrl}/api/gemini-live`;
        } else {
            this.backendWsUrl = null;
        }
    }

    /**
     * Call Gemini Live model via WebSocket (bidiGenerateContent)
     * @param {string} prompt - User prompt
     * @param {Object} options - Configuration options
     * @returns {Promise<string>} AI response text
     */
    async callLiveModel(prompt, options = {}) {
        // Use gemini-2.5-flash-live for WebSocket (bidiGenerateContent) - supports unlimited RPM/RPD
        const modelName = options.modelName || 'gemini-2.5-flash-live';
        const temperature = options.temperature || 0.7;
        const maxOutputTokens = options.maxOutputTokens || 8192;

        // Check if backend is available
        if (!this.backendWsUrl) {
            throw new Error('Backend WebSocket proxy not available. Please start the backend server or set STELLAR_AI_BACKEND_URL.');
        }

        return new Promise((resolve, reject) => {
            // Use backend WebSocket proxy (avoids browser CORS issues)
            // Backend handles connection to Gemini Live API with API key
            // No API key needed in frontend - backend has it
            const wsUrl = this.backendWsUrl;

            let responseText = '';
            let setupComplete = false;
            let timeoutId = null;

            // Setup message to initialize the session
            const setupMessage = {
                setup: {
                    model: `models/${modelName}`,
                    generationConfig: {
                        temperature: temperature,
                        maxOutputTokens: maxOutputTokens,
                        topP: 0.95,
                        topK: 40,
                        responseModalities: ["TEXT"]
                    }
                }
            };

            // Client content message
            const clientMessage = {
                clientContent: {
                    parts: [{ text: prompt }]
                }
            };

            try {
                const websocket = new WebSocket(wsUrl);

                // Set timeout (30 seconds)
                timeoutId = setTimeout(() => {
                    websocket.close();
                    reject(new Error('WebSocket timeout'));
                }, 30000);

                websocket.onopen = () => {
                    console.log(`[Gemini Live] WebSocket connected for ${modelName}`);
                    // Send setup message
                    websocket.send(JSON.stringify(setupMessage));
                };

                websocket.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);

                        // Check for setup completion
                        if (data.setupComplete || data.BidiGenerateContentSetupComplete ||
                            (data.setup && data.setup.complete)) {
                            setupComplete = true;
                            console.log(`[Gemini Live] Setup complete for ${modelName}`);
                            // Send client content after setup
                            websocket.send(JSON.stringify(clientMessage));
                            return;
                        }

                        // Check for errors
                        if (data.error) {
                            clearTimeout(timeoutId);
                            reject(new Error(`API error: ${data.error.message || JSON.stringify(data.error)}`));
                            websocket.close();
                            return;
                        }

                        // Extract server content (response)
                        // Official format: serverContent can have either:
                        // 1. parts directly (serverContent.parts)
                        // 2. modelTurn with parts (serverContent.modelTurn.parts)
                        if (data.serverContent) {
                            const serverContent = data.serverContent;

                            // Try parts directly first (official format)
                            if (serverContent.parts && Array.isArray(serverContent.parts)) {
                                serverContent.parts.forEach(part => {
                                    if (part.text) {
                                        responseText += part.text;
                                    }
                                });
                            }
                            // Fallback to modelTurn format
                            else if (serverContent.modelTurn && serverContent.modelTurn.parts) {
                                serverContent.modelTurn.parts.forEach(part => {
                                    if (part.text) {
                                        responseText += part.text;
                                    }
                                });
                            }

                            // Check if response is complete
                            if (data.done || serverContent.modelTurn?.complete ||
                                data.BidiGenerateContentResponse) {
                                clearTimeout(timeoutId);
                                websocket.close();
                                if (responseText) {
                                    resolve(responseText.trim());
                                } else {
                                    reject(new Error('Empty response from Gemini Live API'));
                                }
                            }
                        }
                    } catch (error) {
                        clearTimeout(timeoutId);
                        console.error('[Gemini Live] Error parsing WebSocket message:', error);
                        reject(error);
                        websocket.close();
                    }
                };

                websocket.onerror = (error) => {
                    clearTimeout(timeoutId);
                    console.error('[Gemini Live] WebSocket error:', error);
                    reject(new Error('WebSocket connection error'));
                };

                websocket.onclose = (event) => {
                    clearTimeout(timeoutId);
                    if (!setupComplete && event.code !== 1000) {
                        reject(new Error(`WebSocket closed unexpectedly: ${event.code} ${event.reason}`));
                    }
                };

            } catch (error) {
                clearTimeout(timeoutId);
                reject(error);
            }
        });
    }

    async fetchJSON(url, options = {}) {
        try {
            // First attempt: direct fetch
            const response = await fetch(url, options);
            if (response.ok) return await response.json();
            throw new Error(`HTTP error! status: ${response.status}`);
        } catch (error) {
            console.warn(`[gemini-live-helper] Direct fetch failed for ${url}, attempting proxies...`, error);
            
            // Second attempt: AllOrigins proxy
            try {
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl);
                if (proxyRes.ok) {
                    const data = await proxyRes.json();
                    return typeof data.contents === 'string' ? JSON.parse(data.contents) : data.contents;
                }
            } catch (proxyError) {
                console.warn('[gemini-live-helper] AllOrigins proxy failed:', proxyError);
            }

            // Third attempt: corsproxy.io fallback
            try {
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl, options);
                if (proxyRes.ok) return await proxyRes.json();
            } catch (proxyError) {
                console.error('[gemini-live-helper] All proxies failed:', proxyError);
            }

            throw error; // Rethrow original error if all fail
        }
    }

    /**
     * Call Gemini via Supabase Edge Function proxy (HTTP)
     * Prefers supabase.functions.invoke('gemini-proxy'),
     * falls back to direct fetch(GEMINI_PROXY_URL) if needed.
     */
    async callViaProxy(prompt, options = {}) {
        const modelName = options.modelName || 'gemini-2.5-flash';
        const temperature = options.temperature || 0.7;
        const maxOutputTokens = options.maxOutputTokens || 8192;

        // Try Supabase client first (handles JWT / verify_jwt)
        try {
            const supabaseClient = (typeof window !== 'undefined' && (window.supabaseClient || window.supabase)) ?
                (window.supabaseClient || window.supabase) : null;

            if (supabaseClient && supabaseClient.functions && typeof supabaseClient.functions.invoke === 'function') {
                const { data, error } = await supabaseClient.functions.invoke('gemini-proxy', {
                    body: { prompt, modelName, temperature, maxOutputTokens }
                });

                if (error) {
                    throw new Error(error.message || String(error));
                }

                if (data && typeof data.text === 'string') {
                    return data.text;
                }

                return '';
            }
        } catch (e) {
            console.warn('[Gemini Live] Supabase gemini-proxy invoke failed, trying HTTP proxy if configured:', e);
        }

        // Fallback: direct HTTP call to proxy URL (if available)
        if (!this.proxyUrl) {
            throw new Error('Gemini proxy URL not configured');
        }

        const response = await fetch(this.proxyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, modelName, temperature, maxOutputTokens })
        });

        if (!response.ok) {
            const text = await response.text().catch(() => '');
            throw new Error(`Gemini proxy HTTP error: ${response.status} ${text}`);
        }

        const data = await response.json();
        if (data && typeof data.text === 'string') {
            return data.text;
        }
        return '';
    }

    /**
     * Simple REST API fallback (if WebSocket fails)
     * Uses gemini-2.5-flash via REST (live models don't support REST endpoints)
     */
    async callLiveModelREST(prompt, options = {}) {
        if (!this.apiKey) {
            throw new Error('Gemini API key not configured');
        }

        // Live models don't support REST endpoints - use standard model
        const modelName = options.modelName || 'gemini-2.5-flash';
        const temperature = options.temperature || 0.7;
        const maxOutputTokens = options.maxOutputTokens || 8192;

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.apiKey}`;
            const data = await this.fetchJSON(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: temperature,
                        maxOutputTokens: maxOutputTokens
                    }
                })
            });

            return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } catch (error) {
            console.error('[Gemini Live] REST API error:', error);
            throw error;
        }
    }

    /**
     * Call with automatic fallback (WebSocket first, then REST)
     */
    async callWithFallback(prompt, options = {}) {
        // 1) Supabase Edge Function proxy (preferred)
        if (this.proxyUrl || (typeof window !== 'undefined' && (window.supabaseClient || window.supabase))) {
            try {
                return await this.callViaProxy(prompt, options);
            } catch (proxyError) {
                console.warn('[Gemini Live] Proxy call failed, falling back:', proxyError);
            }
        }

        // 2) Optional WebSocket backend (only if configured)
        if (this.backendWsUrl) {
            try {
                return await this.callLiveModel(prompt, options);
            } catch (wsError) {
                console.warn('[Gemini Live] WebSocket failed, trying REST fallback:', wsError);
            }
        }

        // 3) Direct REST API as last resort (requires real API key)
        if (this.apiKey && this.apiKey !== 'YOUR_API_KEY_HERE') {
            try {
                return await this.callLiveModelREST(prompt, options);
            } catch (restError) {
                console.error('[Gemini Live] REST fallback failed:', restError);
                throw restError;
            }
        }

        throw new Error('No Gemini backend available (proxy, WebSocket, or REST).');
    }
}

// Export singleton instance
let geminiLiveHelperInstance = null;

function getGeminiLiveHelper() {
    if (!geminiLiveHelperInstance) {
        geminiLiveHelperInstance = new GeminiLiveHelper();
    }
    return geminiLiveHelperInstance;
}

// Export globally
window.GeminiLiveHelper = GeminiLiveHelper;
window.geminiLiveHelper = () => getGeminiLiveHelper();

