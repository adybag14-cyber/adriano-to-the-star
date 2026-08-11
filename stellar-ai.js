/* global SpeechSynthesisUtterance, SpeechRecognition, webkitSpeechRecognition */

/**
 * Stellar AI - Advanced Chat Interface with Puter.js
 * 
 * A comprehensive AI chat interface with features including:
 * - Multi-model AI support (Claude, GPT, Gemini, Llama)
 * - Image and document upload
 * - Voice input/output
 * - Chat history management
 * - User authentication
 * - Puter.js integration
 * 
 * @class StellarAI
 * @author Adriano To The Star
 * @version 1.0.0
 * @since 2025-01
 * 
 * @example
 * // Initialize Stellar AI
 * const ai = new StellarAI();
 */
class StellarAI {
    /**
     * Create a new StellarAI instance
     * 
     * Initializes the chat interface, sets up event listeners,
     * and loads user session and chat history.
     * 
     * @constructor
     */
    constructor() {
        this.currentChatId = null;
        this.chats = [];
        this.currentUser = null;
        this.attachedImages = [];
        this.attachedFiles = []; // For PDF, DOCX, and other documents
        this.isProcessing = false;
        this.selectedModel = 'sonnet-4.5'; // Default model
        let storedCerebrasKey = null;
        try {
            storedCerebrasKey = localStorage.getItem('stellarAI_cerebras_api_key');
        } catch (e) {
            storedCerebrasKey = null;
        }

        this.cerebrasApiKey = (typeof window !== 'undefined' && window.CEREBRAS_API_KEY)
            ? window.CEREBRAS_API_KEY
            : ((typeof window !== 'undefined' && window.ENV && window.ENV.CEREBRAS_API_KEY)
                ? window.ENV.CEREBRAS_API_KEY
                : (storedCerebrasKey || 'YOUR_CEREBRAS_API_KEY_HERE'));
        this.cerebrasModel = 'qwen-3-235b-a22b-instruct-2507';
        this.cerebrasEndpoint = 'https://api.cerebras.ai/v1/chat/completions';
        this.puterAvailable = false;
        this.voiceEnabled = false;
        this.isListening = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.currentUtterance = null;
        this.voiceAutoSend = false; // Auto-send after voice input
        this.voiceCommands = {
            'send message': () => this.sendMessage(),
            'new chat': () => this.createNewChat(),
            'clear input': () => {
                const input = document.getElementById('message-input');
                if (input) input.value = '';
                this.updateCharCount();
            },
            'stop listening': () => {
                if (this.isListening) this.recognition.stop();
            }
        };

        this.init();
    }

    async fetchJSON(url, options = {}) {
        try {
            const res = await fetch(url, options);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.warn(`[Stellar AI] Direct fetch failed for ${url}, attempting proxy...`, e.message);

            // Try AllOrigins first
            try {
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl);
                if (!proxyRes.ok) throw new Error(`Proxy HTTP ${proxyRes.status}`);
                const data = await proxyRes.json();
                if (data && data.contents) {
                    return JSON.parse(data.contents);
                }
            } catch (proxyError) {
                console.warn('[Stellar AI] AllOrigins proxy failed, trying corsproxy.io...', proxyError.message);
            }

            // Fallback to corsproxy.io
            try {
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl, options);
                if (!proxyRes.ok) throw new Error(`Proxy HTTP ${proxyRes.status}`);
                return await proxyRes.json();
            } catch (proxyError) {
                console.error('[Stellar AI] All proxies failed:', proxyError.message);
                throw e; // Re-throw original error
            }
        }
    }

    /**
     * Initialize the Stellar AI system
     * 
     * Sets up Puter.js integration, loads user session and chat history,
     * initializes event listeners and voice features, and creates initial chat.
     * 
     * @public
     * @async
     * @returns {Promise<void>}
     */
    async init() {
        this.trackEvent('initialized');

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', resolve);
                } else {
                    resolve();
                }
            });
        }

        // Initialize Puter
        await this.initPuter();

        // Load user session
        this.loadUserSession();

        // Load chat history
        this.loadChatHistory();

        // Setup event listeners (with retry mechanism)
        this.setupEventListeners();

        // Initialize Voice Features
        this.initVoiceFeatures();

        // Create initial chat if none exists
        if (this.chats.length === 0) {
            this.createNewChat();
        }

        console.log('✅ Stellar AI initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric('s_te_ll_ar_ai_' + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    /**
     * Initialize Puter.js SDK integration
     * 
     * Checks for Puter SDK availability and stores authentication token
     * for CLI use if user is authenticated.
     * 
     * @private
     * @async
     * @returns {Promise<void>}
     */
    async initPuter() {
        try {
            window.PUTER_DISABLE_AUTO_LOGIN = true;
            this.puterAvailable = false;

            // Skip Puter.js entirely if using live models
            if (this.selectedModel && (this.selectedModel.includes('live') || this.selectedModel.includes('native-audio'))) {
                console.log('Skipping Puter.js initialization - using live model');
                this.puterAvailable = false;
                return;
            }

            // Set flag to prevent Puter.js from auto-login
            window.PUTER_DISABLE_AUTO_LOGIN = true;

            // Initialize Puter SDK (only if not using live models)
            // Live models use backend WebSocket and don't need Puter.js
            if (typeof puter !== 'undefined') {
                console.log('✅ Puter SDK loaded');
                this.puterAvailable = true;

                // Only check authentication if Puter.js is actually needed
                // Don't trigger login popup for live models
                try {
                    // Check if user is authenticated (non-blocking, won't trigger login)
                    if (puter.auth && puter.auth.isSignedIn) {
                        // Only call isSignedIn() if it exists and won't trigger login
                        const isSignedIn = typeof puter.auth.isSignedIn === 'function'
                            ? puter.auth.isSignedIn()
                            : false;

                        if (isSignedIn) {
                            try {
                                if (puter.auth.getToken) {
                                    const token = puter.auth.getToken();
                                    if (token) {
                                        localStorage.setItem('puterAuthToken', token);
                                        console.log('✅ Puter.js authenticated - token saved for CLI');
                                    }
                                }
                            } catch (e) {
                                console.warn('Could not get Puter token:', e);
                            }
                        }
                    }
                } catch (e) {
                    // Silently fail - Puter.js not needed for live models
                    console.log('Puter.js auth check skipped (not needed for live models)');
                }
            } else {
                console.log('ℹ️  Puter SDK not available - using backend WebSocket for live models');
                this.puterAvailable = false;
            }
        } catch (error) {
            console.log('ℹ️  Puter.js initialization skipped (not needed for live models)');
            this.puterAvailable = false;
        }
    }

    /**
     * Setup all event listeners for UI interactions
     * 
     * Attaches listeners for send button, message input, file uploads,
     * chat management, model selection, voice controls, and authentication.
     * 
     * @private
     * @returns {void}
     */
    setupEventListeners() {
        // Send button
        const sendBtn = document.getElementById('send-btn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        // Message input
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }

                // Auto-resize textarea
                this.autoResizeTextarea(messageInput);
            });

            messageInput.addEventListener('input', () => {
                this.updateCharCount();
                this.autoResizeTextarea(messageInput);
            });
        }

        // Attach button
        const attachBtn = document.getElementById('attach-btn');
        const fileInput = document.getElementById('file-input');
        if (attachBtn && fileInput) {
            attachBtn.addEventListener('click', () => {
                fileInput.click();
            });
        }

        // File input
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleFileUpload(e.target.files);
            });
        }

        // New chat button
        const newChatBtn = document.getElementById('new-chat-btn');
        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => {
                this.createNewChat();
            });
        }

        // Clear chat button
        const clearChatBtn = document.getElementById('clear-chat-btn');
        if (clearChatBtn) {
            clearChatBtn.addEventListener('click', () => {
                this.clearCurrentChat();
            });
        }

        // Export chat button
        const exportChatBtn = document.getElementById('export-chat-btn');
        if (exportChatBtn) {
            exportChatBtn.addEventListener('click', () => {
                this.exportChat();
            });
        }

        // Metrics button
        const metricsBtn = document.getElementById('metrics-btn');
        if (metricsBtn) {
            metricsBtn.addEventListener('click', () => {
                this.showMetricsDashboard();
            });
        }

        // Model selector
        const modelSelector = document.getElementById('model-selector');
        if (modelSelector) {
            modelSelector.addEventListener('change', (e) => {
                this.selectedModel = e.target.value;
                this.saveModelPreference();
                this.showModelChangeNotification();

                // If switching to live model, skip Puter.js checks
                // If switching away from live model, check Puter.js if needed (but don't trigger login)
                if (this.selectedModel && (this.selectedModel.includes('live') || this.selectedModel.includes('native-audio'))) {
                    console.log('Switched to live model - Puter.js not required');
                    // Set flag to prevent Puter.js from auto-login
                    window.PUTER_DISABLE_AUTO_LOGIN = true;
                    // Disable Puter.js availability
                    this.puterAvailable = false;
                    this.checkPuterToken();
                } else {
                    // Only check Puter.js token if switching to non-live model
                    // Don't trigger login - just check if already authenticated
                    // Try to load Puter.js if not already loaded
                    window.PUTER_DISABLE_AUTO_LOGIN = true;
                    this.puterAvailable = false;
                    this.checkPuterToken();
                }
            });

            // Load saved model preference
            this.loadModelPreference();
        }

        // Login button
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                this.showLoginModal();
            });
        }

        // CLI Download button
        const downloadCliBtn = document.getElementById('download-cli-btn');
        if (downloadCliBtn) {
            downloadCliBtn.addEventListener('click', () => {
                this.downloadCLI();
            });
        }

        // Copy token button
        const copyTokenBtn = document.getElementById('copy-token-btn');
        if (copyTokenBtn) {
            copyTokenBtn.addEventListener('click', () => {
                const tokenInput = document.getElementById('puter-token-input');
                if (tokenInput && tokenInput.value) {
                    tokenInput.select();
                    document.execCommand('copy');
                    copyTokenBtn.textContent = 'Copied!';
                    setTimeout(() => {
                        copyTokenBtn.textContent = 'Copy';
                    }, 2000);
                }
            });
        }

        // Check and display Puter token if available (only for non-live models)
        // Skip Puter.js checks if using live models - they don't need Puter.js
        if (!this.selectedModel || (!this.selectedModel.includes('live') && !this.selectedModel.includes('native-audio'))) {
            this.checkPuterToken();
        }

        // Voice Input Button
        const voiceInputBtn = document.getElementById('voice-input-btn');
        if (voiceInputBtn) {
            voiceInputBtn.addEventListener('click', () => this.toggleVoiceInput());
        }

        // Voice Output Button
        const voiceOutputBtn = document.getElementById('voice-output-btn');
        if (voiceOutputBtn) {
            voiceOutputBtn.addEventListener('click', () => this.toggleVoiceOutput());
        }

        // LiveKit Voice Agent Button
        const livekitVoiceBtn = document.getElementById('livekit-voice-btn');
        if (livekitVoiceBtn) {
            livekitVoiceBtn.addEventListener('click', () => this.toggleLiveKitVoice());
        }

        const chatContainers = document.querySelectorAll('.chat-container');
        if (chatContainers && chatContainers.length) {
            chatContainers.forEach(container => {
                container.addEventListener('click', (e) => {
                    const link = e.target.closest('a');
                    if (link && !link.hasAttribute('data-allow-navigation')) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                });
            });
        }

        // Initialize LiveKit Voice Integration
        this.initLiveKitVoice();
    }

    /**
     * Initialize voice recognition and synthesis features
     * 
     * Sets up Web Speech API for voice input and output.
     * Configures continuous recognition with interim results.
     * 
     * @private
     * @returns {void}
     */
    initVoiceFeatures() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true; // Enable continuous mode for better UX
            this.recognition.interimResults = true; // Show real-time transcription
            this.recognition.lang = 'en-US';
            this.recognition.maxAlternatives = 1;

            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateVoiceInputUI(true);
                this.showVoiceIndicator();
            };

            this.recognition.onend = () => {
                this.isListening = false;
                this.updateVoiceInputUI(false);
                this.hideVoiceIndicator();
            };

            this.recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                // Process all results
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }

                const input = document.getElementById('message-input');
                if (input) {
                    // Update input with final + interim transcript
                    input.value = finalTranscript + interimTranscript;
                    this.updateCharCount();
                    this.autoResizeTextarea(input);

                    // Check for voice commands in final transcript
                    if (finalTranscript) {
                        this.handleVoiceCommand(finalTranscript.trim().toLowerCase());
                    }
                }
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                this.isListening = false;
                this.updateVoiceInputUI(false);
                this.hideVoiceIndicator();

                // Show user-friendly error message
                if (event.error === 'no-speech') {
                    this.showVoiceNotification('No speech detected. Try again.', 'warning');
                } else if (event.error === 'audio-capture') {
                    this.showVoiceNotification('Microphone not found. Please check your microphone.', 'error');
                } else if (event.error === 'not-allowed') {
                    this.showVoiceNotification('Microphone permission denied. Please enable microphone access.', 'error');
                } else {
                    this.showVoiceNotification('Voice recognition error. Please try again.', 'error');
                }
            };
        } else {
            const btn = document.getElementById('voice-input-btn');
            if (btn) {
                btn.style.display = 'none';
                btn.title = 'Voice input not supported in this browser';
            }
            console.warn('Speech recognition not supported');
        }
    }

    /**
     * Handle voice commands from speech recognition
     * 
     * Processes voice commands like "send message", "new chat", etc.
     * Auto-sends message if voice auto-send is enabled.
     * 
     * @private
     * @param {string} transcript - Recognized speech text
     * @returns {boolean} True if a command was executed
     */
    handleVoiceCommand(transcript) {
        // Check for voice commands
        for (const [command, action] of Object.entries(this.voiceCommands)) {
            if (transcript.includes(command)) {
                action();
                this.showVoiceNotification(`Voice command executed: ${command}`, 'success');
                return true;
            }
        }

        // Auto-send if enabled
        if (this.voiceAutoSend && transcript.length > 5) {
            setTimeout(() => {
                this.sendMessage();
            }, 500); // Small delay to ensure transcription is complete
        }

        return false;
    }

    /**
     * Update voice input button UI state
     * 
     * @private
     * @param {boolean} isListening - Whether voice recognition is active
     * @returns {void}
     */
    updateVoiceInputUI(isListening) {
        const btn = document.getElementById('voice-input-btn');
        if (btn) {
            if (isListening) {
                btn.classList.add('listening');
                btn.style.color = '#ef4444';
                btn.style.animation = 'pulse 1.5s infinite';
                btn.title = 'Listening... Click to stop';
            } else {
                btn.classList.remove('listening');
                btn.style.color = '';
                btn.style.animation = '';
                btn.title = 'Voice Input';
            }
        }
    }

    /**
     * Show voice indicator overlay when listening
     * 
     * @private
     * @returns {void}
     */
    showVoiceIndicator() {
        let indicator = document.getElementById('voice-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'voice-indicator';
            indicator.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.9);
                border: 3px solid #ef4444;
                border-radius: 20px;
                padding: 2rem 3rem;
                z-index: 10000;
                text-align: center;
                color: white;
                font-family: 'Raleway', sans-serif;
            `;
            indicator.innerHTML = `
                <div style="font-size: 3rem; margin-bottom: 1rem;">🎤</div>
                <div style="font-size: 1.2rem; font-weight: 600; color: #ef4444;">Listening...</div>
                <div style="font-size: 0.9rem; margin-top: 0.5rem; opacity: 0.7;">Speak now</div>
            `;
            document.body.appendChild(indicator);
        }
        indicator.style.display = 'block';
    }

    /**
     * Hide voice indicator overlay
     * 
     * @private
     * @returns {void}
     */
    hideVoiceIndicator() {
        const indicator = document.getElementById('voice-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    /**
     * Show voice-related notification to user
     * 
     * @private
     * @param {string} message - Notification message
     * @param {string} [type='info'] - Notification type: 'info', 'success', 'error', 'warning'
     * @returns {void}
     */
    showVoiceNotification(message, type = 'info') {
        // Use existing notification system if available
        if (window.databaseAdvancedFeatures && window.databaseAdvancedFeatures.showNotification) {
            window.databaseAdvancedFeatures.showNotification(message, type);
            return;
        }

        // Fallback: simple notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'error' ? 'rgba(239, 68, 68, 0.9)' : type === 'success' ? 'rgba(74, 222, 128, 0.9)' : 'rgba(96, 165, 250, 0.9)'};
            color: white;
            border-radius: 8px;
            z-index: 10001;
            font-family: 'Raleway', sans-serif;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Toggle voice input recognition on/off
     * 
     * Starts or stops speech recognition based on current state.
     * 
     * @public
     * @returns {void}
     */
    toggleVoiceInput() {
        if (!this.recognition) {
            this.showVoiceNotification('Voice recognition not supported in this browser.', 'error');
            return;
        }

        if (this.isListening) {
            this.recognition.stop();
        } else {
            try {
                this.recognition.start();
            } catch (error) {
                console.error('Error starting voice recognition:', error);
                this.showVoiceNotification('Error starting voice recognition. Please try again.', 'error');
            }
        }
    }

    /**
     * Toggle voice output (text-to-speech) on/off
     * 
     * @public
     * @returns {void}
     */
    toggleVoiceOutput() {
        this.voiceEnabled = !this.voiceEnabled;
        const btn = document.getElementById('voice-output-btn');
        if (btn) {
            btn.textContent = this.voiceEnabled ? '🔊' : '🔇';
            btn.style.color = this.voiceEnabled ? '#4ade80' : '';
        }

        if (!this.voiceEnabled) {
            this.synthesis.cancel();
        }
    }

    /**
     * Speak text using text-to-speech
     * 
     * Strips markdown/HTML and splits long text into chunks for better synthesis.
     * 
     * @public
     * @param {string} text - Text to speak
     * @returns {void}
     */
    speak(text) {
        if (!this.voiceEnabled || !this.synthesis) return;

        // Cancel current speech
        this.synthesis.cancel();

        // Strip markdown/HTML for speech
        const cleanText = text
            .replace(/[*`#]/g, '') // Remove markdown formatting
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Convert markdown links to text
            .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
            .trim();

        // Split long text into chunks for better speech synthesis
        const maxLength = 200; // Characters per chunk
        const chunks = cleanText.length > maxLength
            ? this.splitTextIntoChunks(cleanText, maxLength)
            : [cleanText];

        // Speak chunks sequentially
        this.speakChunks(chunks, 0);
    }

    /**
     * Split text into chunks for speech synthesis
     * 
     * Splits by sentences to maintain natural speech flow.
     * 
     * @private
     * @param {string} text - Text to split
     * @param {number} maxLength - Maximum characters per chunk
     * @returns {Array<string>} Array of text chunks
     */
    splitTextIntoChunks(text, maxLength) {
        const chunks = [];
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

        let currentChunk = '';
        for (const sentence of sentences) {
            if ((currentChunk + sentence).length <= maxLength) {
                currentChunk += sentence;
            } else {
                if (currentChunk) chunks.push(currentChunk.trim());
                currentChunk = sentence;
            }
        }
        if (currentChunk) chunks.push(currentChunk.trim());

        return chunks.length > 0 ? chunks : [text];
    }

    /**
     * Speak text chunks sequentially
     * 
     * Recursively speaks each chunk, selecting best available voice.
     * 
     * @private
     * @param {Array<string>} chunks - Array of text chunks to speak
     * @param {number} index - Current chunk index
     * @returns {void}
     */
    speakChunks(chunks, index) {
        if (index >= chunks.length || !this.voiceEnabled) return;

        const utterance = new SpeechSynthesisUtterance(chunks[index]);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Select best available voice
        const voices = this.synthesis.getVoices();
        const preferredVoice = voices.find(v =>
            v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural'))
        ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.onend = () => {
            // Speak next chunk
            this.speakChunks(chunks, index + 1);
        };

        utterance.onerror = (error) => {
            console.error('Speech synthesis error:', error);
            // Continue with next chunk even on error
            this.speakChunks(chunks, index + 1);
        };

        this.currentUtterance = utterance;
        this.synthesis.speak(utterance);
    }

    /**
     * Initialize LiveKit Voice Integration
     * 
     * Sets up the LiveKit voice agent integration for real-time voice conversations.
     * 
     * @private
     * @returns {void}
     */
    initLiveKitVoice() {
        // Check if LiveKitVoiceIntegration is available
        if (typeof LiveKitVoiceIntegration === 'undefined') {
            console.warn('LiveKit Voice Integration not loaded');
            const btn = document.getElementById('livekit-voice-btn');
            if (btn) {
                btn.style.display = 'none';
            }
            return;
        }

        // Initialize LiveKit voice integration
        this.livekitVoice = new LiveKitVoiceIntegration();

        const statusCallback = (status, message) => {
            console.log(`LiveKit Status: ${status} - ${message}`);
            this.showNotification(message, status === 'error' ? 'error' : 'info');

            // Update button state
            const btn = document.getElementById('livekit-voice-btn');
            if (btn) {
                if (status === 'connected') {
                    btn.textContent = '🎙️';
                    btn.style.color = '#4ade80';
                    btn.title = 'Disconnect from voice agent';
                    this.livekitConnected = true;
                } else if (status === 'disconnected' || status === 'error') {
                    btn.textContent = '🎙️';
                    btn.style.color = '';
                    btn.title = 'Start Live Voice Conversation';
                    this.livekitConnected = false;
                } else if (status === 'connecting') {
                    btn.textContent = '⏳';
                    btn.style.color = '#fbbf24';
                    btn.title = 'Connecting...';
                }
            }
        };

        const transcriptCallback = (data) => {
            // Handle transcript updates from LiveKit
            if (data.text) {
                console.log('LiveKit Transcript:', data.text);
                // Optionally add transcript to chat
            }
        };

        // Init now returns a Promise, handle it
        this.livekitVoice.init(statusCallback, transcriptCallback).then((success) => {
            if (!success) {
                console.error('LiveKit voice integration initialization failed');
            }
        }).catch((error) => {
            console.error('Error initializing LiveKit voice integration:', error);
        });
    }

    /**
     * Toggle LiveKit Voice Agent connection
     * 
     * Connects or disconnects from the LiveKit voice agent for real-time voice conversations.
     * 
     * @public
     * @async
     * @returns {Promise<void>}
     */
    async toggleLiveKitVoice() {
        if (!this.livekitVoice) {
            this.showNotification('LiveKit Voice Integration not available', 'error');
            return;
        }

        try {
            if (this.livekitConnected) {
                // Disconnect
                await this.livekitVoice.disconnect();
                this.showNotification('Disconnected from voice agent', 'info');
            } else {
                // Connect
                const userName = this.currentUser?.email || 'Guest';
                const connected = await this.livekitVoice.connect(userName);

                if (connected) {
                    this.showNotification('Connected to voice agent! Start speaking...', 'success');
                } else {
                    this.showNotification('Failed to connect to voice agent', 'error');
                }
            }
        } catch (error) {
            console.error('Error toggling LiveKit voice:', error);
            this.showNotification(`Error: ${error.message}`, 'error');
        }
    }

    /**
     * Show notification to user
     * 
     * @private
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, info)
     * @returns {void}
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#4ade80' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    /**
     * Auto-resize textarea based on content
     * 
     * @private
     * @param {HTMLTextAreaElement} textarea - Textarea element to resize
     * @returns {void}
     */
    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }

    /**
     * Update character count display
     * 
     * @private
     * @returns {void}
     */
    updateCharCount() {
        const input = document.getElementById('message-input');
        const charCount = document.getElementById('char-count');
        if (!input || !charCount) return;
        const count = input.value.length;
        charCount.textContent = `${count} / 4000`;
    }

    /**
     * Create a new chat conversation
     * 
     * Creates a new chat with unique ID, switches to it, and saves to history.
     * 
     * @public
     * @returns {void}
     */
    createNewChat() {
        const chatId = 'chat_' + Date.now();
        const chat = {
            id: chatId,
            title: 'New Chat',
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.chats.unshift(chat);
        this.switchToChat(chatId);
        this.updateChatHistory();
        this.saveChatHistory();

        // Hide welcome message
        this.hideWelcome();
    }

    /**
     * Switch to a different chat conversation
     * 
     * @public
     * @param {string} chatId - ID of chat to switch to
     * @returns {void}
     */
    switchToChat(chatId) {
        this.currentChatId = chatId;
        const chat = this.chats.find(c => c.id === chatId);

        if (chat) {
            const chatTitle = document.getElementById('current-chat-title');
            if (chatTitle) {
                chatTitle.textContent = chat.title;
            }
            this.renderMessages(chat.messages);
            this.updateChatHistory();
        }
    }

    /**
     * Hide welcome message
     * 
     * @private
     * @returns {void}
     */
    hideWelcome() {
        const welcome = document.querySelector('.welcome-message');
        if (welcome) {
            welcome.style.display = 'none';
        }
    }

    /**
     * Send a message to the AI
     * 
     * Processes user message, displays it, gets AI response, and saves chat.
     * Handles images and file attachments. Tracks metrics if available.
     * 
     * @public
     * @async
     * @returns {Promise<void>}
     */
    async sendMessage() {
        if (this.isProcessing) return;

        const input = document.getElementById('message-input');
        if (!input) {
            console.warn('⚠️ Message input not found');
            return;
        }
        const message = input.value.trim();

        if (!message && this.attachedImages.length === 0 && this.attachedFiles.length === 0) return;

        this.hideWelcome();
        this.isProcessing = true;
        const sendBtnEl = document.getElementById('send-btn');
        if (sendBtnEl) {
            sendBtnEl.disabled = true;
        }

        // Create user message
        const userMessage = {
            role: 'user',
            content: message,
            images: [...this.attachedImages],
            files: [...this.attachedFiles],
            timestamp: new Date().toISOString()
        };

        // Add to current chat
        const chat = this.chats.find(c => c.id === this.currentChatId);
        if (chat) {
            chat.messages.push(userMessage);

            // Update chat title if first message
            if (chat.messages.length === 1 && message) {
                chat.title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
                const chatTitle = document.getElementById('current-chat-title');
                if (chatTitle) {
                    chatTitle.textContent = chat.title;
                }
            }

            // Render message
            this.appendMessage(userMessage);

            // Clear input
            input.value = '';
            this.attachedImages = [];
            this.attachedFiles = [];
            const attachmentsPreview = document.getElementById('attachments-preview');
            if (attachmentsPreview) {
                attachmentsPreview.innerHTML = '';
            }
            this.updateCharCount();
            input.style.height = 'auto';

            // Show loading indicator
            this.showLoadingIndicator();

            // Track request start for metrics
            let requestId = null;
            if (window.aiModelMetrics && typeof window.aiModelMetrics === 'function') {
                const metrics = window.aiModelMetrics();
                if (metrics) {
                    requestId = metrics.startRequest(this.selectedModel, message, {
                        hasImages: this.attachedImages.length > 0,
                        hasFiles: this.attachedFiles.length > 0
                    });
                }
            }

            // Get AI response
            try {
                await this.getAIResponse(chat);

                // Track successful request
                if (requestId && window.aiModelMetrics && typeof window.aiModelMetrics === 'function') {
                    const metrics = window.aiModelMetrics();
                    if (metrics) {
                        const lastMessage = chat.messages[chat.messages.length - 1];
                        const responseText = lastMessage && lastMessage.role === 'assistant' ? lastMessage.content : '';
                        metrics.completeRequest(requestId, responseText, null);
                    }
                }

                let textCategoryInfo = null;
                if (message && window.textClassification && typeof window.textClassification.classify === 'function') {
                    try {
                        textCategoryInfo = await window.textClassification.classify(message, { source: 'stellar-ai' });
                    } catch (e) {
                        console.warn('Text classification failed:', e);
                    }
                }

                let fairnessSummary = null;
                if (window.aiModelBiasDetection && typeof window.aiModelBiasDetection.detectBias === 'function') {
                    try {
                        const modelId = `stellar-ai:${this.selectedModel}`;
                        const testData = [
                            { group: 'A', prediction: 1 },
                            { group: 'A', prediction: 0 },
                            { group: 'B', prediction: 1 },
                            { group: 'B', prediction: 1 }
                        ];
                        const detection = window.aiModelBiasDetection.detectBias(modelId, testData);
                        fairnessSummary = {
                            overallBias: detection && detection.overallBias ? detection.overallBias : null,
                            metric: 'demographic-parity',
                            disparity: detection && detection.biases && detection.biases[0] ? detection.biases[0].disparity : null
                        };
                    } catch (e) {
                        console.warn('AI fairness detection failed:', e);
                    }
                }

                if (window.aiUsageLogger && typeof window.aiUsageLogger.log === 'function') {
                    window.aiUsageLogger.log({
                        feature: 'stellar-ai',
                        model: this.selectedModel,
                        context: {
                            hasImages: this.attachedImages.length > 0,
                            hasFiles: this.attachedFiles.length > 0,
                            messageLength: message.length,
                            textCategory: textCategoryInfo && textCategoryInfo.category ? textCategoryInfo.category : null,
                            textCategoryConfidence: textCategoryInfo && typeof textCategoryInfo.confidence === 'number' ? textCategoryInfo.confidence : null,
                            fairness: fairnessSummary
                        }
                    });
                }
            } catch (error) {
                // Track failed request
                if (requestId && window.aiModelMetrics && typeof window.aiModelMetrics === 'function') {
                    const metrics = window.aiModelMetrics();
                    if (metrics) {
                        metrics.completeRequest(requestId, null, error);
                    }
                }
                throw error;
            }

            // Save chat
            this.saveChatHistory();
            this.updateChatHistory();
        }

        this.isProcessing = false;
        if (sendBtnEl) {
            sendBtnEl.disabled = false;
        }
        if (input) {
            input.focus();
        }
    }

    /**
     * Get AI response for the current chat
     * 
     * Uses selected AI model (Puter AI, Gemini Live, or fallback).
     * Handles errors gracefully and displays error messages to user.
     * 
     * @private
     * @async
     * @param {Object} chat - Chat object containing message history
     * @returns {Promise<void>}
     * @throws {Error} If AI response fails and no fallback available
     */
    async getAIResponse(chat) {
        try {
            let responseText = '';

            // Check if using Gemini Live model (including native audio)
            // IMPORTANT: Live models use backend WebSocket, NOT Puter.js
            if (this.selectedModel === 'gemini-2.5-flash-native-audio-preview-09-2025' ||
                this.selectedModel === 'gemini-2.5-flash-live-preview' ||
                this.selectedModel === 'gemini-2.5-flash-live' ||
                this.selectedModel === 'gemini-live-2.5-flash-preview' ||
                this.selectedModel.includes('live') ||
                this.selectedModel.includes('native-audio')) {
                console.log(`[Stellar AI] Using Live API for model: ${this.selectedModel}`);
                try {
                    responseText = await this.getGeminiLiveResponse(chat, true); // Enable streaming
                    // If we got an error message (starts with ⚠️ or "I apologize"), throw it so it's displayed
                    if (!responseText || responseText.trim().startsWith('⚠️') || responseText.includes('I apologize, but I encountered an error')) {
                        throw new Error(responseText || 'No response from Gemini Live API');
                    }
                } catch (liveError) {
                    console.error('[Stellar AI] Gemini Live API failed:', liveError);
                    // Re-throw to show error message, don't fall back to generic fallback
                    throw liveError;
                }
            } else if (this.selectedModel === 'qwen-3-235b-a22b-instruct-2507') {
                responseText = await this.getCerebrasResponse(chat);
            } else if (this.selectedModel === 'fallback') {
                responseText = this.getFallbackResponse(chat.messages[chat.messages.length - 1].content);
            } else if (this.puterAvailable && typeof puter !== 'undefined' && puter.ai && !this.selectedModel.includes('live') && !this.selectedModel.includes('native-audio')) {
                // Use Puter AI with selected model (ONLY for non-live models)
                // Live models should never use Puter.js - they use backend WebSocket
                console.log(`Using Puter AI with model: ${this.selectedModel}...`);

                // Prepare messages for Puter
                const messages = chat.messages.slice(-10).map(msg => ({
                    role: msg.role,
                    content: msg.content
                }));

                try {
                    // Call Puter AI with model parameter
                    const aiOptions = {
                        model: this.selectedModel,
                        messages: messages
                    };

                    // Try different Puter API formats
                    let response;
                    if (puter.ai.chat) {
                        response = await puter.ai.chat(messages, { model: this.selectedModel });
                    } else if (puter.ai.complete) {
                        response = await puter.ai.complete(aiOptions);
                    } else {
                        // Fallback to basic chat
                        response = await puter.ai.chat(messages);
                    }

                    responseText = response.message?.content || response.content || response.text || response;

                    if (!responseText) {
                        throw new Error('Empty response from AI');
                    }
                } catch (puterError) {
                    console.warn(`Puter AI error with ${this.selectedModel}, using fallback:`, puterError);
                    responseText = this.getFallbackResponse(chat.messages[chat.messages.length - 1].content);
                }
            } else {
                // Fallback response if Puter not available
                responseText = this.getFallbackResponse(chat.messages[chat.messages.length - 1].content);
            }

            // Create AI message
            const aiMessage = {
                role: 'assistant',
                content: responseText,
                model: this.selectedModel, // Store which model was used
                timestamp: new Date().toISOString()
            };

            // Remove loading indicator
            this.hideLoadingIndicator();

            // Add AI response to chat
            chat.messages.push(aiMessage);
            chat.updatedAt = new Date().toISOString();

            // Render AI response (if not already streaming)
            if (!this.streamingMessageElement) {
                this.appendMessage(aiMessage);
            } else {
                // Finalize streaming message
                this.finalizeStreamingMessage(aiMessage);
            }

            // Speak response if enabled
            this.speak(responseText);

        } catch (error) {
            console.error('Error getting AI response:', error);
            this.hideLoadingIndicator();

            // Show the actual error message instead of generic one
            const errorContent = error.message || 'I apologize, but I encountered an error processing your request. Please try again.';

            const errorMessage = {
                role: 'assistant',
                content: errorContent,
                timestamp: new Date().toISOString(),
                isError: true // Mark as error for styling
            };

            chat.messages.push(errorMessage);
            this.appendMessage(errorMessage);
        }
    }

    /**
     * Get fallback response when AI is unavailable
     * 
     * Provides predefined responses for common topics like exoplanets,
     * Andromeda, and Kepler objects.
     * 
     * @private
     * @param {string} userMessage - User's message
     * @returns {string} Fallback response text
     */
    getFallbackResponse(userMessage) {
        const responses = {
            'exoplanet': 'Exoplanets are planets that orbit stars outside our solar system. The Kepler mission has discovered thousands of exoplanets, many of which are in the habitable zone of their stars. Would you like to know more about specific types of exoplanets?',
            'andromeda': 'The Andromeda Galaxy (M31) is the nearest major galaxy to the Milky Way, located about 2.5 million light-years away. It contains approximately one trillion stars and is on a collision course with our galaxy, though this won\'t happen for another 4 billion years!',
            'kepler': 'Kepler objects are celestial bodies discovered by NASA\'s Kepler Space Telescope. The Kepler mission discovered over 2,600 confirmed exoplanets by monitoring the brightness of stars and detecting tiny dips that indicate a planet passing in front of them.',
            'default': `I'm Stellar AI, your cosmic assistant! I can help you learn about exoplanets, galaxies, space exploration, and the Kepler mission. What would you like to know about?`
        };

        const lowerMessage = userMessage.toLowerCase();
        for (const [key, response] of Object.entries(responses)) {
            if (lowerMessage.includes(key)) {
                return response;
            }
        }

        return responses.default;
    }

    /**
     * Show loading indicator while waiting for AI response
     * 
     * @private
     * @returns {void}
     */
    showLoadingIndicator() {
        const loadingHtml = `
            <div class="message ai-message loading-message">
                <div class="message-avatar">🌟</div>
                <div class="message-content">
                    <div class="message-loading">
                        <div class="loading-dot"></div>
                        <div class="loading-dot"></div>
                        <div class="loading-dot"></div>
                    </div>
                </div>
            </div>
        `;

        const container = document.getElementById('messages-container');
        container.insertAdjacentHTML('beforeend', loadingHtml);
        container.scrollTop = container.scrollHeight;
    }

    /**
     * Hide loading indicator
     * 
     * @private
     * @returns {void}
     */
    hideLoadingIndicator() {
        const loading = document.querySelector('.loading-message');
        if (loading) {
            loading.remove();
        }
    }

    /**
     * Append a message to the chat display
     * 
     * @private
     * @param {Object} message - Message object with role, content, timestamp
     * @returns {void}
     */
    appendMessage(message) {
        const container = document.getElementById('messages-container');
        const messageHtml = this.createMessageHTML(message);
        container.insertAdjacentHTML('beforeend', messageHtml);
        container.scrollTop = container.scrollHeight;
    }

    /**
     * Start streaming message display
     * Creates a message element that will be updated as chunks arrive
     * 
     * @private
     * @param {Object} initialMessage - Initial message object
     * @returns {HTMLElement} The streaming message element
     */
    startStreamingMessage(initialMessage) {
        const container = document.getElementById('messages-container');

        // Remove loading indicator
        this.hideLoadingIndicator();

        // Create streaming message element
        const messageHtml = this.createMessageHTML(initialMessage);
        container.insertAdjacentHTML('beforeend', messageHtml);

        // Get the newly added message element
        const messages = container.querySelectorAll('.message');
        this.streamingMessageElement = messages[messages.length - 1];
        this.streamingMessageId = initialMessage.timestamp || Date.now().toString();

        // Store reference in element
        if (this.streamingMessageElement) {
            this.streamingMessageElement.dataset.messageId = this.streamingMessageId;
        }

        container.scrollTop = container.scrollHeight;
        return this.streamingMessageElement;
    }

    /**
     * Update streaming message with new text chunk
     * 
     * @private
     * @param {string} chunk - New text chunk to append
     * @returns {void}
     */
    updateStreamingMessage(chunk) {
        if (!this.streamingMessageElement) {
            return;
        }

        const textElement = this.streamingMessageElement.querySelector('.message-text');
        if (textElement) {
            // Append chunk with smooth scrolling
            const currentText = textElement.textContent || '';
            textElement.textContent = currentText + chunk;

            // Auto-scroll to bottom
            const container = document.getElementById('messages-container');
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        }
    }

    /**
     * Finalize streaming message
     * 
     * @private
     * @param {Object} finalMessage - Final message object
     * @returns {void}
     */
    finalizeStreamingMessage(finalMessage) {
        if (this.streamingMessageElement) {
            const textElement = this.streamingMessageElement.querySelector('.message-text');
            if (textElement) {
                // Format final text with markdown if needed
                textElement.innerHTML = this.formatText(finalMessage.content);
            }

            // Clear streaming references
            this.streamingMessageElement = null;
            this.streamingMessageId = null;
        }
    }

    /**
     * Render all messages in a chat
     * 
     * Clears container and renders all messages, or shows welcome if empty.
     * 
     * @private
     * @param {Array<Object>} messages - Array of message objects
     * @returns {void}
     */
    renderMessages(messages) {
        const container = document.getElementById('messages-container');
        container.innerHTML = '';

        if (messages.length === 0) {
            // Show welcome message
            container.innerHTML = this.getWelcomeHTML();
            return;
        }

        messages.forEach(message => {
            container.insertAdjacentHTML('beforeend', this.createMessageHTML(message));
        });

        container.scrollTop = container.scrollHeight;
    }

    /**
     * Create HTML for a single message
     * 
     * Formats message with avatar, author, timestamp, and content.
     * Handles images and file attachments. Escapes HTML for security.
     * 
     * @private
     * @param {Object} message - Message object
     * @returns {string} HTML string for the message
     */
    createMessageHTML(message) {
        const time = new Date(message.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const isUser = message.role === 'user';
        const avatar = isUser ? '👤' : '🌟';
        let author = isUser ? 'You' : 'Stellar AI';

        // Add model info to AI messages
        if (!isUser && message.model) {
            author += ` (${this.getModelDisplayName(message.model)})`;
        }

        const messageClass = isUser ? 'user-message' : 'ai-message';

        let imagesHTML = '';
        if (message.images && message.images.length > 0) {
            imagesHTML = '<div class="message-images">' +
                message.images.map(img => {
                    const safeUrl = this.escapeHtml(img.url || '');
                    return `<img src="${safeUrl}" alt="Uploaded image" class="message-image" data-url="${safeUrl}">`;
                }).join('') +
                '</div>';
        }

        let filesHTML = '';
        if (message.files && message.files.length > 0) {
            filesHTML = '<div class="message-files">' +
                message.files.map(file => {
                    const safeName = this.escapeHtml(file.name || '');
                    const safeUrl = this.escapeHtml(file.url || '');
                    let icon = '📄';
                    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) icon = '📕';
                    else if (file.type.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) icon = '📘';
                    else if (file.type === 'text/plain' || file.name.endsWith('.txt')) icon = '📝';

                    return `<div class="message-file">
                        <span class="file-icon">${icon}</span>
                        <span class="file-name">${safeName}</span>
                        <a href="${safeUrl}" download="${safeName}" class="file-download">Download</a>
                    </div>`;
                }).join('') +
                '</div>';
        }

        // Escape all user-provided content
        const safeAuthor = this.escapeHtml(author);
        const safeTime = this.escapeHtml(time);
        const safeMessageClass = this.escapeHtml(messageClass);

        return `
            <div class="message ${safeMessageClass}">
                <div class="message-avatar">${avatar}</div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-author">${safeAuthor}</span>
                        <span class="message-time">${safeTime}</span>
                    </div>
                    <div class="message-text">${this.formatText(message.content)}</div>
                    ${imagesHTML}
                    ${filesHTML}
                </div>
            </div>
        `;
    }

    /**
     * Escape HTML to prevent XSS attacks
     * 
     * @private
     * @param {string} text - Text to escape
     * @returns {string} Escaped HTML string
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Format text with safe markdown-like styling
     * 
     * Converts markdown syntax to HTML after escaping to prevent XSS.
     * 
     * @private
     * @param {string} text - Text to format
     * @returns {string} Formatted HTML string
     */
    formatText(text) {
        if (!text) return '';
        // First escape HTML to prevent XSS
        const escaped = this.escapeHtml(text);
        // Then apply safe formatting (markdown-like)
        return escaped
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
    }

    /**
     * Get HTML for welcome message
     * 
     * @private
     * @returns {string} HTML string for welcome message
     */
    getWelcomeHTML() {
        return `
            <div class="welcome-message">
                <div class="welcome-icon">🌌</div>
                <h2>Welcome to Stellar AI</h2>
                <p>Your intelligent cosmic companion powered by advanced AI</p>
                <div class="welcome-features">
                    <div class="feature">
                        <span>💬</span>
                        <span>Natural Conversations</span>
                    </div>
                    <div class="feature">
                        <span>🖼️</span>
                        <span>Image Analysis</span>
                    </div>
                    <div class="feature">
                        <span>📚</span>
                        <span>Knowledge Base</span>
                    </div>
                    <div class="feature">
                        <span>💾</span>
                        <span>Save History</span>
                    </div>
                </div>
                <div class="example-prompts">
                    <p>Try asking:</p>
                    <button class="example-prompt" onclick="usePrompt('Tell me about exoplanets')">
                        Tell me about exoplanets
                    </button>
                    <button class="example-prompt" onclick="usePrompt('Explain the Andromeda galaxy')">
                        Explain the Andromeda galaxy
                    </button>
                    <button class="example-prompt" onclick="usePrompt('What is a Kepler object?')">
                        What is a Kepler object?
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Handle file upload (images and documents)
     * 
     * Validates file size (max 10MB) and type, then processes images
     * or documents accordingly.
     * 
     * @public
     * @param {FileList} files - FileList from file input
     * @returns {void}
     */
    handleFileUpload(files) {
        Array.from(files).forEach(file => {
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                alert(`${file.name} is too large. Maximum size is 10MB.`);
                return;
            }

            // Handle images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imageData = {
                        url: e.target.result,
                        name: file.name,
                        type: file.type,
                        size: file.size
                    };
                    this.attachedImages.push(imageData);
                    this.updateAttachmentsPreview();
                };
                reader.readAsDataURL(file);
            }
            // Handle documents (PDF, DOCX, DOC, TXT)
            else if (file.type === 'application/pdf' ||
                file.type === 'application/msword' ||
                file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                file.type === 'text/plain' ||
                file.name.endsWith('.pdf') ||
                file.name.endsWith('.doc') ||
                file.name.endsWith('.docx') ||
                file.name.endsWith('.txt')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const fileData = {
                        url: e.target.result,
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        isDocument: true
                    };
                    this.attachedFiles.push(fileData);
                    this.updateAttachmentsPreview();
                };
                reader.readAsDataURL(file);
            } else {
                alert(`File type ${file.type || 'unknown'} is not supported. Please select images, PDF, DOC, DOCX, or TXT files.`);
            }
        });
    }

    /**
     * Update attachments preview display
     * 
     * Shows thumbnails for images and file info for documents.
     * 
     * @private
     * @returns {void}
     */
    updateAttachmentsPreview() {
        const preview = document.getElementById('attachments-preview');
        if (!preview) return;

        preview.innerHTML = '';

        // Show images
        this.attachedImages.forEach((img, index) => {
            const item = document.createElement('div');
            item.className = 'attachment-item';

            const safeUrl = this.escapeHtml(img.url || '');
            const safeName = this.escapeHtml(img.name || '');

            const imgEl = document.createElement('img');
            imgEl.src = safeUrl;
            imgEl.className = 'attachment-thumbnail';
            imgEl.alt = safeName;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-attachment';
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', () => {
                this.removeImageAttachment(index);
            });

            item.appendChild(imgEl);
            item.appendChild(removeBtn);
            preview.appendChild(item);
        });

        // Show document files
        this.attachedFiles.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'attachment-item file-attachment';

            const safeName = this.escapeHtml(file.name || '');
            const fileSize = (file.size / 1024).toFixed(1) + ' KB';

            // Get file icon based on type
            let icon = '📄';
            if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) icon = '📕';
            else if (file.type.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) icon = '📘';
            else if (file.type === 'text/plain' || file.name.endsWith('.txt')) icon = '📝';

            item.innerHTML = `
                <div class="file-icon">${icon}</div>
                <div class="file-info">
                    <div class="file-name">${safeName}</div>
                    <div class="file-size">${fileSize}</div>
                </div>
                <button class="remove-attachment" onclick="window.stellarAI.removeFileAttachment(${index})">×</button>
            `;

            preview.appendChild(item);
        });
    }

    /**
     * Remove an image attachment
     * 
     * @public
     * @param {number} index - Index of attachment to remove
     * @returns {void}
     */
    removeImageAttachment(index) {
        this.attachedImages.splice(index, 1);
        this.updateAttachmentsPreview();
    }

    /**
     * Remove a file attachment
     * 
     * @public
     * @param {number} index - Index of attachment to remove
     * @returns {void}
     */
    removeFileAttachment(index) {
        this.attachedFiles.splice(index, 1);
        this.updateAttachmentsPreview();
    }

    /**
     * Update chat history sidebar
     * 
     * Renders list of all chats with titles and previews.
     * 
     * @private
     * @returns {void}
     */
    updateChatHistory() {
        const container = document.getElementById('chat-history-list');
        container.innerHTML = '';

        this.chats.forEach(chat => {
            const isActive = chat.id === this.currentChatId;
            const lastMessage = chat.messages[chat.messages.length - 1];
            const preview = lastMessage ? lastMessage.content.substring(0, 40) + '...' : 'Empty chat';

            const item = document.createElement('div');
            item.className = 'history-item' + (isActive ? ' active' : '');
            item.onclick = () => this.switchToChat(chat.id);
            item.innerHTML = `
                <div class="history-title">${chat.title}</div>
                <div class="history-preview">${preview}</div>
            `;
            container.appendChild(item);
        });
    }

    /**
     * Clear all messages in current chat
     * 
     * @public
     * @returns {void}
     */
    clearCurrentChat() {
        const chat = this.chats.find(c => c.id === this.currentChatId);
        if (chat && confirm('Clear all messages in this chat?')) {
            chat.messages = [];
            chat.title = 'New Chat';
            chat.updatedAt = new Date().toISOString();

            const chatTitle = document.getElementById('current-chat-title');
            if (chatTitle) {
                chatTitle.textContent = 'New Chat';
            }

            this.renderMessages([]);
            this.saveChatHistory();
            this.updateChatHistory();
        }
    }

    /**
     * Show AI performance metrics dashboard
     * 
     * Displays modal with AI model performance statistics.
     * 
     * @public
     * @returns {void}
     */
    showMetricsDashboard() {
        if (!window.aiModelMetrics || typeof window.aiModelMetrics !== 'function') {
            alert('Metrics system not available. Please refresh the page.');
            return;
        }

        const metrics = window.aiModelMetrics();
        if (!metrics) {
            alert('Metrics system not initialized. Please refresh the page.');
            return;
        }

        // Create modal for metrics dashboard
        const modal = document.createElement('div');
        modal.className = 'metrics-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            overflow-y: auto;
            padding: 2rem;
        `;

        const content = document.createElement('div');
        content.id = 'metrics-dashboard-container';
        content.style.cssText = `
            max-width: 1200px;
            margin: 0 auto;
            position: relative;
        `;

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 0;
            right: 0;
            background: rgba(186, 148, 79, 0.2);
            border: 2px solid rgba(186, 148, 79, 0.5);
            color: #ba944f;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 1.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            z-index: 10001;
        `;
        closeBtn.addEventListener('click', () => modal.remove());
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'rgba(186, 148, 79, 0.4)';
            closeBtn.style.transform = 'scale(1.1)';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'rgba(186, 148, 79, 0.2)';
            closeBtn.style.transform = 'scale(1)';
        });

        content.appendChild(closeBtn);
        modal.appendChild(content);
        document.body.appendChild(modal);

        // Display dashboard
        metrics.displayDashboard('metrics-dashboard-container');
    }

    /**
     * Export current chat to text file
     * 
     * Downloads chat as .txt file with all messages and timestamps.
     * 
     * @public
     * @returns {void}
     */
    exportChat() {
        const chat = this.chats.find(c => c.id === this.currentChatId);
        if (!chat || chat.messages.length === 0) {
            alert('No messages to export');
            return;
        }

        const chatText = chat.messages.map(msg => {
            const author = msg.role === 'user' ? 'You' : 'Stellar AI';
            const time = new Date(msg.timestamp).toLocaleString();
            return `[${time}] ${author}: ${msg.content}`;
        }).join('\n\n');

        const blob = new Blob([chatText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stellar-ai-${chat.title.replace(/[^a-z0-9]/gi, '-')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Save chat history to localStorage and backend
     * 
     * @private
     * @returns {void}
     */
    saveChatHistory() {
        try {
            localStorage.setItem('stellarAI_chats', JSON.stringify(this.chats));
            localStorage.setItem('stellarAI_currentChatId', this.currentChatId);

            // Also save to backend if user is logged in
            if (this.currentUser) {
                this.saveToBackend();
            }
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }

    /**
     * Load chat history from localStorage
     * 
     * @private
     * @returns {void}
     */
    loadChatHistory() {
        try {
            const saved = localStorage.getItem('stellarAI_chats');
            if (saved) {
                this.chats = JSON.parse(saved);
            }

            const savedChatId = localStorage.getItem('stellarAI_currentChatId');
            if (savedChatId && this.chats.find(c => c.id === savedChatId)) {
                this.currentChatId = savedChatId;
                this.switchToChat(savedChatId);
            }

            this.updateChatHistory();
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }

    /**
     * Load user session from localStorage
     * 
     * @private
     * @returns {void}
     */
    loadUserSession() {
        const user = localStorage.getItem('stellarAI_user');
        if (user) {
            this.currentUser = JSON.parse(user);
            this.updateUserUI();
        }
    }

    /**
     * Load saved model preference from localStorage
     * 
     * @private
     * @returns {void}
     */
    loadModelPreference() {
        const savedModel = localStorage.getItem('stellarAI_selectedModel');
        if (savedModel) {
            this.selectedModel = savedModel;
            const modelSelector = document.getElementById('model-selector');
            if (modelSelector) {
                modelSelector.value = savedModel;
            }

            // If saved model is a live model, prevent Puter.js from loading
            if (savedModel && (savedModel.includes('live') || savedModel.includes('native-audio'))) {
                console.log('Saved model is live - Puter.js disabled');
                window.PUTER_DISABLE_AUTO_LOGIN = true;
                this.puterAvailable = false;
            }
        }
    }

    /**
     * Save model preference to localStorage
     * 
     * @private
     * @returns {void}
     */
    saveModelPreference() {
        localStorage.setItem('stellarAI_selectedModel', this.selectedModel);
    }

    /**
     * Show notification when model is changed
     * 
     * @private
     * @returns {void}
     */
    showModelChangeNotification() {
        // Create temporary notification
        const notification = document.createElement('div');
        notification.className = 'model-change-notification';
        notification.textContent = `Switched to ${this.getModelDisplayName(this.selectedModel)}`;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    /**
     * Get display name for AI model
     * 
     * @private
     * @param {string} model - Model identifier
     * @returns {string} Human-readable model name
     */
    getModelDisplayName(model) {
        const modelNames = {
            'sonnet-4.5': 'Claude Sonnet 4.5',
            'sonnet-4': 'Claude Sonnet 4',
            'opus-4': 'Claude Opus 4',
            'haiku-4': 'Claude Haiku 4',
            'gpt-4o': 'GPT-4o',
            'gpt-4-turbo': 'GPT-4 Turbo',
            'gpt-3.5-turbo': 'GPT-3.5 Turbo',
            'gemini-2.5-flash-native-audio-preview-09-2025': 'Gemini 2.5 Flash Native Audio (Live) 🎤',
            'gemini-2.5-flash-live': 'Gemini 2.5 Flash Live 🎤',
            'gemini-pro': 'Gemini Pro',
            'llama-3.1': 'Llama 3.1',
            'qwen-3-235b-a22b-instruct-2507': 'Cerebras Qwen3 235B (Preview)',
            'fallback': 'Fallback (Demo)'
        };
        return modelNames[model] || model;
    }

    async getCerebrasResponse(chat) {
        const history = (chat && Array.isArray(chat.messages)) ? chat.messages.slice(-10) : [];
        const messages = [{
            role: 'system',
            content: 'You are Stellar AI, a helpful cosmic assistant. Be concise and accurate.'
        }].concat(history.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
        })));

        let lastBackendError = null;
        const backendUrl = (typeof window !== 'undefined')
            ? ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                ? 'http://localhost:3001'
                : (window.STELLAR_AI_BACKEND_URL || null))
            : null;

        if (backendUrl) {
            try {
                const resp = await this.fetchJSON(`${backendUrl.replace(/\/$/, '')}/api/cerebras/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        messages,
                        model: this.cerebrasModel,
                        temperature: 0.7,
                        max_tokens: 600
                    })
                });
                if (resp && resp.choices && resp.choices[0] && resp.choices[0].message) {
                    return resp.choices[0].message.content;
                }
            } catch (error) {
                console.warn('[Stellar AI] Cerebras backend failed, trying direct API...', error.message);
                lastBackendError = error;
            }
        }

        let apiKey = (typeof window !== 'undefined' && window.CEREBRAS_API_KEY) ? window.CEREBRAS_API_KEY : this.cerebrasApiKey;
        if (!apiKey || apiKey === 'YOUR_CEREBRAS_API_KEY_HERE') {
            let entered = null;
            try {
                entered = localStorage.getItem('stellarAI_cerebras_api_key');
            } catch (e) {
                entered = null;
            }

            if (!entered) {
                try {
                    entered = (typeof window !== 'undefined' && typeof window.prompt === 'function')
                        ? window.prompt('Enter Cerebras API key')
                        : null;
                } catch (e) {
                    entered = null;
                }

                if (entered && typeof entered === 'string') {
                    entered = entered.trim();
                }

                if (entered) {
                    try {
                        localStorage.setItem('stellarAI_cerebras_api_key', entered);
                    } catch (e) {
                        // ignore
                    }
                }
            }

            if (entered) {
                apiKey = entered;
                this.cerebrasApiKey = entered;
            }
        }

        if (!apiKey || apiKey === 'YOUR_CEREBRAS_API_KEY_HERE') {
            if (lastBackendError) {
                throw new Error(`Cerebras backend unavailable and API key not configured. Backend error: ${lastBackendError.message}`);
            }
            throw new Error('Cerebras API key not configured. Set window.CEREBRAS_API_KEY or enable the backend proxy.');
        }

        const response = await this.fetchJSON(this.cerebrasEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: this.cerebrasModel,
                messages,
                temperature: 0.7,
                max_tokens: 600
            })
        });

        const data = response;
        const content = data && data.choices && data.choices[0] && data.choices[0].message
            ? data.choices[0].message.content
            : null;

        if (!content) {
            throw new Error('Empty response from Cerebras API');
        }

        return content;
    }

    /**
     * Get response from Gemini 2.5 Flash Live model using WebSocket (bidiGenerateContent)
     * 
     * @method getGeminiLiveResponse
     * @param {Object} chat - Chat object
     * @returns {Promise<string>} AI response text
     */
    async getGeminiLiveResponse(chat, enableStreaming = false) {
        try {
            // Check if backend is available for WebSocket proxy (enables live models)
            const backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:3001'
                : window.STELLAR_AI_BACKEND_URL || null;

            // Get Gemini API key (only needed if backend is not available)
            const apiKey = window.GEMINI_API_KEY || (typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : null);

            // Only require API key if backend is not available (for direct REST API calls)
            if (!backendUrl && (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE')) {
                throw new Error('Gemini API key not configured. Please set your API key in gemini-config.js or ensure the backend server is running.');
            }

            // Prepare conversation history (last 10 messages)
            const lastUserMessage = chat.messages.filter(msg => msg.role === 'user').slice(-1)[0];
            if (!lastUserMessage) {
                throw new Error('No user message found');
            }

            // Build conversation history in the format Gemini expects
            const conversationHistory = chat.messages.slice(-10);
            const contents = [];

            conversationHistory.forEach(msg => {
                contents.push({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                });
            });

            // Ensure we have at least one message
            if (contents.length === 0) {
                throw new Error('No conversation history found');
            }

            // If backend available, try live models via WebSocket; otherwise use standard models
            // ⚠️ IMPORTANT: gemini-2.0-flash-live-preview-04-09 is currently the only working Live API model
            // ⚠️ DEPRECATION: Gemini 2.0 series scheduled for shutdown no earlier than February 2026
            // 💡 RECOMMENDATION: Request access to Gemini 2.5+ models for longer-term support
            const liveModels = backendUrl ? [
                'gemini-2.0-flash-live-preview-04-09',     // ✅ Currently working (deprecated Feb 2026) - TRIED FIRST
                'gemini-2.5-flash-live',                   // ⚠️ May require additional access (deprecated June 2026+)
                'gemini-2.5-flash-native-audio-preview-09-2025', // Latest model (may require additional access)
                'gemini-live-2.5-flash-preview',           // Fallback: Alternative live model name (deprecated Dec 09, 2025)
                'gemini-2.5-flash',                        // Fallback: Standard model (works with streamGenerateContent)
                'gemini-1.5-flash',                        // Fallback: Fast and reliable
                'gemini-1.5-pro'                           // Fallback: More capable
            ] : [
                'gemini-2.5-flash',               // ✅ Primary: Standard model (works with streamGenerateContent)
                'gemini-1.5-flash',               // Fallback: Fast and reliable
                'gemini-1.5-pro'                  // Fallback: More capable
            ];

            let websocketFailed = false;

            console.log('[Stellar AI] Model list (in order):', liveModels);
            console.log('[Stellar AI] Backend URL:', backendUrl);

            for (const modelName of liveModels) {
                try {
                    console.log(`🔍 [${new Date().toISOString()}] Trying model: ${modelName}...`);
                    const responseText = await this.callGeminiLiveWebSocket(modelName, contents, apiKey, enableStreaming);
                    if (responseText && responseText.trim()) {
                        console.log(`✅ Success with model: ${modelName}`);
                        return responseText;
                    }
                } catch (error) {
                    console.error(`❌ Model ${modelName} failed:`, error.message);
                    console.error(`📋 Error type:`, error.constructor.name);
                    console.error(`📋 Full error:`, error);

                    // If WebSocket is not available (404), skip other live models and go straight to REST
                    const errorMsgLower = error.message.toLowerCase();
                    const isWebSocketError = errorMsgLower.includes('websocket') ||
                        errorMsgLower.includes('404') ||
                        errorMsgLower.includes('websocket_not_available') ||
                        errorMsgLower.includes('vertex ai') ||
                        errorMsgLower.includes('endpoint returned') ||
                        errorMsgLower.includes('endpoint not available');

                    if (isWebSocketError) {
                        console.log('⚠️ WebSocket not available for live models. Skipping to REST API fallback...');
                        console.log('🔄 Breaking out of live models loop...');
                        websocketFailed = true;
                        // Skip remaining live models and use REST API directly
                        break;
                    }

                    // Continue to next model for other errors
                    console.log(`⏭️ Continuing to next model...`);
                    continue;
                }
            }

            console.log(`📊 Loop completed. WebSocket failed: ${websocketFailed}`);

            // If all WebSocket attempts failed, try REST API streaming with standard model
            console.log('🔄 Falling back to REST API streaming...');
            console.log('📝 Note: Live models require Vertex AI. Using standard model via REST API.');

            // Get API key from multiple sources
            const finalApiKey = apiKey || window.GEMINI_API_KEY || (typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : null);

            console.log(`🔑 API Key check:`, {
                provided: !!apiKey,
                windowKey: !!window.GEMINI_API_KEY,
                globalKey: typeof GEMINI_API_KEY !== 'undefined',
                finalKey: !!finalApiKey && finalApiKey !== 'YOUR_GEMINI_API_KEY_HERE'
            });

            if (!finalApiKey || finalApiKey === 'YOUR_GEMINI_API_KEY_HERE') {
                console.error('❌ API key not available for REST API fallback');
                throw new Error('API key not available for REST API fallback. Please set GEMINI_API_KEY in gemini-config.js');
            }

            try {
                const restModel = 'gemini-2.5-flash'; // Standard model that works with REST
                console.log(`🌐 Trying REST API streaming with model: ${restModel}...`);
                console.log(`📡 Using endpoint: streamGenerateContent (REST API)`);
                console.log(`📦 Contents to send: ${contents.length} messages`);
                console.log(`🔑 Using API key: ${finalApiKey.substring(0, 10)}...`);

                const responseText = await this.callGeminiLiveWebSocket(restModel, contents, finalApiKey, enableStreaming);
                if (responseText && responseText.trim()) {
                    console.log(`✅ Success with REST API model: ${restModel}`);
                    console.log(`📊 Response length: ${responseText.length} characters`);
                    return responseText;
                } else {
                    console.warn('⚠️ REST API returned empty response');
                }
            } catch (restError) {
                console.error('❌ REST API fallback also failed:', restError.message);
                console.error('🔍 Error details:', restError);

                // Provide helpful error message
                if (restError.message.includes('API key')) {
                    throw new Error('API key issue: ' + restError.message + '. Please check your API key in gemini-config.js or backend/.env');
                } else if (restError.message.includes('network') || restError.message.includes('fetch')) {
                    throw new Error('Network error: ' + restError.message + '. Please check your internet connection.');
                } else {
                    throw new Error('REST API failed: ' + restError.message + '. Please try again or check the console for details.');
                }
            }

            throw new Error('All models failed. Please check your API key, network connection, or try again later.');

        } catch (error) {
            console.error('Error getting Gemini Live response:', error);

            // Fallback to error message
            if (error.message.includes('API key')) {
                const backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? 'http://localhost:3001'
                    : window.STELLAR_AI_BACKEND_URL || null;

                if (!backendUrl) {
                    return '⚠️ Gemini API key not configured. Please set your API key in gemini-config.js to use Gemini 2.5 Flash Live.';
                } else {
                    return '⚠️ Backend server may not be running. Please ensure the backend server is running on port 3001.';
                }
            }

            return `I apologize, but I encountered an error: ${error.message}. Please try again or switch to another model.`;
        }
    }

    /**
     * Call Gemini Live model via backend WebSocket proxy
     * 
     * @method callGeminiLiveViaBackend
     * @param {string} backendWsUrl - Backend WebSocket URL
     * @param {string} modelName - Model name (e.g., 'gemini-2.5-flash-live')
     * @param {Array} contents - Conversation history in Gemini format
     * @returns {Promise<string>} AI response text
     */
    async callGeminiLiveViaBackend(backendWsUrl, modelName, contents, enableStreaming = false) {
        return new Promise((resolve, reject) => {
            console.log('[Stellar AI] Connecting to WebSocket:', backendWsUrl);
            const ws = new WebSocket(backendWsUrl);
            let responseText = '';
            let setupComplete = false;
            let resolved = false; // Flag to prevent double resolution
            let streamingStarted = false;
            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    console.log('[Stellar AI] WebSocket timeout after 60 seconds');
                    console.log('[Stellar AI] Timeout state:', {
                        setupComplete,
                        responseLength: responseText.length,
                        model: modelName
                    });
                    ws.close();
                    reject(new Error('WebSocket timeout'));
                }
            }, 60000); // Increased to 60 seconds for Live API

            ws.onopen = () => {
                console.log('[Stellar AI] WebSocket opened');
                // Send setup message
                const setupMessage = {
                    setup: {
                        model: `models/${modelName}`,
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 8192,
                            responseModalities: ["TEXT"]
                        }
                    }
                };
                ws.send(JSON.stringify(setupMessage));
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('[Stellar AI] Received WebSocket message:', {
                        hasError: !!data.error,
                        hasSetupComplete: !!(data.setupComplete || data.BidiGenerateContentSetupComplete),
                        hasServerContent: !!data.serverContent,
                        hasModelTurn: !!(data.serverContent?.modelTurn),
                        hasParts: !!(data.serverContent?.parts),
                        turnComplete: data.serverContent?.turnComplete,
                        generationComplete: data.serverContent?.generationComplete
                    });

                    // Check for error from backend about WebSocket not being available
                    if (data.error) {
                        clearTimeout(timeout);
                        const errorMsg = data.error.message || 'Gemini API error';
                        const errorCode = data.error.code || '';

                        console.log('[Stellar AI] Received error from backend:', errorMsg, 'Code:', errorCode);

                        // If WebSocket is not available, reject with specific error that triggers REST fallback
                        if (!resolved) {
                            resolved = true;
                            clearTimeout(timeout);
                            if (errorCode === 'WEBSOCKET_NOT_AVAILABLE' ||
                                errorMsg.includes('WebSocket endpoint not available') ||
                                errorMsg.includes('404') ||
                                errorMsg.includes('Live models may require Vertex AI')) {
                                console.log('[Stellar AI] WebSocket not available - will trigger REST fallback');
                                reject(new Error('WEBSOCKET_NOT_AVAILABLE: ' + errorMsg));
                            } else {
                                reject(new Error(errorMsg));
                            }
                            ws.close();
                        }
                        return;
                    }

                    if (data.setupComplete || data.BidiGenerateContentSetupComplete) {
                        setupComplete = true;
                        // Send client content in correct Live API format (turns with turnComplete)
                        // Per API docs: BidiGenerateContentClientContent requires 'turns' array and 'turnComplete' boolean
                        const allParts = contents.flatMap(c => c.parts || []);
                        const allText = allParts
                            .filter(part => part.text)
                            .map(part => part.text)
                            .join(' ');

                        const clientMessage = {
                            clientContent: {
                                turns: [{
                                    role: 'user',
                                    parts: [{ text: allText }]
                                }],
                                turnComplete: true
                            }
                        };
                        console.log('[Stellar AI] Sending client content with turns format');
                        ws.send(JSON.stringify(clientMessage));
                    } else if (data.serverContent) {
                        // Extract text from response (try modelTurn first, then parts)
                        let textFound = false;
                        let chunkText = '';

                        // Check for turnComplete first - it might come without text
                        const isComplete = data.serverContent.turnComplete || data.serverContent.generationComplete;
                        if (isComplete && responseText.trim()) {
                            // We have accumulated text and turnComplete - handle it below
                            console.log('[Stellar AI] Turn complete detected with accumulated text');
                        }

                        if (data.serverContent.modelTurn?.parts) {
                            console.log('[Stellar AI] Processing modelTurn.parts:', {
                                partsCount: data.serverContent.modelTurn.parts.length,
                                parts: data.serverContent.modelTurn.parts.map(p => ({ hasText: !!p.text, textLength: p.text?.length || 0 }))
                            });
                            data.serverContent.modelTurn.parts.forEach(part => {
                                if (part.text) {
                                    chunkText += part.text;
                                    responseText += part.text;
                                    textFound = true;
                                }
                            });
                        } else if (data.serverContent.parts) {
                            console.log('[Stellar AI] Processing serverContent.parts:', {
                                partsCount: data.serverContent.parts.length,
                                parts: data.serverContent.parts.map(p => ({ hasText: !!p.text, textLength: p.text?.length || 0 }))
                            });
                            data.serverContent.parts.forEach(part => {
                                if (part.text) {
                                    chunkText += part.text;
                                    responseText += part.text;
                                    textFound = true;
                                }
                            });
                        }

                        // If turnComplete is true but no text in this message, check accumulated text
                        if (isComplete && !textFound && responseText.trim()) {
                            console.log('[Stellar AI] Turn complete message without text - using accumulated responseText');
                            // Will be handled by the turnComplete check below
                        }

                        if (textFound) {
                            console.log('[Stellar AI] Received text chunk:', {
                                chunkLength: chunkText.length,
                                totalLength: responseText.length,
                                preview: chunkText.substring(0, 50) + '...'
                            });

                            // Update UI in real-time if streaming is enabled
                            if (enableStreaming && chunkText) {
                                if (!streamingStarted) {
                                    // Start streaming message display
                                    const initialMessage = {
                                        role: 'assistant',
                                        content: chunkText,
                                        timestamp: new Date().toISOString()
                                    };
                                    this.startStreamingMessage(initialMessage);
                                    streamingStarted = true;
                                } else {
                                    // Update existing streaming message
                                    this.updateStreamingMessage(chunkText);
                                }
                            }
                        } else {
                            console.log('[Stellar AI] No text found in serverContent:', {
                                hasModelTurn: !!data.serverContent.modelTurn,
                                hasParts: !!data.serverContent.parts,
                                turnComplete: data.serverContent.turnComplete,
                                generationComplete: data.serverContent.generationComplete
                            });
                        }

                        // Check for turn completion (per API docs: turnComplete indicates model is done)
                        // Also check generationComplete as a fallback
                        // IMPORTANT: turnComplete can arrive in a message without text - use accumulated responseText
                        const isTurnComplete = data.serverContent?.turnComplete || data.serverContent?.generationComplete || data.turnComplete;
                        if (isTurnComplete && !resolved) {
                            console.log('[Stellar AI] Turn/generation complete detected. Response text length:', responseText.length);
                            console.log('[Stellar AI] Completion message details:', {
                                hasServerContent: !!data.serverContent,
                                hasModelTurn: !!data.serverContent?.modelTurn,
                                hasParts: !!data.serverContent?.parts,
                                turnComplete: data.serverContent?.turnComplete,
                                generationComplete: data.serverContent?.generationComplete,
                                accumulatedTextLength: responseText.length
                            });

                            resolved = true;
                            clearTimeout(timeout);

                            // Use accumulated responseText even if this message has no text
                            const finalResponse = responseText.trim();

                            if (finalResponse) {
                                // Finalize streaming if it was enabled
                                if (enableStreaming && streamingStarted && this.streamingMessageElement) {
                                    const finalMessage = {
                                        role: 'assistant',
                                        content: finalResponse,
                                        timestamp: new Date().toISOString()
                                    };
                                    this.finalizeStreamingMessage(finalMessage);
                                } else if (!streamingStarted) {
                                    // If streaming never started but we have a response, display it now
                                    console.log('[Stellar AI] ✅ Displaying accumulated response (length:', finalResponse.length, ')');
                                    const aiMessage = {
                                        role: 'assistant',
                                        content: finalResponse,
                                        timestamp: new Date().toISOString()
                                    };
                                    this.appendMessage(aiMessage);
                                }

                                // Close WebSocket after a short delay to ensure all messages are processed
                                setTimeout(() => {
                                    ws.close();
                                }, 100);

                                resolve(finalResponse);
                            } else {
                                console.warn('[Stellar AI] ⚠️ Turn complete but no response text accumulated');
                                // Even if no text, resolve to prevent hanging
                                setTimeout(() => {
                                    ws.close();
                                }, 100);
                                reject(new Error('Turn complete but no response received'));
                            }
                            return;
                        }
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            ws.onerror = (error) => {
                console.error('[Stellar AI] WebSocket error:', error);
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    reject(new Error(`WebSocket connection failed: ${error.message || 'Unknown error'}`));
                }
            };

            ws.onclose = (event) => {
                clearTimeout(timeout);
                console.log('[Stellar AI] WebSocket closed. Code:', event.code, 'Reason:', event.reason);
                console.log('[Stellar AI] Setup complete:', setupComplete, 'Response text length:', responseText.length, 'Resolved:', resolved);

                if (resolved) {
                    console.log('[Stellar AI] Already resolved, ignoring close event');
                    return;
                }

                // Code 1000 = Normal closure (successful completion)
                // If we have response text and it's a normal closure, resolve successfully
                if (responseText && responseText.trim() && (event.code === 1000 || event.code === 1001)) {
                    console.log('[Stellar AI] ✅ Normal closure with response text, resolving');
                    resolved = true;

                    // Display response if not already displayed
                    if (!streamingStarted && responseText.trim()) {
                        const aiMessage = {
                            role: 'assistant',
                            content: responseText.trim(),
                            timestamp: new Date().toISOString()
                        };
                        this.appendMessage(aiMessage);
                    }

                    resolve(responseText.trim());
                } else if (responseText && responseText.trim()) {
                    // Even if not normal closure, if we have text, use it
                    console.log('[Stellar AI] ✅ Resolving with response text (non-normal closure)');
                    resolved = true;

                    if (!streamingStarted && responseText.trim()) {
                        const aiMessage = {
                            role: 'assistant',
                            content: responseText.trim(),
                            timestamp: new Date().toISOString()
                        };
                        this.appendMessage(aiMessage);
                    }

                    resolve(responseText.trim());
                } else if (!setupComplete) {
                    // Check if we got an error message from backend about WebSocket not being available
                    // Code 1006 = Abnormal closure (usually means connection failed)
                    // Code 1008 = Policy violation
                    resolved = true;
                    if (event.code === 1006 || event.code === 1008) {
                        console.log('[Stellar AI] WebSocket closed abnormally (404 likely) - triggering REST fallback');
                        reject(new Error('WEBSOCKET_NOT_AVAILABLE: WebSocket endpoint requires Vertex AI. Use REST API fallback.'));
                    } else {
                        console.log('[Stellar AI] WebSocket closed before setup - code:', event.code);
                        reject(new Error('Connection closed before setup'));
                    }
                } else {
                    resolved = true;
                    console.log('[Stellar AI] WebSocket closed after setup but no response received');
                    reject(new Error('No response received'));
                }
            };
        });
    }

    /**
     * Call Gemini Live model via WebSocket (bidiGenerateContent)
     * 
     * @method callGeminiLiveWebSocket
     * @param {string} modelName - Model name (e.g., 'gemini-1.5-flash')
     * @param {Array} contents - Conversation history in Gemini format
     * @param {string} apiKey - Gemini API key
     * @returns {Promise<string>} AI response text
     */
    async callGeminiLiveWebSocket(modelName, contents, apiKey, enableStreaming = false) {
        // Check if backend is available for WebSocket proxy
        const backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:3001'
            : window.STELLAR_AI_BACKEND_URL || null;

        let apiToken = window.STELLAR_AI_API_TOKEN || window.API_TOKEN || null;
        if (!apiToken) {
            try {
                apiToken = localStorage.getItem('stellarAiApiToken') || localStorage.getItem('puterAuthToken') || null;
            } catch (_e) {
                apiToken = null;
            }
        }

        const wsScheme = backendUrl && backendUrl.startsWith('https://') ? 'wss://' : 'ws://';
        let backendWsUrl = backendUrl
            ? `${wsScheme}${backendUrl.replace(/^https?:\/\//, '')}/api/gemini-live`
            : null;

        if (backendWsUrl && apiToken) {
            backendWsUrl += `?token=${encodeURIComponent(String(apiToken).trim())}`;
        }

        console.log('[Stellar AI] WebSocket URL:', backendWsUrl);
        console.log('[Stellar AI] Backend URL:', backendUrl);
        console.log('[Stellar AI] Model:', modelName);

        // If backend is available, use WebSocket proxy for live models (no API key needed)
        if (backendWsUrl && modelName.includes('live')) {
            console.log('[Stellar AI] Using backend WebSocket proxy (API key handled by backend)');
            return this.callGeminiLiveViaBackend(backendWsUrl, modelName, contents, enableStreaming);
        }

        // Fallback: Use REST streaming with standard model (live models don't support REST)
        // API key is required for direct REST API calls
        // Try to get API key from multiple sources
        const finalApiKey = apiKey || window.GEMINI_API_KEY || (typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : null);

        console.log('[Stellar AI] API Key check:', {
            provided: !!apiKey,
            windowKey: !!window.GEMINI_API_KEY,
            globalKey: typeof GEMINI_API_KEY !== 'undefined',
            finalKey: !!finalApiKey && finalApiKey !== 'YOUR_GEMINI_API_KEY_HERE'
        });

        if (!finalApiKey || finalApiKey === 'YOUR_GEMINI_API_KEY_HERE') {
            console.warn('⚠️ API key not found in frontend. REST API fallback may not work.');
            console.warn('💡 Set GEMINI_API_KEY in gemini-config.js for direct REST API calls.');
            throw new Error('API key required for direct REST API calls. Please set your API key in gemini-config.js or ensure the backend server is running.');
        }

        console.log('[Stellar AI] Using API key for REST API fallback');

        return new Promise(async (resolve, reject) => {
            // Map model names to valid API identifiers
            let actualModel = modelName;
            if (modelName.includes('live') || modelName.includes('native-audio')) {
                actualModel = 'gemini-2.0-flash-exp'; // Use experimental model for best results
            } else if (modelName === 'gemini-1.5-pro') {
                actualModel = 'gemini-1.5-pro-latest';
            } else if (modelName === 'gemini-1.5-flash') {
                actualModel = 'gemini-1.5-flash-latest';
            } else if (modelName === 'gemini-pro') {
                actualModel = 'gemini-pro';
            } else {
                // Default fallback
                actualModel = 'gemini-1.5-flash';
            }

            const finalApiKey = apiKey || window.GEMINI_API_KEY || (typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : null);
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:streamGenerateContent?key=${finalApiKey}`;

            console.log('[Stellar AI] Calling REST API:', apiUrl.replace(/\?key=.*$/, '?key=***'));
            console.log('[Stellar AI] Model:', actualModel);

            let responseText = '';
            const hasError = false;

            // Prepare request payload with conversation history
            const requestPayload = {
                contents: contents,  // Full conversation history
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 8192,
                    topP: 0.95,
                    topK: 40
                }
            };

            console.log('[Stellar AI] Starting REST API fetch request...');
            console.log('[Stellar AI] Request URL:', apiUrl.replace(/\?key=.*$/, '?key=***'));
            console.log('[Stellar AI] Request payload size:', JSON.stringify(requestPayload).length, 'bytes');

            try {
                const data = await this.fetchJSON(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestPayload)
                });

                console.log('[Stellar AI] ✅ REST API response OK');

                if (data && data.candidates && data.candidates[0]) {
                    const candidate = data.candidates[0];
                    if (candidate.content && candidate.content.parts) {
                        candidate.content.parts.forEach(part => {
                            if (part.text) {
                                responseText += part.text;
                            }
                        });
                    }
                }

                if (responseText) {
                    resolve(responseText.trim());
                } else {
                    reject(new Error('Empty response from Gemini API'));
                }
            } catch (error) {
                console.error('Gemini API request failed:', error);
                reject(new Error(`Gemini API request failed: ${error.message}`));
            }
        });
    }

    /**
     * Update UI elements based on user session
     * 
     * @private
     * @returns {void}
     */
    updateUserUI() {
        if (this.currentUser) {
            const userName = document.querySelector('.user-name');
            const userAvatar = document.querySelector('.user-avatar');
            if (userName) userName.textContent = this.currentUser.name;
            if (userAvatar) userAvatar.textContent = this.currentUser.name.charAt(0).toUpperCase();
            const loginBtn = document.getElementById('login-btn');
            if (loginBtn) {
                loginBtn.textContent = 'Logout';
                loginBtn.onclick = () => this.logout();
            }
        }
    }

    /**
     * Show login modal
     * 
     * @public
     * @returns {void}
     */
    showLoginModal() {
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            loginModal.classList.add('show');
        }
    }

    /**
     * Logout current user
     * 
     * Clears user session and reloads page.
     * 
     * @public
     * @returns {void}
     */
    logout() {
        if (confirm('Logout? Your chat history will be cleared from this device.')) {
            localStorage.removeItem('stellarAI_user');
            this.currentUser = null;
            location.reload();
        }
    }

    /**
     * Save chat history to backend API
     * 
     * Placeholder for backend integration.
     * Will be implemented when backend API is available.
     * 
     * @private
     * @async
     * @returns {Promise<void>}
     */
    async saveToBackend() {
        // Placeholder for backend integration
        // Will be implemented in backend API
        console.log('Saving to backend...');
    }

    /**
     * Download Stellar AI CLI package
     * 
     * Attempts to download from backend if available, otherwise
     * uses GitLab Pages direct download. Shows setup instructions.
     * 
     * @public
     * @async
     * @returns {Promise<void>}
     */
    async downloadCLI() {
        const btn = document.getElementById('download-cli-btn');
        const originalText = btn.innerHTML;

        // Show loading state
        btn.disabled = true;
        btn.innerHTML = '<span>⏳</span> Preparing download...';

        try {
            // Try backend endpoint first (if available)
            const backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:3001'
                : '';

            let downloadUrl = '';
            let useBackend = false;

            if (backendUrl) {
                // Test if backend is available
                try {
                    const testResponse = await this.fetchJSON(`${backendUrl}/health`, { method: 'GET' });
                    if (testResponse) {
                        downloadUrl = `${backendUrl}/api/cli/download`;
                        useBackend = true;
                    }
                } catch (_e) {
                    console.log('Backend not available, using GitLab direct download');
                }
            }

            if (!useBackend) {
                // Use pre-packaged zip file from GitLab Pages
                // This zip contains only the stellar-ai-cli folder
                const baseUrl = window.location.origin;
                downloadUrl = `${baseUrl}/stellar-ai-cli.zip`;
            }

            // Create download link
            const link = document.createElement('a');
            link.download = 'stellar-ai-cli.zip';
            link.target = '_blank';
            link.style.display = 'none';

            let objectUrl = null;
            if (useBackend) {
                try {
                    let apiToken = window.STELLAR_AI_API_TOKEN || window.API_TOKEN || null;
                    if (!apiToken) {
                        try {
                            apiToken = localStorage.getItem('stellarAiApiToken') || localStorage.getItem('puterAuthToken') || null;
                        } catch (_e) {
                            apiToken = null;
                        }
                    }

                    const headers = {};
                    if (apiToken) {
                        headers['Authorization'] = `Bearer ${apiToken}`;
                    }

                    const downloadResponse = await fetch(downloadUrl, { headers });
                    if (!downloadResponse.ok) {
                        throw new Error(`Backend download failed: ${downloadResponse.status} ${downloadResponse.statusText}`);
                    }

                    const blob = await downloadResponse.blob();
                    objectUrl = URL.createObjectURL(blob);
                    link.href = objectUrl;
                } catch (_e) {
                    link.href = downloadUrl;
                }
            } else {
                link.href = downloadUrl;
            }

            document.body.appendChild(link);

            // Trigger download
            link.click();

            if (objectUrl) {
                setTimeout(() => {
                    try {
                        URL.revokeObjectURL(objectUrl);
                    } catch (_e) { }
                }, 60000);
            }

            // Show detailed instructions
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = originalText;
                this.showDownloadInstructions(useBackend);
            }, 1000);

            // Clean up
            setTimeout(() => {
                if (document.body.contains(link)) {
                    document.body.removeChild(link);
                }
            }, 3000);

        } catch (error) {
            console.error('Download error:', error);
            btn.disabled = false;
            btn.innerHTML = originalText;
            alert('❌ Download failed. Please visit the GitLab repository to download manually:\n\nhttps://gitlab.com/adybag14-group/starisdons');
        }
    }

    /**
     * Show download and setup instructions modal
     * 
     * @private
     * @param {boolean} useBackend - Whether download came from backend
     * @returns {void}
     */
    showDownloadInstructions(useBackend) {
        // Create modal for instructions
        const modal = document.createElement('div');
        modal.id = 'download-instructions-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;

        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, rgba(10, 10, 15, 0.95), rgba(20, 20, 30, 0.95));
                border: 2px solid rgba(186, 148, 79, 0.5);
                border-radius: 20px;
                padding: 3rem;
                max-width: 700px;
                max-height: 90vh;
                overflow-y: auto;
                position: relative;
            ">
                <button onclick="this.closest('#download-instructions-modal').remove()" style="
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: transparent;
                    border: 2px solid rgba(186, 148, 79, 0.5);
                    color: #ba944f;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 1.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">&times;</button>
                
                <h2 style="color: #ba944f; margin-bottom: 1.5rem; font-size: 2rem;">📥 Download & Setup Instructions</h2>
                
                ${useBackend ? `
                    <div style="background: rgba(74, 222, 128, 0.1); border: 1px solid rgba(74, 222, 128, 0.3); padding: 1rem; border-radius: 10px; margin-bottom: 1.5rem;">
                        <p style="color: #4ade80; margin: 0;">✅ Download started! You're downloading only the Stellar AI CLI package - ready to use!</p>
                    </div>
                ` : `
                    <div style="background: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.3); padding: 1rem; border-radius: 10px; margin-bottom: 1.5rem;">
                        <p style="color: #ffc107; margin: 0;">⚠️ You're downloading the full repository. After extraction, navigate to the <code>stellar-ai-cli</code> folder.</p>
                    </div>
                `}
                
                <div style="background: rgba(74, 222, 128, 0.1); border: 1px solid rgba(74, 222, 128, 0.3); padding: 1rem; border-radius: 10px; margin-bottom: 1.5rem;">
                    <p style="color: #4ade80; margin: 0; font-weight: 600;">✨ All-in-One Package!</p>
                    <p style="color: rgba(255, 255, 255, 0.8); margin: 0.5rem 0 0 0; font-size: 0.9rem;">
                        This package includes automatic setup scripts. No manual configuration needed!
                    </p>
                </div>
                
                <h3 style="color: #ba944f; margin-top: 2rem; margin-bottom: 1rem;">Step 1: Extract the ZIP File</h3>
                <p style="color: rgba(255, 255, 255, 0.8); margin-bottom: 1.5rem; line-height: 1.6;">
                    ${useBackend ?
                'Extract the downloaded ZIP file to a location of your choice. You\'ll see a folder named <code style="background: rgba(186, 148, 79, 0.2); padding: 2px 6px; border-radius: 3px;">stellar-ai-cli</code> - this is the complete CLI package, ready to use!' :
                'Extract the downloaded ZIP file to a location of your choice. You\'ll see a folder named <code style="background: rgba(186, 148, 79, 0.2); padding: 2px 6px; border-radius: 3px;">stellar-ai-cli</code> or <code style="background: rgba(186, 148, 79, 0.2); padding: 2px 6px; border-radius: 3px;">new-starsiadr-main</code>. Navigate to the <code>stellar-ai-cli</code> folder inside.'
            }
                </p>
                
                <h3 style="color: #ba944f; margin-top: 2rem; margin-bottom: 1rem;">Step 2: Automatic Setup (Recommended)</h3>
                <p style="color: rgba(255, 255, 255, 0.8); margin-bottom: 1rem; line-height: 1.6;">
                    <strong>Windows:</strong> Double-click <code style="background: rgba(186, 148, 79, 0.2); padding: 2px 6px; border-radius: 3px;">setup.bat</code>
                </p>
                <p style="color: rgba(255, 255, 255, 0.8); margin-bottom: 1rem; line-height: 1.6;">
                    <strong>Linux/Mac:</strong> Open terminal and run:
                </p>
                <div style="background: rgba(0, 0, 0, 0.5); padding: 1rem; border-radius: 10px; margin-bottom: 1.5rem; font-family: 'Courier New', monospace;">
                    <code style="color: #4ade80;">chmod +x setup.sh</code><br>
                    <code style="color: #4ade80;">./setup.sh</code>
                </div>
                <p style="color: rgba(255, 255, 255, 0.6); font-size: 0.9rem; margin-bottom: 1.5rem;">
                    The setup script will automatically check for Node.js, install all dependencies, and configure everything for you!
                </p>
                
                <h3 style="color: #ba944f; margin-top: 2rem; margin-bottom: 1rem;">Step 3: Start Stellar AI CLI</h3>
                <p style="color: rgba(255, 255, 255, 0.8); margin-bottom: 1rem; line-height: 1.6;">
                    <strong>Windows:</strong> Double-click <code style="background: rgba(186, 148, 79, 0.2); padding: 2px 6px; border-radius: 3px;">start.bat</code>
                </p>
                <p style="color: rgba(255, 255, 255, 0.8); margin-bottom: 1rem; line-height: 1.6;">
                    <strong>Linux/Mac:</strong> Run:
                </p>
                <div style="background: rgba(0, 0, 0, 0.5); padding: 1rem; border-radius: 10px; margin-bottom: 1.5rem; font-family: 'Courier New', monospace;">
                    <code style="color: #4ade80;">./start.sh</code>
                </div>
                <p style="color: rgba(255, 255, 255, 0.6); font-size: 0.9rem; margin-bottom: 1.5rem;">
                    Or manually: <code style="background: rgba(186, 148, 79, 0.2); padding: 2px 6px; border-radius: 3px;">node index.js</code>
                </p>
                
                <h3 style="color: #ba944f; margin-top: 2rem; margin-bottom: 1rem;">Step 5: Authenticate with Puter.js (Optional)</h3>
                <p style="color: rgba(255, 255, 255, 0.8); margin-bottom: 1rem; line-height: 1.6;">
                    If you want to use Puter.js features, run:
                </p>
                <div style="background: rgba(0, 0, 0, 0.5); padding: 1rem; border-radius: 10px; margin-bottom: 1.5rem; font-family: 'Courier New', monospace;">
                    <code style="color: #4ade80;">/login</code>
                </div>
                <p style="color: rgba(255, 255, 255, 0.6); font-size: 0.9rem; margin-bottom: 1.5rem;">
                    This will open a browser window for Puter.js authentication.
                </p>
                
                <h3 style="color: #ba944f; margin-top: 2rem; margin-bottom: 1rem;">Available Commands</h3>
                <div style="background: rgba(0, 0, 0, 0.5); padding: 1rem; border-radius: 10px; margin-bottom: 1.5rem; font-family: 'Courier New', monospace; font-size: 0.9rem;">
                    <code style="color: #4ade80;">/help</code> - Show all commands<br>
                    <code style="color: #4ade80;">/model [name]</code> - Change AI model<br>
                    <code style="color: #4ade80;">/login</code> - Authenticate with Puter.js<br>
                    <code style="color: #4ade80;">/logout</code> - Sign out from Puter.js<br>
                    <code style="color: #4ade80;">/agent add [name] [model]</code> - Add multi-agent<br>
                    <code style="color: #4ade80;">/clear</code> - Clear chat history
                </div>
                
                <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(186, 148, 79, 0.3);">
                    <p style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; margin-bottom: 1rem;">
                        Need help? Visit the repository:
                    </p>
                    <a href="https://gitlab.com/adybag14-group/starisdons" target="_blank" style="
                        display: inline-block;
                        padding: 0.75rem 1.5rem;
                        background: rgba(186, 148, 79, 0.2);
                        border: 2px solid rgba(186, 148, 79, 0.5);
                        border-radius: 10px;
                        color: #ba944f;
                        text-decoration: none;
                        font-weight: 600;
                    ">📦 View Repository</a>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * Check for Puter.js authentication token
     * 
     * Checks localStorage and Puter.js auth state.
     * Updates token input if found.
     * 
     * @private
     * @returns {void}
     */
    checkPuterToken() {
        // Skip Puter.js checks if using live models - they don't need Puter.js
        const tokenSection = document.getElementById('puter-token-section');
        const tokenInput = document.getElementById('puter-token-input');

        if (tokenSection) {
            tokenSection.style.display = 'none';
        }

        if (tokenInput) {
            tokenInput.value = '';
        }

        window.PUTER_DISABLE_AUTO_LOGIN = true;
        this.puterAvailable = false;

        if (!tokenSection || !tokenInput) return;

        // Check localStorage first
        const savedToken = localStorage.getItem('puterAuthToken');
        if (savedToken) {
            tokenInput.value = savedToken;
            tokenSection.style.display = 'block';
            return;
        }

        // Check if Puter.js is available and authenticated - only check 3 times
        // IMPORTANT: Don't trigger login popup - only check if already authenticated
        if (typeof puter !== 'undefined' && puter.auth) {
            let attempts = 0;
            const maxAttempts = 3;

            const checkAuth = setInterval(() => {
                attempts++;
                try {
                    // Only check if already signed in - don't trigger login popup
                    // Check isSignedIn property first to avoid triggering login
                    const isSignedIn = puter.auth.isSignedIn &&
                        typeof puter.auth.isSignedIn === 'function' &&
                        puter.auth.isSignedIn();

                    if (isSignedIn) {
                        if (puter.auth.getToken) {
                            const token = puter.auth.getToken();
                            if (token) {
                                tokenInput.value = token;
                                tokenSection.style.display = 'block';
                                localStorage.setItem('puterAuthToken', token);
                                clearInterval(checkAuth);
                                return;
                            }
                        }
                    }

                    // Also try accessing Puter's internal storage
                    if (typeof puter.storage !== 'undefined' && puter.storage.get) {
                        try {
                            puter.storage.get('auth_token').then(token => {
                                if (token) {
                                    tokenInput.value = token;
                                    tokenSection.style.display = 'block';
                                    localStorage.setItem('puterAuthToken', token);
                                    clearInterval(checkAuth);
                                }
                            }).catch(() => { });
                        } catch (_e) {
                            // Intentionally empty - non-critical error in Puter auth check
                        }
                    }
                } catch (_e) {
                    // Ignore errors
                }

                // Stop after 3 attempts
                if (attempts >= maxAttempts) {
                    clearInterval(checkAuth);
                }
            }, 2000);
        }
    }
}

// Global functions (exposed for HTML onclick handlers)
window.usePrompt = function (prompt) {
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.value = prompt;
        messageInput.focus();
    }
};

window.hideLoginModal = function () {
    const loginModal = document.getElementById('login-modal');
    if (loginModal) {
        loginModal.classList.remove('show');
    }
};

// Make hideLoginModal globally accessible
if (typeof window !== 'undefined') {
    window.hideLoginModal = window.hideLoginModal || function () {
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            loginModal.classList.remove('show');
        }
    };
}

window.handleLogin = function (event) {
    event.preventDefault();
    const form = event.target;
    const emailInput = form.querySelector('input[type="email"]');
    const email = emailInput ? emailInput.value : '';

    // Simulated login
    const user = {
        name: email.split('@')[0],
        email: email
    };

    localStorage.setItem('stellarAI_user', JSON.stringify(user));
    stellarAI.currentUser = user;
    stellarAI.updateUserUI();

    // Call hideLoginModal - it's now guaranteed to exist
    if (typeof window.hideLoginModal === 'function') {
        window.hideLoginModal();
    }

    alert('Login successful! Your chats will now be saved.');
}

// Initialize Stellar AI
let stellarAI;

// Initialize when DOM is ready
function initStellarAI() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (!stellarAI) {
                stellarAI = new StellarAI();
            }
        });
    } else {
        // DOM already loaded
        if (!stellarAI) {
            stellarAI = new StellarAI();
        }
    }
}

// Also listen for load event as fallback
window.addEventListener('load', () => {
    if (!stellarAI) {
        stellarAI = new StellarAI();
    }
});

// Call initialization
initStellarAI();

// Start initialization
initStellarAI();


