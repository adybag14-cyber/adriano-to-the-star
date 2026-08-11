/**
 * LiveKit Chat Integration for Stellar AI
 * 
 * Dedicated chat interface for LiveKit voice agent conversations
 * 
 * @class LiveKitChat
 * @author Adriano To The Star
 * @version 1.0.0
 */

class LiveKitChat {
    constructor() {
        this.livekitIntegration = null;
        this.isConnected = false;
        this.isMuted = false;
        this.messages = [];
        this.currentModel = 'gemini-2.5-flash-native-audio-preview-09-2025';
        this.transcripts = [];
        
        this.init();
    }

    /**
     * Initialize LiveKit chat
     */
    init() {
        this.trackEvent('l_iv_ek_it_ch_at_initialized');
        console.log('Checking for LiveKit SDK...');
        console.log('  typeof LiveKit:', typeof LiveKit);
        console.log('  typeof LiveKitVoiceIntegration:', typeof LiveKitVoiceIntegration);
        console.log('  window.LIVEKIT_SDK_LOADED:', window.LIVEKIT_SDK_LOADED);
        console.log('  window.LIVEKIT_SDK_READY:', window.LIVEKIT_SDK_READY);
        
        // Wait for required scripts to load
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds (increased timeout)
        
        const checkScripts = setInterval(() => {
            attempts++;
            
            // Check for LiveKit SDK - it might be exposed as different globals
            // Note: The SDK exposes as LivekitClient (lowercase 'k'), not LiveKit
            // Priority: Check LIVEKIT_SDK_READY flag first (it's in the globals list), then property existence
            // Direct property access - don't rely on typeof for objects
            const hasSDKReadyFlag = window.LIVEKIT_SDK_READY === true || 
                                   window.LIVEKIT_SDK_READY === 'true' || 
                                   (window.LIVEKIT_SDK_READY !== undefined && window.LIVEKIT_SDK_READY !== false && window.LIVEKIT_SDK_READY !== null);
            
            // Check if LivekitClient exists as a property (even if typeof is undefined)
            const hasLivekitClientProp = 'LivekitClient' in window;
            const livekitClientValue = hasLivekitClientProp ? window.LivekitClient : null;
            const hasLivekitClient = hasLivekitClientProp && livekitClientValue != null;
            const hasLivekitClientRoom = livekitClientValue && typeof livekitClientValue === 'object' && livekitClientValue.Room;
            
            const livekitReady = hasSDKReadyFlag ||
                                 hasLivekitClient ||
                                 hasLivekitClientRoom ||
                                 typeof LiveKit !== 'undefined' || 
                                 typeof window.LiveKit !== 'undefined' ||
                                 typeof LivekitClient !== 'undefined' ||
                                 typeof window.LivekitClient !== 'undefined' ||
                                 (window.livekit && window.livekit.Room);
            
            // Check for LiveKitVoiceIntegration class
            const integrationReady = typeof LiveKitVoiceIntegration !== 'undefined' ||
                                     typeof window.LiveKitVoiceIntegration !== 'undefined';
            
            if (attempts % 10 === 0 || attempts === 1) {
                console.log(`[Attempt ${attempts}/${maxAttempts}] LiveKit: ${livekitReady}, Integration: ${integrationReady}`);
                console.log('  hasSDKReadyFlag:', hasSDKReadyFlag, '(window.LIVEKIT_SDK_READY:', window.LIVEKIT_SDK_READY, ', type:', typeof window.LIVEKIT_SDK_READY, ')');
                console.log('  hasLivekitClientProp:', hasLivekitClientProp, '("LivekitClient" in window)');
                console.log('  livekitClientValue:', livekitClientValue, '(type:', typeof livekitClientValue, ')');
                console.log('  hasLivekitClient:', hasLivekitClient);
                console.log('  hasLivekitClientRoom:', hasLivekitClientRoom);
                console.log('  typeof LiveKit:', typeof LiveKit);
                console.log('  typeof window.LiveKit:', typeof window.LiveKit);
                console.log('  typeof LivekitClient:', typeof LivekitClient);
                console.log('  typeof window.LivekitClient:', typeof window.LivekitClient);
                console.log('  typeof LiveKitVoiceIntegration:', typeof LiveKitVoiceIntegration);
            }
            
            if (livekitReady && integrationReady) {
                clearInterval(checkScripts);
                console.log('✅ Both LiveKit SDK and Integration ready!');
                if (hasSDKReadyFlag) {
                    console.log('  ✓ Detected via LIVEKIT_SDK_READY flag');
                }
                if (hasLivekitClient) {
                    console.log('  ✓ Detected via LivekitClient property');
                }
                this.initializeIntegration().catch(error => {
                    console.error('❌ Error in initializeIntegration:', error);
                    this.showStatus('error', `Initialization error: ${error.message}`);
                });
                return;
            }
            
            // Check if we've exceeded max attempts
            if (attempts >= maxAttempts) {
                clearInterval(checkScripts);
                console.error('❌ Timeout waiting for scripts to load');
                console.error('Final check:');
                console.error('  window.LIVEKIT_SDK_READY:', window.LIVEKIT_SDK_READY);
                console.error('  typeof LiveKit:', typeof LiveKit);
                console.error('  typeof window.LiveKit:', typeof window.LiveKit);
                console.error('  typeof LivekitClient:', typeof LivekitClient);
                console.error('  typeof window.LivekitClient:', typeof window.LivekitClient);
                console.error('  "LivekitClient" in window:', 'LivekitClient' in window);
                console.error('  window.LivekitClient exists:', !!window.LivekitClient);
                console.error('  window.LivekitClient type:', window.LivekitClient ? typeof window.LivekitClient : 'null/undefined');
                console.error('  window.LivekitClient.Room:', window.LivekitClient ? typeof window.LivekitClient.Room : 'N/A');
                console.error('  typeof LiveKitVoiceIntegration:', typeof LiveKitVoiceIntegration);
                console.error('  window.livekit:', window.livekit);
                console.error('  Available globals with "livekit":', Object.keys(window).filter(k => k.toLowerCase().includes('livekit')));
                if (window.LivekitClient) {
                    console.error('  window.LivekitClient keys:', Object.keys(window.LivekitClient).slice(0, 10));
                }
                
                // Final check: Use same explicit detection as above
                const finalHasSDKReadyFlag = window.LIVEKIT_SDK_READY === true || 
                                            window.LIVEKIT_SDK_READY === 'true' || 
                                            (window.LIVEKIT_SDK_READY !== undefined && window.LIVEKIT_SDK_READY !== false && window.LIVEKIT_SDK_READY !== null);
                const finalHasLivekitClientProp = 'LivekitClient' in window;
                const finalLivekitClientValue = finalHasLivekitClientProp ? window.LivekitClient : null;
                const finalHasLivekitClient = finalHasLivekitClientProp && finalLivekitClientValue != null;
                const finalHasLivekitClientRoom = finalLivekitClientValue && typeof finalLivekitClientValue === 'object' && finalLivekitClientValue.Room;
                
                const finalSDKCheck = finalHasSDKReadyFlag || 
                                     finalHasLivekitClient ||
                                     finalHasLivekitClientRoom ||
                                     livekitReady;
                
                console.error('Final SDK Check Results:');
                console.error('  finalHasSDKReadyFlag:', finalHasSDKReadyFlag, '(value:', window.LIVEKIT_SDK_READY, ')');
                console.error('  finalHasLivekitClientProp:', finalHasLivekitClientProp);
                console.error('  finalLivekitClientValue:', finalLivekitClientValue, '(type:', typeof finalLivekitClientValue, ')');
                console.error('  finalHasLivekitClient:', finalHasLivekitClient);
                console.error('  finalHasLivekitClientRoom:', finalHasLivekitClientRoom);
                console.error('  finalSDKCheck:', finalSDKCheck);
                
                if (!finalSDKCheck && !livekitReady) {
                    console.error('LiveKit SDK not loaded');
                    this.showStatus('error', 'LiveKit SDK not loaded. Check browser console for details.');
                } else if (!integrationReady) {
                    console.error('LiveKitVoiceIntegration not found');
                    this.showStatus('error', 'LiveKit integration script not loaded. Check if livekit-voice-integration.js is included.');
                } else {
                    // SDK is available, proceed with initialization
                    console.log('⚠️ SDK detected via fallback check, proceeding with initialization...');
                    console.log('  Detection method:', 
                        finalHasSDKReadyFlag ? 'LIVEKIT_SDK_READY flag' :
                        finalHasLivekitClient ? 'LivekitClient property' :
                        finalHasLivekitClientRoom ? 'LivekitClient.Room' :
                        'other');
                    this.initializeIntegration().catch(error => {
                        console.error('❌ Error in initializeIntegration:', error);
                        this.showStatus('error', `Initialization error: ${error.message}`);
                    });
                }
                return;
            }
        }, 100);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("l_iv_ek_it_ch_at_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    /**
     * Initialize LiveKit integration
     */
    async initializeIntegration() {
        try {
            // Get LiveKitVoiceIntegration class (try multiple ways)
            const LiveKitVoiceIntegrationClass = typeof LiveKitVoiceIntegration !== 'undefined' 
                ? LiveKitVoiceIntegration 
                : (typeof window.LiveKitVoiceIntegration !== 'undefined' 
                    ? window.LiveKitVoiceIntegration 
                    : null);
            
            if (!LiveKitVoiceIntegrationClass) {
                throw new Error('LiveKitVoiceIntegration class not found');
            }
            
            console.log('✅ LiveKitVoiceIntegration class found');
            
            // Initialize LiveKit integration
            this.livekitIntegration = new LiveKitVoiceIntegrationClass();
            
            // Wait for init to complete (it now returns a Promise)
            const initResult = await this.livekitIntegration.init(
                (status, message) => this.handleStatusChange(status, message),
                (transcript) => this.handleTranscript(transcript)
            );

            if (!initResult) {
                throw new Error('LiveKit integration initialization failed');
            }

            // Setup event listeners
            this.setupEventListeners();
            
            console.log('✅ LiveKit Chat initialized successfully');
            this.showStatus('ready', 'Ready to connect');
        } catch (error) {
            console.error('❌ Error initializing LiveKit integration:', error);
            this.showStatus('error', `Initialization error: ${error.message}`);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Connect button
        const connectBtn = document.getElementById('livekit-connect-btn');
        const welcomeConnectBtn = document.getElementById('livekit-welcome-connect-btn');
        const disconnectBtn = document.getElementById('livekit-disconnect-btn');
        const muteBtn = document.getElementById('livekit-mute-btn');

        if (connectBtn) {
            connectBtn.addEventListener('click', () => {
                console.log('🔌 Connect button clicked');
                this.connect().catch(error => {
                    console.error('❌ Connect error:', error);
                    this.showStatus('error', `Connect failed: ${error.message}`);
                });
            });
        }

        if (welcomeConnectBtn) {
            welcomeConnectBtn.addEventListener('click', () => {
                console.log('🔌 Welcome connect button clicked');
                this.connect().catch(error => {
                    console.error('❌ Connect error:', error);
                    this.showStatus('error', `Connect failed: ${error.message}`);
                });
            });
        }

        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => this.disconnect());
        }

        if (muteBtn) {
            muteBtn.addEventListener('click', () => this.toggleMute());
        }

        // Model selector (for future use)
        const modelSelector = document.getElementById('livekit-model-selector');
        if (modelSelector) {
            modelSelector.addEventListener('change', (e) => {
                this.currentModel = e.target.value;
                console.log('LiveKit model changed to:', this.currentModel);
            });
        }
    }

    /**
     * Connect to LiveKit room
     */
    async connect() {
        console.log('🔌 connect() called');
        console.log('  isConnected:', this.isConnected);
        console.log('  livekitIntegration:', this.livekitIntegration);
        
        if (this.isConnected) {
            console.log('Already connected');
            return;
        }

        if (!this.livekitIntegration) {
            console.error('❌ livekitIntegration not initialized');
            this.showStatus('error', 'LiveKit integration not initialized. Please refresh the page.');
            return;
        }

        try {
            console.log('🔄 Starting connection process...');
            this.showStatus('connecting', 'Connecting to LiveKit agent...');
            
            // Hide welcome message
            const welcomeMsg = document.querySelector('#livekit-messages-container .welcome-message');
            if (welcomeMsg) {
                welcomeMsg.style.display = 'none';
            }

            console.log('📞 Calling livekitIntegration.connect()...');
            // Connect to LiveKit
            const success = await this.livekitIntegration.connect('User');
            console.log('📞 Connection result:', success);
            
            if (success) {
                console.log('✅ Connection successful!');
                this.isConnected = true;
                this.updateUI();
                this.showStatus('connected', 'Connected to voice agent');
                this.addSystemMessage('Connected to LiveKit voice agent. Start speaking!');
            } else {
                console.error('❌ Connection returned false');
                this.showStatus('error', 'Failed to connect to LiveKit agent');
                this.addSystemMessage('Failed to connect. Make sure the LiveKit agent is running.', 'error');
            }
        } catch (error) {
            console.error('❌ Error connecting to LiveKit:', error);
            console.error('  Error stack:', error.stack);
            this.showStatus('error', `Connection error: ${error.message}`);
            this.addSystemMessage(`Connection error: ${error.message}`, 'error');
        }
    }

    /**
     * Disconnect from LiveKit room
     */
    async disconnect() {
        if (!this.isConnected) {
            return;
        }

        try {
            this.showStatus('disconnecting', 'Disconnecting...');
            await this.livekitIntegration.disconnect();
            this.isConnected = false;
            this.isMuted = false;
            this.updateUI();
            this.showStatus('disconnected', 'Disconnected from voice agent');
            this.addSystemMessage('Disconnected from LiveKit voice agent.');
        } catch (error) {
            console.error('Error disconnecting:', error);
            this.showStatus('error', `Disconnect error: ${error.message}`);
        }
    }

    /**
     * Toggle mute state
     */
    async toggleMute() {
        if (!this.isConnected) {
            return;
        }

        try {
            this.isMuted = await this.livekitIntegration.toggleMute();
            const muteBtn = document.getElementById('livekit-mute-btn');
            if (muteBtn) {
                muteBtn.textContent = this.isMuted ? '🔊 Unmute' : '🔇 Mute';
                muteBtn.title = this.isMuted ? 'Unmute microphone' : 'Mute microphone';
            }
        } catch (error) {
            console.error('Error toggling mute:', error);
        }
    }

    /**
     * Handle status changes
     */
    handleStatusChange(status, message) {
        console.log('LiveKit status:', status, message);
        this.showStatus(status, message);
        
        if (status === 'connected') {
            this.isConnected = true;
            this.updateUI();
        } else if (status === 'disconnected' || status === 'error') {
            this.isConnected = false;
            this.updateUI();
        }
    }

    /**
     * Handle transcript updates
     */
    handleTranscript(transcriptData) {
        console.log('Transcript received:', transcriptData);
        
        // Add transcript to messages
        if (transcriptData.text) {
            const role = transcriptData.isUser ? 'user' : 'assistant';
            this.addMessage(role, transcriptData.text, new Date().toISOString());
        }
    }

    /**
     * Add message to chat
     */
    addMessage(role, content, timestamp) {
        const message = {
            role,
            content,
            timestamp: timestamp || new Date().toISOString()
        };
        
        this.messages.push(message);
        this.renderMessage(message);
    }

    /**
     * Add system message
     */
    addSystemMessage(content, type = 'info') {
        const message = {
            role: 'system',
            content,
            type,
            timestamp: new Date().toISOString()
        };
        
        this.messages.push(message);
        this.renderMessage(message);
    }

    /**
     * Render message in chat
     */
    renderMessage(message) {
        const container = document.getElementById('livekit-messages-container');
        if (!container) return;

        // Remove welcome message if it exists
        const welcomeMsg = container.querySelector('.welcome-message');
        if (welcomeMsg && this.messages.length > 0) {
            welcomeMsg.style.display = 'none';
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.role}-message`;
        
        if (message.role === 'system') {
            messageDiv.style.cssText = `
                padding: 0.75rem 1rem;
                margin: 0.5rem 0;
                background: ${message.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)'};
                border-left: 3px solid ${message.type === 'error' ? '#ef4444' : '#3b82f6'};
                border-radius: 5px;
                color: rgba(255, 255, 255, 0.9);
                font-size: 0.9rem;
            `;
            messageDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span>${message.type === 'error' ? '⚠️' : 'ℹ️'}</span>
                    <span>${this.escapeHtml(message.content)}</span>
                </div>
            `;
        } else {
            messageDiv.style.cssText = `
                display: flex;
                gap: 0.75rem;
                margin: 1rem 0;
                padding: 1rem;
                background: ${message.role === 'user' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(186, 148, 79, 0.1)'};
                border-radius: 10px;
            `;
            
            const avatar = message.role === 'user' ? '👤' : '🎙️';
            const alignment = message.role === 'user' ? 'flex-end' : 'flex-start';
            
            messageDiv.style.flexDirection = message.role === 'user' ? 'row-reverse' : 'row';
            messageDiv.innerHTML = `
                <div style="font-size: 1.5rem;">${avatar}</div>
                <div style="flex: 1;">
                    <div style="color: rgba(255, 255, 255, 0.9); line-height: 1.6;">
                        ${this.formatText(message.content)}
                    </div>
                    <div style="font-size: 0.75rem; color: rgba(255, 255, 255, 0.5); margin-top: 0.5rem;">
                        ${new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                </div>
            `;
        }

        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    }

    /**
     * Format text (basic markdown support)
     */
    formatText(text) {
        // Escape HTML
        text = this.escapeHtml(text);
        
        // Simple markdown: bold, italic, code
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        text = text.replace(/`(.*?)`/g, '<code style="background: rgba(0,0,0,0.3); padding: 2px 4px; border-radius: 3px;">$1</code>');
        
        // Line breaks
        text = text.replace(/\n/g, '<br>');
        
        return text;
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Update UI based on connection state
     */
    updateUI() {
        const connectBtn = document.getElementById('livekit-connect-btn');
        const disconnectBtn = document.getElementById('livekit-disconnect-btn');
        const muteBtn = document.getElementById('livekit-mute-btn');
        const welcomeConnectBtn = document.getElementById('livekit-welcome-connect-btn');

        if (this.isConnected) {
            if (connectBtn) connectBtn.style.display = 'none';
            if (disconnectBtn) disconnectBtn.style.display = 'inline-block';
            if (muteBtn) muteBtn.style.display = 'inline-block';
            if (welcomeConnectBtn) welcomeConnectBtn.style.display = 'none';
        } else {
            if (connectBtn) connectBtn.style.display = 'inline-block';
            if (disconnectBtn) disconnectBtn.style.display = 'none';
            if (muteBtn) muteBtn.style.display = 'none';
            if (welcomeConnectBtn) welcomeConnectBtn.style.display = 'block';
        }
    }

    /**
     * Show status
     */
    showStatus(status, message) {
        const statusText = document.getElementById('livekit-status-text');
        const indicator = document.getElementById('livekit-connection-indicator');
        
        if (statusText) {
            statusText.textContent = `Status: ${message || status}`;
        }
        
        if (indicator) {
            const colors = {
                'connected': '#4ade80',
                'connecting': '#fbbf24',
                'disconnected': '#ef4444',
                'disconnecting': '#fbbf24',
                'error': '#ef4444'
            };
            indicator.style.background = colors[status] || '#9ca3af';
        }
    }
}

// Initialize when DOM is ready
function initLiveKitChat() {
    console.log('🎙️ Initializing LiveKit Chat...');
    console.log('DOM ready state:', document.readyState);
    
    // Check if the LiveKit section exists
    const section = document.getElementById('livekit-integration-section');
    if (!section) {
        console.error('❌ LiveKit Integration section not found in DOM');
        console.log('Available sections:', document.querySelectorAll('section'));
        // Try to find it by class
        const sections = document.querySelectorAll('.content-section');
        console.log('Found content sections:', sections.length);
        return;
    }
    
    console.log('✅ LiveKit Integration section found');
    
    // Make sure section is visible
    section.style.display = 'block';
    section.style.visibility = 'visible';
    section.style.opacity = '1';
    
    // Check for chat container
    const container = document.getElementById('livekit-chat-container');
    if (container) {
        console.log('✅ LiveKit chat container found');
    } else {
        console.error('❌ LiveKit chat container not found');
    }
    
    // Wait for LiveKit SDK to be ready
    function tryInit() {
        // Check for SDK (it exposes as LivekitClient, not LiveKit)
        // Use same detection logic as LiveKitChat.init()
        const hasSDKReadyFlag = window.LIVEKIT_SDK_READY === true || window.LIVEKIT_SDK_READY === 'true' || !!window.LIVEKIT_SDK_READY;
        const hasLivekitClient = 'LivekitClient' in window && window.LivekitClient != null;
        const hasLivekitClientRoom = window.LivekitClient && window.LivekitClient.Room;
        
        const sdkReady = hasSDKReadyFlag ||
                        hasLivekitClient ||
                        hasLivekitClientRoom ||
                        typeof LiveKit !== 'undefined' || 
                        typeof window.LiveKit !== 'undefined' ||
                        typeof LivekitClient !== 'undefined' ||
                        typeof window.LivekitClient !== 'undefined' ||
                        (window.livekit && window.livekit.Room);
        
        if (sdkReady) {
            // Prevent double initialization
            if (window.livekitChat) {
                console.log('⚠️ LiveKit Chat already initialized');
                return;
            }

            // Initialize chat
            try {
                window.livekitChat = new LiveKitChat();
                console.log('✅ LiveKit Chat initialized successfully');
            } catch (error) {
                console.error('❌ Error initializing LiveKit Chat:', error);
            }
        } else {
            // Wait for SDK ready event or check again (max 50 attempts = 10 seconds)
            const maxAttempts = 50;
            let attempts = 0;
            const checkInterval = setInterval(() => {
                attempts++;
                const nowReady = window.LIVEKIT_SDK_READY || 
                                ('LivekitClient' in window && window.LivekitClient != null);
                if (nowReady || attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    if (nowReady) {
                        tryInit();
                    } else {
                        console.error('❌ Timeout waiting for LiveKit SDK in tryInit');
                    }
                }
            }, 200);
        }
    }
    
    // Listen for SDK ready event
    window.addEventListener('livekit-sdk-ready', () => {
        console.log('📢 LiveKit SDK ready event received');
        tryInit();
    });
    
    // Also try immediately (in case SDK already loaded)
    setTimeout(tryInit, 500);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLiveKitChat);
} else {
    // DOM already loaded, initialize after a short delay
    setTimeout(initLiveKitChat, 200);
}

