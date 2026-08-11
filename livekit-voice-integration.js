/**
 * LiveKit Voice Agent Integration for Stellar AI
 * 
 * Integrates LiveKit's Gemini Live API agent for real-time voice conversations
 * 
 * @class LiveKitVoiceIntegration
 * @author Adriano To The Star
 * @version 1.0.0
 */

class LiveKitVoiceIntegration {
    constructor() {
        this.room = null;
        this.localParticipant = null;
        this.remoteParticipant = null;
        this.isConnected = false;
        this.isMuted = false;
        this.localAudioTrack = null;
        this.remoteAudioTrack = null;
        this.audioContext = null;
        this.audioElement = null;
        this.config = window.LIVEKIT_CONFIG || {};
        this.onStatusChange = null;
        this.onTranscript = null;
    }

    /**
     * Initialize LiveKit voice integration
     * @param {Function} onStatusChange - Callback for status changes
     * @param {Function} onTranscript - Callback for transcript updates
     */
    init(onStatusChange, onTranscript) {
        this.onStatusChange = onStatusChange;
        this.onTranscript = onTranscript;

        // Wait for LiveKit SDK to be ready
        return this.waitForLiveKitSDK().then(() => {
            // Check if LiveKit client is available (try multiple ways)
            // Note: The SDK exposes as LivekitClient (lowercase 'k'), not LiveKit
            // Use same detection logic as livekit-chat.js
            const hasSDKReadyFlag = window.LIVEKIT_SDK_READY === true ||
                window.LIVEKIT_SDK_READY === 'true' ||
                (window.LIVEKIT_SDK_READY !== undefined && window.LIVEKIT_SDK_READY !== false && window.LIVEKIT_SDK_READY !== null);

            const hasLivekitClientProp = 'LivekitClient' in window;
            const livekitClientValue = hasLivekitClientProp ? window.LivekitClient : null;
            const hasLivekitClient = hasLivekitClientProp && livekitClientValue != null;
            const hasLivekitClientRoom = livekitClientValue && typeof livekitClientValue === 'object' && livekitClientValue.Room;

            const LiveKitAvailable = hasSDKReadyFlag ||
                hasLivekitClient ||
                hasLivekitClientRoom ||
                typeof LiveKit !== 'undefined' ||
                typeof window.LiveKit !== 'undefined' ||
                typeof LivekitClient !== 'undefined' ||
                typeof window.LivekitClient !== 'undefined' ||
                (window.livekit && window.livekit.Room);

            if (!LiveKitAvailable) {
                console.error('❌ LiveKit client SDK not loaded after waiting');
                console.error('  hasSDKReadyFlag:', hasSDKReadyFlag, '(value:', window.LIVEKIT_SDK_READY, ')');
                console.error('  hasLivekitClientProp:', hasLivekitClientProp);
                console.error('  livekitClientValue:', livekitClientValue, '(type:', typeof livekitClientValue, ')');
                console.error('  hasLivekitClient:', hasLivekitClient);
                console.error('  hasLivekitClientRoom:', hasLivekitClientRoom);
                console.error('  typeof LiveKit:', typeof LiveKit);
                console.error('  typeof window.LiveKit:', typeof window.LiveKit);
                console.error('  typeof LivekitClient:', typeof LivekitClient);
                console.error('  typeof window.LivekitClient:', typeof window.LivekitClient);
                console.error('  window.livekit:', window.livekit);
                console.error('  Available globals:', Object.keys(window).filter(k => k.toLowerCase().includes('livekit')));

                if (this.onStatusChange) {
                    this.onStatusChange('error', 'LiveKit SDK not loaded. Please refresh the page.');
                }
                return false;
            }

            // Store the LiveKit reference (try LivekitClient first, then LiveKit)
            this.LiveKit = typeof LivekitClient !== 'undefined' ? LivekitClient :
                (typeof window.LivekitClient !== 'undefined' ? window.LivekitClient :
                    (typeof LiveKit !== 'undefined' ? LiveKit :
                        (window.LiveKit || window.livekit)));
            console.log('✅ LiveKit SDK available:', !!this.LiveKit);
            console.log('  SDK type:', this.LiveKit ? this.LiveKit.constructor.name : 'unknown');

            return true;
        }).catch((error) => {
            console.error('❌ Error waiting for LiveKit SDK:', error);
            if (this.onStatusChange) {
                this.onStatusChange('error', 'LiveKit SDK not loaded. Please refresh the page.');
            }
            return false;
        });
    }

    /**
     * Wait for LiveKit SDK to be loaded
     * @returns {Promise<void>}
     */
    waitForLiveKitSDK() {
        return new Promise((resolve, reject) => {
            // Helper function to check if SDK is available
            // Note: The SDK exposes as LivekitClient (lowercase 'k'), not LiveKit
            // Use same detection logic as livekit-chat.js
            const isSDKAvailable = () => {
                const hasSDKReadyFlag = window.LIVEKIT_SDK_READY === true ||
                    window.LIVEKIT_SDK_READY === 'true' ||
                    (window.LIVEKIT_SDK_READY !== undefined && window.LIVEKIT_SDK_READY !== false && window.LIVEKIT_SDK_READY !== null);

                const hasLivekitClientProp = 'LivekitClient' in window;
                const livekitClientValue = hasLivekitClientProp ? window.LivekitClient : null;
                const hasLivekitClient = hasLivekitClientProp && livekitClientValue != null;
                const hasLivekitClientRoom = livekitClientValue && typeof livekitClientValue === 'object' && livekitClientValue.Room;

                return hasSDKReadyFlag ||
                    hasLivekitClient ||
                    hasLivekitClientRoom ||
                    typeof LiveKit !== 'undefined' ||
                    typeof window.LiveKit !== 'undefined' ||
                    typeof LivekitClient !== 'undefined' ||
                    typeof window.LivekitClient !== 'undefined' ||
                    (window.livekit && window.livekit.Room) ||
                    (window.Livekit && window.Livekit.Room);
            };

            // Check if already loaded
            if (isSDKAvailable()) {
                console.log('✅ LiveKit SDK already available');
                resolve();
                return;
            }

            // Wait for SDK ready event
            const timeout = setTimeout(() => {
                window.removeEventListener('livekit-sdk-ready', onSDKReady);
                reject(new Error('Timeout waiting for LiveKit SDK (10 seconds)'));
            }, 10000); // 10 second timeout

            const onSDKReady = () => {
                // Double-check SDK is actually available
                if (isSDKAvailable()) {
                    clearTimeout(timeout);
                    window.removeEventListener('livekit-sdk-ready', onSDKReady);
                    console.log('✅ LiveKit SDK ready event received and verified');
                    resolve();
                } else {
                    console.warn('⚠️ LiveKit SDK ready event received but SDK not found');
                }
            };

            window.addEventListener('livekit-sdk-ready', onSDKReady);

            // Also poll in case event doesn't fire
            let attempts = 0;
            const maxAttempts = 100; // 10 seconds
            const pollInterval = setInterval(() => {
                attempts++;
                if (isSDKAvailable()) {
                    clearInterval(pollInterval);
                    clearTimeout(timeout);
                    window.removeEventListener('livekit-sdk-ready', onSDKReady);
                    console.log('✅ LiveKit SDK detected via polling');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    clearInterval(pollInterval);
                    clearTimeout(timeout);
                    window.removeEventListener('livekit-sdk-ready', onSDKReady);
                    console.error('❌ Timeout waiting for LiveKit SDK');
                    console.error('  window.LIVEKIT_SDK_READY:', window.LIVEKIT_SDK_READY);
                    console.error('  typeof LiveKit:', typeof LiveKit);
                    console.error('  typeof window.LiveKit:', typeof window.LiveKit);
                    console.error('  window.livekit:', window.livekit);
                    reject(new Error('Timeout waiting for LiveKit SDK (polling)'));
                }
            }, 100);
        });
    }

    async fetchJSON(url, options = {}) {
        try {
            const res = await fetch(url, options);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.warn(`[livekit-voice-integration] Direct fetch failed for ${url}, attempting proxy...`, e.message);

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
                console.warn('[livekit-voice-integration] AllOrigins proxy failed, trying corsproxy.io...', proxyError.message);
            }

            // Fallback to corsproxy.io
            try {
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl, options);
                if (!proxyRes.ok) throw new Error(`Proxy HTTP ${proxyRes.status}`);
                return await proxyRes.json();
            } catch (proxyError) {
                console.error('[livekit-voice-integration] All proxies failed:', proxyError.message);
                throw e; // Re-throw original error
            }
        }
    }

    /**
     * Get access token from backend
     * @param {string} roomName - Name of the room to join
     * @param {string} participantName - Name of the participant
     * @returns {Promise<string>} Access token
     */
    async getAccessToken(roomName, participantName) {
        const hostname = window.location.hostname;
        const apiToken = this.config.apiToken ||
            (window.STELLAR_AI_API_TOKEN || window.API_TOKEN || null) ||
            (localStorage.getItem('stellarAiApiToken') || localStorage.getItem('puterAuthToken') || null);

        // Use config backendUrl if available, otherwise detect from window location
        let backendUrl = this.config.backendUrl;
        if (!backendUrl) {
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
                backendUrl = 'http://localhost:3001';
            } else if (hostname === 'adrianotothestar.com' || hostname.includes('adrianotothestar')) {
                // Production backend on Google Cloud Run
                backendUrl = 'https://stellar-ai-backend-531866272848.europe-west2.run.app';
            } else {
                // Fallback: try to construct from current origin
                backendUrl = `${window.location.protocol}//${window.location.hostname}:3001`;
            }
        }
        const tokenUrl = `${backendUrl}/api/livekit/token`;

        console.log('🔑 Requesting LiveKit token from backend...');
        console.log('  Backend URL:', backendUrl);
        console.log('  Token URL:', tokenUrl);
        console.log('  Room Name:', roomName);
        console.log('  Participant Name:', participantName);

        try {
            const headers = {
                'Content-Type': 'application/json',
            };
            if (apiToken) {
                headers['Authorization'] = `Bearer ${apiToken}`;
            }

            const data = await this.fetchJSON(tokenUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    roomName,
                    participantName,
                    livekitUrl: this.config.url,
                    apiKey: this.config.apiKey,
                    apiSecret: this.config.apiSecret
                })
            });

            console.log('✅ Token received successfully (length:', data.token ? data.token.length : 0, ')');
            return data.token;
        } catch (error) {
            console.error('❌ Error getting access token:', error);
            console.error('  Error type:', error.constructor.name);
            console.error('  Error message:', error.message);
            console.error('  Backend URL attempted:', backendUrl);

            // Check if it's a network error
            if (error.message.includes('Failed to fetch') ||
                error.message.includes('ERR_CONNECTION_REFUSED') ||
                error.message.includes('ERR_CONNECTION_TIMED_OUT') ||
                error.message.includes('NetworkError')) {
                console.error('⚠️ Network error: Backend server might not be running or not accessible');
                console.error('  Please ensure the backend server is running on', backendUrl);

                // Try alternative backend URLs for production
                if (hostname === 'adrianotothestar.com' || hostname.includes('adrianotothestar')) {
                    const alternatives = [
                        'https://adrianotothestar.com:3001',
                        'http://adrianotothestar.com:3001',
                        'https://adrianotothestar.com/api'
                    ];

                    for (const altUrl of alternatives) {
                        if (altUrl !== backendUrl) {
                            console.log(`🔄 Trying alternative backend URL: ${altUrl}`);
                            try {
                                const altTokenUrl = `${altUrl}/api/livekit/token`;
                                const headers = {
                                    'Content-Type': 'application/json',
                                };
                                if (apiToken) {
                                    headers['Authorization'] = `Bearer ${apiToken}`;
                                }
                                const altData = await this.fetchJSON(altTokenUrl, {
                                    method: 'POST',
                                    headers,
                                    body: JSON.stringify({
                                        roomName,
                                        participantName,
                                        livekitUrl: this.config.url,
                                        apiKey: this.config.apiKey,
                                        apiSecret: this.config.apiSecret
                                    }),
                                    signal: AbortSignal.timeout(5000) // 5 second timeout
                                });

                                if (altData && altData.token) {
                                    console.log('✅ Token received from alternative URL');
                                    return altData.token;
                                }
                            } catch (altError) {
                                console.log(`  ❌ Alternative URL failed: ${altUrl}`);
                            }
                        }
                    }
                }

                if (this.onStatusChange) {
                    this.onStatusChange('error', `Cannot connect to backend server. The LiveKit agent on Google Cloud Run should handle connections directly. Please check if the agent is running.`);
                }
            }

            // Don't fallback to placeholder - it won't work
            throw error; // Re-throw to let caller handle
        }
    }

    /**
     * Generate token client-side (fallback method)
     * Note: This is less secure. Use backend token generation in production.
     */
    generateTokenClientSide(roomName, participantName) {
        // For now, return a placeholder. In production, use backend.
        console.warn('Using client-side token generation (not recommended for production)');
        return 'client-side-token-placeholder';
    }

    /**
     * Connect to LiveKit room and start voice conversation
     * @param {string} participantName - Name of the participant
     * @returns {Promise<boolean>} Success status
     */
    async connect(participantName = 'User') {
        if (this.isConnected) {
            console.log('Already connected to LiveKit room');
            return true;
        }

        try {
            if (this.onStatusChange) {
                this.onStatusChange('connecting', 'Connecting to voice agent...');
            }

            // Generate unique room name
            const roomName = `stellar-ai-${Date.now()}`;

            // Get access token
            const token = await this.getAccessToken(roomName, participantName);

            // Create room instance
            // Try LivekitClient first (the actual SDK export), then fallback to other names
            const LiveKitRef = this.LiveKit ||
                (typeof LivekitClient !== 'undefined' ? LivekitClient : null) ||
                (typeof window.LivekitClient !== 'undefined' ? window.LivekitClient : null) ||
                LiveKit ||
                window.LiveKit ||
                window.livekit;

            if (!LiveKitRef) {
                throw new Error('LiveKit SDK not found. Available: ' + Object.keys(window).filter(k => k.toLowerCase().includes('livekit')).join(', '));
            }

            if (!LiveKitRef.Room) {
                console.error('LiveKitRef:', LiveKitRef);
                console.error('LiveKitRef properties:', Object.keys(LiveKitRef || {}));
                throw new Error('LiveKit.Room not available. SDK loaded but Room class not found.');
            }

            this.room = new LiveKitRef.Room({
                adaptiveStream: true,
                dynacast: true,
                // Auto-subscribe to all tracks
                autoSubscribe: true,
            });

            // Set up event handlers
            this.setupRoomEventHandlers();

            // Connect to room
            await this.room.connect(this.config.url, token);
            console.log('✅ Connected to LiveKit room');
            console.log('  Room name:', this.room.name);
            console.log('  Local participant:', this.room.localParticipant.identity);
            console.log('  Remote participants:', Array.from(this.room.remoteParticipants.keys()));

            // Check for existing participants
            if (this.room.remoteParticipants.size > 0) {
                console.log('✅ Agent already in room:', Array.from(this.room.remoteParticipants.keys()));
                this.remoteParticipant = Array.from(this.room.remoteParticipants.values())[0];
            } else {
                console.log('⏳ Waiting for agent to join...');
            }

            // Enable microphone
            await this.enableMicrophone();

            // Start audio playback (required for browser autoplay policies)
            try {
                await this.room.startAudio();
                console.log('✅ Audio playback started');
            } catch (error) {
                console.warn('⚠️ Could not start audio immediately:', error);
                console.warn('  Audio will start when the agent speaks');
            }

            if (this.onStatusChange) {
                this.onStatusChange('connected', 'Connected to voice agent');
            }

            this.isConnected = true;
            return true;

        } catch (error) {
            console.error('Error connecting to LiveKit:', error);
            if (this.onStatusChange) {
                this.onStatusChange('error', `Connection failed: ${error.message}`);
            }
            return false;
        }
    }

    /**
     * Set up room event handlers
     */
    setupRoomEventHandlers() {
        if (!this.room) return;

        // Track published - subscribe to it
        this.room.on('trackPublished', (publication, participant) => {
            console.log('📡 Track published:', publication.kind, 'by', participant.identity);
            console.log('  Publication SID:', publication.trackSid);
            console.log('  Is subscribed:', publication.isSubscribed);
            if (publication.kind === 'audio' && participant !== this.room.localParticipant) {
                console.log('  🔊 Subscribing to remote audio track...');
                // Subscribe to the track
                this.room.localParticipant.setSubscribed(publication, true);
                console.log('  ✅ Subscription request sent');
            }
        });

        // Track subscribed - handle the audio
        this.room.on('trackSubscribed', (track, publication, participant) => {
            console.log('🎧 Track subscribed:', track.kind, 'from', participant.identity);
            console.log('  Track SID:', track.sid);
            console.log('  Track state:', track.streamState);
            console.log('  Track muted:', track.isMuted);
            if (track.kind === 'audio' && participant !== this.room.localParticipant) {
                console.log('  🔊 Processing remote audio track...');
                this.remoteAudioTrack = track;
                this.handleRemoteAudioTrack(track);
            }
        });

        // Track stream state changed
        this.room.on('trackStreamStateChanged', (publication, streamState, participant) => {
            console.log('📊 Track stream state changed:', streamState, 'for', participant.identity);
            if (publication.kind === 'audio' && publication.track && participant !== this.room.localParticipant) {
                console.log('  🔊 Audio track stream state:', streamState);
            }
        });

        // Participant connected
        this.room.on('participantConnected', (participant) => {
            console.log('✅ Participant connected:', participant.identity);
            console.log('  Participant SID:', participant.sid);
            console.log('  Participant tracks:', Array.from(participant.trackPublications.keys()));
            this.remoteParticipant = participant;

            // Check for existing audio tracks
            participant.trackPublications.forEach((publication, trackSid) => {
                if (publication.kind === 'audio') {
                    console.log('  🔊 Found existing audio track:', trackSid);
                    if (publication.track) {
                        console.log('  🔊 Track already available, subscribing...');
                        this.room.localParticipant.setSubscribed(publication, true);
                    }
                }
            });
        });

        // Participant disconnected
        this.room.on('participantDisconnected', (participant) => {
            console.log('Participant disconnected:', participant.identity);
            if (this.onStatusChange) {
                this.onStatusChange('disconnected', 'Voice agent disconnected');
            }
        });

        // Data received (for transcripts)
        this.room.on('dataReceived', (payload, participant, kind, topic) => {
            if (topic === 'transcript') {
                try {
                    const data = JSON.parse(new TextDecoder().decode(payload));
                    if (this.onTranscript) {
                        this.onTranscript(data);
                    }
                } catch (e) {
                    console.error('Error parsing transcript:', e);
                }
            }
        });

        // Connection state changed
        this.room.on('connectionStateChanged', (state) => {
            console.log('Connection state:', state);
            if (state === 'disconnected' || state === 'failed') {
                this.isConnected = false;
                if (this.onStatusChange) {
                    this.onStatusChange('disconnected', 'Connection lost');
                }
            }
        });
    }

    /**
     * Enable microphone and publish audio track
     */
    async enableMicrophone() {
        try {
            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Create audio track
            const LiveKitRef = this.LiveKit ||
                (typeof LivekitClient !== 'undefined' ? LivekitClient : null) ||
                (typeof window.LivekitClient !== 'undefined' ? window.LivekitClient : null) ||
                LiveKit ||
                window.LiveKit ||
                window.livekit;

            if (!LiveKitRef || !LiveKitRef.createLocalAudioTrack) {
                throw new Error('LiveKit.createLocalAudioTrack not available');
            }

            this.localAudioTrack = await LiveKitRef.createLocalAudioTrack({
                deviceId: stream.getAudioTracks()[0].getSettings().deviceId
            });

            // Publish track
            await this.room.localParticipant.publishTrack(this.localAudioTrack);

            console.log('Microphone enabled and published');
        } catch (error) {
            console.error('Error enabling microphone:', error);
            if (this.onStatusChange) {
                this.onStatusChange('error', `Microphone error: ${error.message}`);
            }
        }
    }

    /**
     * Handle remote audio track (agent's voice)
     */
    handleRemoteAudioTrack(track) {
        console.log('🔊 Handling remote audio track');
        console.log('  Track:', track);
        console.log('  Track SID:', track.sid);
        console.log('  Track kind:', track.kind);
        console.log('  Track streamState:', track.streamState);
        console.log('  Track isMuted:', track.isMuted);

        if (this.remoteAudioTrack) {
            console.log('  Detaching previous track');
            this.remoteAudioTrack.detach();
        }

        this.remoteAudioTrack = track;

        // Create audio element for playback
        if (!this.audioElement) {
            this.audioElement = document.createElement('audio');
            this.audioElement.autoplay = true;
            this.audioElement.setAttribute('playsinline', 'true');
            this.audioElement.setAttribute('crossorigin', 'anonymous');
            this.audioElement.style.display = 'none'; // Hide the audio element
            document.body.appendChild(this.audioElement);
            console.log('✅ Audio element created and added to DOM');
        }

        // Attach track to audio element
        try {
            track.attach(this.audioElement);
            console.log('✅ Track attached to audio element');
            console.log('  Audio element srcObject:', !!this.audioElement.srcObject);
            console.log('  Audio element readyState:', this.audioElement.readyState);
        } catch (error) {
            console.error('❌ Error attaching track:', error);
            return;
        }

        // Listen for track events
        track.on('muted', () => {
            console.warn('⚠️ Audio track muted');
        });

        track.on('unmuted', () => {
            console.log('✅ Audio track unmuted');
        });

        track.on('ended', () => {
            console.log('⏹️ Audio track ended');
        });

        // Listen for audio element events
        this.audioElement.addEventListener('play', () => {
            console.log('🎵 Audio element started playing');
        });

        this.audioElement.addEventListener('playing', () => {
            console.log('▶️ Audio element is playing');
        });

        this.audioElement.addEventListener('pause', () => {
            console.log('⏸️ Audio element paused');
        });

        this.audioElement.addEventListener('ended', () => {
            console.log('⏹️ Audio element ended');
        });

        this.audioElement.addEventListener('error', (e) => {
            console.error('❌ Audio playback error:', e);
            console.error('  Error code:', this.audioElement.error?.code);
            console.error('  Error message:', this.audioElement.error?.message);
        });

        this.audioElement.addEventListener('loadedmetadata', () => {
            console.log('📋 Audio metadata loaded');
        });

        this.audioElement.addEventListener('canplay', () => {
            console.log('✅ Audio can play');
            // Try to play when ready
            this.audioElement.play().catch(err => {
                console.warn('⚠️ Could not play audio:', err);
            });
        });

        // Try to play the audio immediately
        this.audioElement.play().then(() => {
            console.log('✅ Audio playback started successfully');
        }).catch((error) => {
            console.warn('⚠️ Could not autoplay audio immediately:', error);
            console.warn('  Error name:', error.name);
            console.warn('  Error message:', error.message);
            console.warn('  Audio will play when data is available');
        });
    }

    /**
     * Toggle mute state
     */
    async toggleMute() {
        if (!this.localAudioTrack) return;

        this.isMuted = !this.isMuted;

        if (this.isMuted) {
            this.localAudioTrack.mute();
        } else {
            this.localAudioTrack.unmute();
        }

        return this.isMuted;
    }

    /**
     * Disconnect from LiveKit room
     */
    async disconnect() {
        if (!this.isConnected) return;

        try {
            if (this.onStatusChange) {
                this.onStatusChange('disconnecting', 'Disconnecting...');
            }

            // Stop and detach tracks
            if (this.localAudioTrack) {
                this.localAudioTrack.stop();
                this.localAudioTrack = null;
            }

            if (this.remoteAudioTrack) {
                this.remoteAudioTrack.detach();
                this.remoteAudioTrack = null;
            }

            if (this.audioElement) {
                this.audioElement.pause();
                this.audioElement.srcObject = null;
            }

            // Disconnect from room
            if (this.room) {
                await this.room.disconnect();
                this.room = null;
            }

            this.isConnected = false;
            this.remoteParticipant = null;

            if (this.onStatusChange) {
                this.onStatusChange('disconnected', 'Disconnected from voice agent');
            }

        } catch (error) {
            console.error('Error disconnecting:', error);
        }
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            isConnected: this.isConnected,
            isMuted: this.isMuted,
            roomName: this.room?.name,
            participants: this.room?.participants.size || 0
        };
    }
}

// Export for use in other modules
window.LiveKitVoiceIntegration = LiveKitVoiceIntegration;

