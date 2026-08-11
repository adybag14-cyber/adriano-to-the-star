/**
 * Google Cloud Vertex AI Backend Integration
 * Automatically uses Google Cloud when available, falls back to API key
 */

// Import VertexAI from the correct package
const { VertexAI } = require('@google-cloud/vertexai');
const debugMonitor = require('./debug-monitor');
const errorHandler = require('./error-handler');

class GoogleCloudBackend {
    constructor() {
        this.vertexAI = null;
        this.isAvailable = false;
        this.projectId = process.env.GOOGLE_CLOUD_PROJECT;
        this.location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
        this.initialize();
    }

    async initialize() {
        try {
            // Check if VertexAI class is available
            if (!VertexAI) {
                debugMonitor.log('warn', 'VertexAI class not found. Install @google-cloud/vertexai package', {
                    suggestion: 'Run: npm install @google-cloud/vertexai'
                });
                this.isAvailable = false;
                return;
            }
            
            // Check if Google Cloud credentials are available
            if (this.projectId && this.hasGoogleCloudCredentials()) {
                this.vertexAI = new VertexAI({
                    project: this.projectId,
                    location: this.location
                });
                this.isAvailable = true;
                debugMonitor.log('info', 'Google Cloud Vertex AI initialized', {
                    project: this.projectId,
                    location: this.location
                });
            } else {
                debugMonitor.log('info', 'Google Cloud not configured, using API key method', {
                    suggestion: 'Set GOOGLE_CLOUD_PROJECT and credentials for Vertex AI'
                });
            }
        } catch (error) {
            debugMonitor.log('error', 'Failed to initialize Google Cloud', { 
                error: error.message,
                stack: error.stack
            });
            this.isAvailable = false;
        }
    }

    hasGoogleCloudCredentials() {
        const now = Date.now();
        if (this._cachedCredentialsCheck && this._cachedCredentialsCheck.expiresAt > now) {
            return this._cachedCredentialsCheck.value;
        }

        let hasCredentials = false;

        // Check for service account key file
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            const fs = require('fs');
            const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
            hasCredentials = fs.existsSync(credPath);
        } else {
            // Check for default credentials (gcloud auth)
            try {
                const { execFileSync } = require('child_process');
                execFileSync('gcloud', ['auth', 'application-default', 'print-access-token'], {
                    stdio: 'ignore',
                    timeout: 2000
                });
                hasCredentials = true;
            } catch {
                hasCredentials = false;
            }
        }

        this._cachedCredentialsCheck = { value: hasCredentials, expiresAt: now + 60000 };
        return hasCredentials;
    }

    async callGeminiLive(modelName, contents, options = {}) {
        if (!this.isAvailable) {
            throw new Error('Google Cloud Vertex AI not available');
        }

        try {
            const model = this.vertexAI.preview.getGenerativeModel({
                model: modelName
            });

            const request = {
                contents: contents,
                generationConfig: {
                    temperature: options.temperature || 0.7,
                    maxOutputTokens: options.maxOutputTokens || 8192,
                    topP: options.topP || 0.95,
                    topK: options.topK || 40
                }
            };

            debugMonitor.log('info', 'Calling Google Cloud Vertex AI', {
                model: modelName,
                project: this.projectId
            });

            const result = await model.generateContent(request);
            const response = result.response;
            const text = response.text();

            debugMonitor.log('info', 'Google Cloud Vertex AI response received', {
                model: modelName,
                tokenCount: response.usageMetadata?.totalTokenCount
            });

            return text;
        } catch (error) {
            debugMonitor.log('error', 'Google Cloud Vertex AI error', {
                error: error.message,
                model: modelName
            });
            
            // Use error handler for recovery
            throw error;
        }
    }

    async streamGeminiLive(modelName, contents, options = {}) {
        if (!this.isAvailable) {
            throw new Error('Google Cloud Vertex AI not available');
        }

        try {
            const model = this.vertexAI.preview.getGenerativeModel({
                model: modelName
            });

            const request = {
                contents: contents,
                generationConfig: {
                    temperature: options.temperature || 0.7,
                    maxOutputTokens: options.maxOutputTokens || 8192
                }
            };

            const streamingResp = await model.generateContentStream(request);
            let fullText = '';

            for await (const chunk of streamingResp.stream) {
                // Handle different chunk formats from VertexAI SDK
                let chunkText = '';
                
                try {
                    // Log chunk structure for debugging (first chunk only)
                    if (fullText === '') {
                        debugMonitor.log('debug', 'First chunk structure', {
                            chunkType: typeof chunk,
                            chunkKeys: chunk ? Object.keys(chunk) : [],
                            hasResponse: !!chunk.response,
                            hasText: typeof chunk.text === 'function',
                            responseKeys: chunk.response ? Object.keys(chunk.response) : []
                        });
                    }
                    
                    // Method 1: chunk has candidates array (most common format based on logs)
                    if (chunk.candidates && chunk.candidates.length > 0) {
                        const candidate = chunk.candidates[0];
                        if (candidate.content && candidate.content.parts) {
                            chunkText = candidate.content.parts
                                .filter(part => part.text)
                                .map(part => part.text)
                                .join('');
                        }
                    }
                    // Method 2: chunk has response.text() method
                    else if (chunk.response && typeof chunk.response.text === 'function') {
                        chunkText = chunk.response.text();
                    }
                    // Method 3: chunk has text() method directly
                    else if (typeof chunk.text === 'function') {
                        chunkText = chunk.text();
                    }
                    // Method 4: chunk is a response object with text property
                    else if (chunk.text) {
                        chunkText = chunk.text;
                    }
                    // Method 5: Try to get text from response property
                    else if (chunk.response) {
                        if (chunk.response.text) {
                            chunkText = chunk.response.text;
                        } else if (chunk.response.candidates && chunk.response.candidates.length > 0) {
                            const candidate = chunk.response.candidates[0];
                            if (candidate.content && candidate.content.parts) {
                                chunkText = candidate.content.parts
                                    .filter(part => part.text)
                                    .map(part => part.text)
                                    .join('');
                            }
                        }
                    }
                    
                    if (chunkText) {
                        fullText += chunkText;
                    } else if (fullText === '') {
                        // Log warning if we couldn't extract text from first chunk
                        debugMonitor.log('warn', 'Could not extract text from chunk', {
                            chunkType: typeof chunk,
                            chunkKeys: chunk ? Object.keys(chunk) : []
                        });
                    }
                } catch (error) {
                    debugMonitor.log('error', 'Error extracting text from chunk', {
                        error: error.message,
                        errorStack: error.stack,
                        chunkType: typeof chunk,
                        chunkKeys: chunk ? Object.keys(chunk) : []
                    });
                }
            }

            return fullText;
        } catch (error) {
            debugMonitor.log('error', 'Google Cloud streaming error', { error });
            throw error;
        }
    }

    getStatus() {
        return {
            available: this.isAvailable,
            projectId: this.projectId,
            location: this.location,
            hasCredentials: this.hasGoogleCloudCredentials()
        };
    }
}

// Export singleton instance
const googleCloudBackend = new GoogleCloudBackend();

module.exports = googleCloudBackend;


