/**
 * Voice Input Support for Stellar AI
 * Speech-to-text functionality using Web Speech API
 */

class VoiceInputSupport {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.isSupported = false;
        this.finalTranscript = '';
        this.interimTranscript = '';
        this.init();
    }

    init() {
        // Check for browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported in this browser');
            return;
        }

        this.isSupported = true;
        this.recognition = new SpeechRecognition();
        this.setupRecognition();
        
        console.log('✅ Voice Input Support initialized');
    }

    /**
     * Setup speech recognition
     */
    setupRecognition() {
        if (!this.recognition) return;

        // Configuration
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = navigator.language || 'en-US';

        // Event handlers
        this.recognition.onstart = () => {
            this.isListening = true;
            this.finalTranscript = '';
            this.interimTranscript = '';
            this.onListeningStateChange(true);
        };

        this.recognition.onresult = (event) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += transcript + ' ';
                } else {
                    interim += transcript;
                }
            }

            this.finalTranscript += final;
            this.interimTranscript = interim;
            this.onTranscriptUpdate(this.finalTranscript + this.interimTranscript);
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.onError(event.error);
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.onListeningStateChange(false);
            
            // Auto-restart if it was manually stopped
            if (this.shouldAutoRestart) {
                this.start();
            }
        };
    }

    /**
     * Start listening
     */
    start() {
        if (!this.isSupported || !this.recognition) {
            this.showError('Speech recognition is not supported in your browser');
            return;
        }

        if (this.isListening) {
            console.warn('Already listening');
            return;
        }

        try {
            this.shouldAutoRestart = true;
            this.recognition.start();
        } catch (error) {
            console.error('Failed to start recognition:', error);
            this.showError('Failed to start voice input. Please try again.');
        }
    }

    /**
     * Stop listening
     */
    stop() {
        if (!this.recognition || !this.isListening) return;

        this.shouldAutoRestart = false;
        this.recognition.stop();
    }

    /**
     * Toggle listening
     */
    toggle() {
        if (this.isListening) {
            this.stop();
        } else {
            this.start();
        }
    }

    /**
     * Get current transcript
     */
    getTranscript() {
        return (this.finalTranscript + this.interimTranscript).trim();
    }

    /**
     * Clear transcript
     */
    clearTranscript() {
        this.finalTranscript = '';
        this.interimTranscript = '';
        this.onTranscriptUpdate('');
    }

    /**
     * Handle transcript updates
     */
    onTranscriptUpdate(transcript) {
        // Update input field if it exists
        const input = document.getElementById('chat-input') || 
                     document.querySelector('textarea[placeholder*="ask" i]') ||
                     document.querySelector('input[type="text"]');
        
        if (input) {
            input.value = transcript;
            
            // Trigger input event
            const event = new Event('input', { bubbles: true });
            input.dispatchEvent(event);
        }

        // Show interim results
        this.showInterimResults(transcript);
    }

    /**
     * Handle listening state change
     */
    onListeningStateChange(isListening) {
        const button = document.getElementById('voice-input-btn');
        if (button) {
            button.classList.toggle('listening', isListening);
            button.title = isListening ? 'Stop listening' : 'Start voice input';
        }

        // Show/hide listening indicator
        this.showListeningIndicator(isListening);
    }

    /**
     * Handle errors
     */
    onError(error) {
        const errorMessages = {
            'no-speech': 'No speech detected. Please try again.',
            'audio-capture': 'No microphone found. Please check your microphone settings.',
            'not-allowed': 'Microphone permission denied. Please allow microphone access.',
            'network': 'Network error. Please check your connection.',
            'aborted': 'Speech recognition was aborted.',
            'service-not-allowed': 'Speech recognition service not allowed.'
        };

        const message = errorMessages[error] || 'An error occurred with speech recognition.';
        this.showError(message);

        if (error === 'not-allowed') {
            this.showPermissionPrompt();
        }
    }

    /**
     * Show interim results
     */
    showInterimResults(transcript) {
        let indicator = document.getElementById('voice-interim-results');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'voice-interim-results';
            indicator.className = 'voice-interim-results';
            document.body.appendChild(indicator);
        }

        if (transcript) {
            indicator.textContent = transcript;
            indicator.style.display = 'block';
        } else {
            indicator.style.display = 'none';
        }
    }

    /**
     * Show listening indicator
     */
    showListeningIndicator(isListening) {
        let indicator = document.getElementById('voice-listening-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'voice-listening-indicator';
            indicator.className = 'voice-listening-indicator';
            indicator.innerHTML = '<div class="listening-pulse"></div><span>Listening...</span>';
            document.body.appendChild(indicator);
        }

        indicator.style.display = isListening ? 'flex' : 'none';
    }

    /**
     * Show error message
     */
    showError(message) {
        // Use enhanced error handling if available
        if (window.enhancedErrorHandling) {
            window.enhancedErrorHandling().showErrorNotification({
                userMessage: message,
                shouldRetry: false
            });
        } else {
            alert(message);
        }
    }

    /**
     * Show permission prompt
     */
    showPermissionPrompt() {
        const prompt = document.createElement('div');
        prompt.className = 'voice-permission-prompt';
        prompt.innerHTML = `
            <div class="prompt-content">
                <h3>🎤 Microphone Permission Required</h3>
                <p>To use voice input, please allow microphone access in your browser settings.</p>
                <button onclick="this.parentElement.parentElement.remove()">Got it</button>
            </div>
        `;
        document.body.appendChild(prompt);
    }

    /**
     * Create voice input button
     */
    createVoiceButton(container) {
        if (!this.isSupported) return null;

        // Check if button already exists
        let button = document.getElementById('voice-input-btn');
        if (button) {
            // Enhance existing button
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggle();
            });
            return button;
        }

        button = document.createElement('button');
        button.id = 'voice-input-btn';
        button.className = 'voice-input-btn';
        button.innerHTML = '🎤';
        button.title = 'Start voice input';
        button.setAttribute('aria-label', 'Voice input');
        
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggle();
        });

        if (container) {
            container.appendChild(button);
        }

        return button;
    }

    /**
     * Initialize with existing button
     */
    initWithExistingButton() {
        const button = document.getElementById('voice-input-btn');
        if (button && this.isSupported) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggle();
            });
        }
    }

    /**
     * Inject CSS styles
     */
    injectStyles() {
        if (document.getElementById('voice-input-styles')) return;

        const style = document.createElement('style');
        style.id = 'voice-input-styles';
        style.textContent = `
            .voice-input-btn {
                background: rgba(186, 148, 79, 0.2);
                border: 2px solid rgba(186, 148, 79, 0.5);
                color: #ba944f;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 1.2rem;
                transition: all 0.3s;
                margin-left: 0.5rem;
            }

            .voice-input-btn:hover {
                background: rgba(186, 148, 79, 0.4);
                transform: scale(1.1);
            }

            .voice-input-btn.listening {
                background: rgba(220, 53, 69, 0.3);
                border-color: #ff4444;
                color: #ff4444;
                animation: pulse 1.5s infinite;
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }

            .voice-listening-indicator {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(220, 53, 69, 0.9);
                color: white;
                padding: 0.75rem 1.5rem;
                border-radius: 25px;
                display: none;
                align-items: center;
                gap: 0.75rem;
                z-index: 10000;
                font-family: 'Raleway', sans-serif;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }

            .listening-pulse {
                width: 12px;
                height: 12px;
                background: white;
                border-radius: 50%;
                animation: listening-pulse 1s infinite;
            }

            @keyframes listening-pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.5; transform: scale(1.5); }
            }

            .voice-interim-results {
                position: fixed;
                bottom: 120px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.9);
                color: #ba944f;
                padding: 1rem 1.5rem;
                border-radius: 12px;
                max-width: 600px;
                display: none;
                z-index: 9999;
                font-family: 'Raleway', sans-serif;
                border: 2px solid rgba(186, 148, 79, 0.5);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            }

            .voice-permission-prompt {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10001;
            }

            .prompt-content {
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(20, 20, 30, 0.95));
                border: 2px solid rgba(186, 148, 79, 0.5);
                border-radius: 12px;
                padding: 2rem;
                max-width: 400px;
                text-align: center;
            }

            .prompt-content h3 {
                color: #ba944f;
                margin-bottom: 1rem;
            }

            .prompt-content p {
                color: rgba(255, 255, 255, 0.8);
                margin-bottom: 1.5rem;
            }

            .prompt-content button {
                padding: 0.75rem 1.5rem;
                background: rgba(186, 148, 79, 0.2);
                border: 2px solid rgba(186, 148, 79, 0.5);
                color: #ba944f;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
            }

            .prompt-content button:hover {
                background: rgba(186, 148, 79, 0.4);
            }
        `;

        document.head.appendChild(style);
    }
}

// Initialize globally
let voiceInputInstance = null;

function initVoiceInput() {
    if (!voiceInputInstance) {
        voiceInputInstance = new VoiceInputSupport();
        voiceInputInstance.injectStyles();
    }
    return voiceInputInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initVoiceInput();
        // Initialize with existing button after a delay
        setTimeout(() => {
            if (voiceInputInstance) {
                voiceInputInstance.initWithExistingButton();
            }
        }, 1000);
    });
} else {
    initVoiceInput();
    setTimeout(() => {
        if (voiceInputInstance) {
            voiceInputInstance.initWithExistingButton();
        }
    }, 1000);
}

// Export globally
window.VoiceInputSupport = VoiceInputSupport;
window.voiceInput = () => voiceInputInstance;

