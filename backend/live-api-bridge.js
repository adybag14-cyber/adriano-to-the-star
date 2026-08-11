/**
 * Live API Bridge - Connects Node.js to Python Live API Service
 * Spawns Python process and communicates via stdin/stdout JSON
 */

const { spawn } = require('child_process');
const path = require('path');
const debugMonitor = require('./debug-monitor');

class LiveAPIBridge {
    constructor() {
        this.pythonProcess = null;
        this.isReady = false;
        this.pendingRequests = new Map();
        this.requestId = 0;
        this._restartTimer = null;
        this._restartDisabled = false;
    }

    /**
     * Start Python service
     */
    start() {
        if (this.pythonProcess) {
            debugMonitor.log('warn', '[Live API Bridge] Python process already running');
            return;
        }

        if (this._restartDisabled) {
            debugMonitor.log('warn', '[Live API Bridge] Restart disabled; not starting Python process');
            return;
        }

        const pythonScript = path.join(__dirname, 'live-api-python-service.py');
        const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

        debugMonitor.log('info', '[Live API Bridge] Starting Python service', {
            script: pythonScript,
            command: pythonCmd
        });

        this.pythonProcess = spawn(pythonCmd, [pythonScript], {
            cwd: __dirname,
            env: {
                ...process.env,
                PYTHONIOENCODING: 'utf-8',
                PYTHONUNBUFFERED: '1'
            }
        });

        let buffer = '';

        this.pythonProcess.stdout.on('data', (data) => {
            buffer += data.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const message = JSON.parse(line);
                        this.handlePythonMessage(message);
                    } catch (error) {
                        debugMonitor.log('error', '[Live API Bridge] Error parsing Python output', {
                            error: error.message,
                            line: line.substring(0, 200)
                        });
                    }
                }
            }
        });

        this.pythonProcess.stderr.on('data', (data) => {
            debugMonitor.log('warn', '[Live API Bridge] Python stderr', {
                message: data.toString()
            });
        });

        this.pythonProcess.on('exit', (code) => {
            debugMonitor.log('warn', '[Live API Bridge] Python process exited', {
                code: code
            });
            this.pendingRequests.forEach((requestData, id) => {
                if (!requestData.resolved && requestData.reject) {
                    requestData.resolved = true;
                    requestData.reject(new Error('Python service exited'));
                }
            });
            this.pendingRequests.clear();
            this.pythonProcess = null;
            this.isReady = false;
            
            // Restart after delay
            if (code !== 0 && !this._restartDisabled) {
                if (this._restartTimer) {
                    clearTimeout(this._restartTimer);
                }
                this._restartTimer = setTimeout(() => {
                    this._restartTimer = null;
                    debugMonitor.log('info', '[Live API Bridge] Restarting Python service');
                    this.start();
                }, 5000);
            }
        });

        this.pythonProcess.on('error', (error) => {
            debugMonitor.log('error', '[Live API Bridge] Failed to start Python process', {
                error: error.message
            });
            this.pythonProcess = null;
            this.isReady = false;
        });
    }

    /**
     * Handle messages from Python service
     */
    handlePythonMessage(message) {
        if (message.status === 'ready' || message.status === 'initialized') {
            this.isReady = true;
            debugMonitor.log('info', '[Live API Bridge] Python service ready', {
                method: message.method || 'unknown'
            });
            return;
        }

        // Python uses request_id (snake_case), JavaScript uses requestId (camelCase)
        const requestId = message.request_id || message.requestId;
        
        if (message.type === 'connecting') {
            // Use requestId from message if available, otherwise use the one we extracted
            const msgRequestId = message.request_id || requestId;
            debugMonitor.log('info', '[Live API Bridge] Python connecting to model', {
                model: message.model,
                requestId: msgRequestId || requestId
            });
            return;
        }

        if (message.type === 'connected') {
            const msgRequestId = message.request_id || requestId;
            debugMonitor.log('info', '[Live API Bridge] Python connected to Live API', {
                model: message.model,
                requestId: msgRequestId || requestId
            });
            return;
        }

        if (message.type === 'text_chunk') {
            // Store text chunks for this request
            const msgRequestId = message.request_id || message.requestId || requestId;
            const requestData = this.pendingRequests.get(msgRequestId);
            if (requestData && requestData.type === 'streaming') {
                if (!requestData.chunks) {
                    requestData.chunks = [];
                }
                requestData.chunks.push(message.text);
                
                console.log(`[Live API Bridge] 📝 Received chunk #${requestData.chunks.length} (${message.text.length} chars) for request #${msgRequestId}`);
                
                // Forward chunk to client if WebSocket available
                if (requestData.clientWs && requestData.clientWs.readyState === 1) {
                    requestData.clientWs.send(JSON.stringify({
                        serverContent: {
                            parts: [{ text: message.text }]
                        }
                    }));
                    console.log(`[Live API Bridge] ➡️ Forwarded chunk to client WebSocket`);
                } else {
                    console.log(`[Live API Bridge] ⚠️ Client WebSocket not ready (state: ${requestData.clientWs?.readyState})`);
                }
            }
            return;
        }

        if (message.type === 'complete') {
            // Find and resolve pending request
            const msgRequestId = message.request_id || message.requestId || requestId;
            const requestData = this.pendingRequests.get(msgRequestId);
            if (requestData) {
                const text = message.text || (requestData.chunks ? requestData.chunks.join('') : '');
                const elapsed = requestData.startTime ? Date.now() - requestData.startTime : 0;
                
                console.log(`[Live API Bridge] ✅ Request #${msgRequestId} completed:`, {
                    responseLength: text.length,
                    chunks: requestData.chunks?.length || 0,
                    elapsed: `${elapsed}ms`,
                    model: message.model
                });
                
                if (requestData.resolve && !requestData.resolved) {
                    requestData.resolved = true;
                    requestData.resolve(text);
                }
                this.pendingRequests.delete(msgRequestId);
                
                debugMonitor.log('info', '[Live API Bridge] Request completed', {
                    requestId: msgRequestId,
                    responseLength: text.length,
                    model: message.model,
                    elapsed: elapsed
                });
            }
            return;
        }

        if (message.type === 'error') {
            // Reject pending requests
            const msgRequestId = message.request_id || message.requestId || requestId;
            const requestData = this.pendingRequests.get(msgRequestId);
            if (requestData) {
                console.log(`[Live API Bridge] ❌ Request #${msgRequestId} failed:`, {
                    error: message.message,
                    tryingNext: message.trying_next,
                    model: message.model
                });
                
                if (requestData.reject && !requestData.resolved) {
                    requestData.resolved = true;
                    requestData.reject(new Error(message.message));
                }
                this.pendingRequests.delete(msgRequestId);
                
                debugMonitor.log('error', '[Live API Bridge] Request failed', {
                    requestId: msgRequestId,
                    error: message.message,
                    tryingNext: message.trying_next
                });
            }
        }
    }

    /**
     * Send request to Python service
     */
    async sendRequest(modelName, textInput, responseModalities = ['TEXT'], clientWs = null) {
        return new Promise((resolve, reject) => {
            if (!this.pythonProcess || !this.isReady) {
                // Start service if not running
                if (!this.pythonProcess) {
                    this.start();
                }
                
                // Wait for ready
                const checkReady = setInterval(() => {
                    if (this.isReady) {
                        clearInterval(checkReady);
                        this.sendRequest(modelName, textInput, responseModalities, clientWs)
                            .then(resolve)
                            .catch(reject);
                    }
                }, 100);
                
                setTimeout(() => {
                    clearInterval(checkReady);
                    reject(new Error('Python service not ready'));
                }, 10000);
                return;
            }

            const requestId = ++this.requestId;
            
            console.log(`[Live API Bridge] 📤 Preparing request #${requestId}:`, {
                model: modelName,
                textLength: textInput.length,
                textPreview: textInput.substring(0, 80) + (textInput.length > 80 ? '...' : ''),
                streaming: !!clientWs
            });
            
            // Store request data with resolve/reject functions
            this.pendingRequests.set(requestId, {
                type: clientWs ? 'streaming' : 'simple',
                resolve: resolve,
                reject: reject,
                clientWs: clientWs,
                chunks: [],
                startTime: Date.now()
            });

            const request = {
                action: 'process',
                model: modelName,
                text: textInput,
                response_modalities: responseModalities,
                requestId: requestId  // Send as camelCase, Python will convert
            };

            try {
                this.pythonProcess.stdin.write(JSON.stringify(request) + '\n');
                console.log(`[Live API Bridge] ✅ Request #${requestId} sent to Python service`);
                debugMonitor.log('info', '[Live API Bridge] Sent request to Python', {
                    model: modelName,
                    requestId: requestId,
                    textLength: textInput.length
                });
                
                // Set timeout for request (30 seconds)
                setTimeout(() => {
                    const requestData = this.pendingRequests.get(requestId);
                    if (requestData && !requestData.resolved) {
                        requestData.resolved = true;
                        this.pendingRequests.delete(requestId);
                        const elapsed = Date.now() - requestData.startTime;
                        debugMonitor.log('warn', '[Live API Bridge] Request timeout', {
                            requestId: requestId,
                            elapsed: elapsed,
                            model: modelName
                        });
                        reject(new Error(`Python Live API request timeout after ${elapsed}ms`));
                    }
                }, 30000);
            } catch (error) {
                this.pendingRequests.delete(requestId);
                reject(error);
            }
        });
    }

    /**
     * Check if Python service is available
     */
    isAvailable() {
        return this.pythonProcess !== null && this.isReady;
    }

    /**
     * Stop Python service
     */
    stop() {
        if (this.pythonProcess) {
            this._restartDisabled = true;
            if (this._restartTimer) {
                clearTimeout(this._restartTimer);
                this._restartTimer = null;
            }
            this.pythonProcess.kill();
            this.pythonProcess = null;
            this.isReady = false;
        }
    }
}

// Export singleton instance
const liveAPIBridge = new LiveAPIBridge();

module.exports = liveAPIBridge;

