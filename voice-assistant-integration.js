/**
 * Voice Assistant Integration System
 * Integrates voice assistants (Google Assistant, Alexa, Siri, etc.)
 */

class VoiceAssistantIntegration {
    constructor() {
        this.assistants = new Map();
        this.isListening = false;
        this.recognition = null;
        this.synthesis = null;
        this.init();
    }

    init() {
        this.initializeSpeechAPIs();
        this.setupEventListeners();
    }

    /**
     * Initialize Speech Recognition and Synthesis APIs
     */
    initializeSpeechAPIs() {
        // Speech Recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.handleVoiceCommand(transcript);
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.handleRecognitionError(event.error);
            };

            this.recognition.onend = () => {
                this.isListening = false;
                this.updateListeningUI(false);
            };
        }

        // Speech Synthesis
        if ('speechSynthesis' in window) {
            this.synthesis = window.speechSynthesis;
        }
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeVoiceInterfaces();
        });

        // Keyboard shortcut for voice activation
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'V') {
                e.preventDefault();
                this.toggleListening();
            }
        });
    }

    /**
     * Initialize voice interfaces
     */
    initializeVoiceInterfaces() {
        const containers = document.querySelectorAll('[data-voice-assistant]');
        containers.forEach(container => {
            this.setupVoiceInterface(container);
        });
    }

    /**
     * Setup voice interface
     */
    setupVoiceInterface(container) {
        if (container.querySelector('.voice-assistant-ui')) {
            return;
        }

        const ui = document.createElement('div');
        ui.className = 'voice-assistant-ui';

        ui.innerHTML = `
            <button class="voice-assistant-button" 
                    aria-label="Start voice assistant"
                    data-voice-toggle>
                <span class="voice-icon">🎤</span>
                <span class="voice-status">Click to speak</span>
            </button>
            <div class="voice-transcript" role="status" aria-live="polite"></div>
            <div class="voice-response" role="status" aria-live="polite"></div>
        `;

        container.appendChild(ui);

        const toggleBtn = ui.querySelector('[data-voice-toggle]');
        toggleBtn.addEventListener('click', () => {
            this.toggleListening();
        });
    }

    /**
     * Toggle listening state
     */
    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    /**
     * Start listening
     */
    startListening() {
        if (!this.recognition) {
            this.speak('Speech recognition is not available in your browser.');
            return;
        }

        if (this.isListening) {
            return;
        }

        try {
            this.recognition.start();
            this.isListening = true;
            this.updateListeningUI(true);
        } catch (error) {
            console.error('Error starting recognition:', error);
            this.isListening = false;
        }
    }

    /**
     * Stop listening
     */
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            this.updateListeningUI(false);
        }
    }

    /**
     * Update listening UI
     */
    updateListeningUI(listening) {
        const buttons = document.querySelectorAll('[data-voice-toggle]');
        buttons.forEach(btn => {
            if (listening) {
                btn.classList.add('listening');
                btn.querySelector('.voice-status').textContent = 'Listening...';
            } else {
                btn.classList.remove('listening');
                btn.querySelector('.voice-status').textContent = 'Click to speak';
            }
        });
    }

    /**
     * Handle voice command
     */
    async handleVoiceCommand(transcript) {
        this.updateTranscript(transcript);
        this.updateListeningUI(false);

        // Process command
        const response = await this.processCommand(transcript);
        
        // Display and speak response
        this.updateResponse(response);
        this.speak(response);
    }

    /**
     * Process voice command
     */
    async processCommand(command) {
        const lowerCommand = command.toLowerCase();

        // Navigation commands
        if (lowerCommand.includes('go to') || lowerCommand.includes('navigate to')) {
            const page = this.extractPageName(command);
            if (page) {
                this.navigateToPage(page);
                return `Navigating to ${page}`;
            }
        }

        // Search commands
        if (lowerCommand.includes('search for') || lowerCommand.includes('find')) {
            const query = this.extractSearchQuery(command);
            if (query) {
                this.performSearch(query);
                return `Searching for ${query}`;
            }
        }

        // Action commands
        if (lowerCommand.includes('open')) {
            const item = this.extractItemName(command);
            if (item) {
                this.openItem(item);
                return `Opening ${item}`;
            }
        }

        if (lowerCommand.includes('close')) {
            return 'Closing current item';
        }

        // Information commands
        if (lowerCommand.includes('what is') || lowerCommand.includes('tell me about')) {
            const topic = this.extractTopic(command);
            return `Let me tell you about ${topic}. This feature would integrate with a knowledge base.`;
        }

        // Default response
        return `I heard: "${command}". How can I help you?`;
    }

    /**
     * Extract page name from command
     */
    extractPageName(command) {
        const match = command.match(/(?:go to|navigate to)\s+(.+)/i);
        return match ? match[1].trim() : null;
    }

    /**
     * Extract search query
     */
    extractSearchQuery(command) {
        const match = command.match(/(?:search for|find)\s+(.+)/i);
        return match ? match[1].trim() : null;
    }

    /**
     * Extract item name
     */
    extractItemName(command) {
        const match = command.match(/open\s+(.+)/i);
        return match ? match[1].trim() : null;
    }

    /**
     * Extract topic
     */
    extractTopic(command) {
        const match = command.match(/(?:what is|tell me about)\s+(.+)/i);
        return match ? match[1].trim() : 'that';
    }

    /**
     * Navigate to page
     */
    navigateToPage(page) {
        // This would integrate with your routing system
        const event = new CustomEvent('voiceNavigation', {
            detail: { page },
            bubbles: true
        });
        document.dispatchEvent(event);
    }

    /**
     * Perform search
     */
    performSearch(query) {
        const event = new CustomEvent('voiceSearch', {
            detail: { query },
            bubbles: true
        });
        document.dispatchEvent(event);
    }

    /**
     * Open item
     */
    openItem(item) {
        const event = new CustomEvent('voiceOpen', {
            detail: { item },
            bubbles: true
        });
        document.dispatchEvent(event);
    }

    /**
     * Speak text
     */
    speak(text, options = {}) {
        if (!this.synthesis) {
            console.warn('Speech synthesis not available');
            return;
        }

        const {
            rate = 1.0,
            pitch = 1.0,
            volume = 1.0,
            lang = 'en-US'
        } = options;

        // Cancel any ongoing speech
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;
        utterance.lang = lang;

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
        };

        this.synthesis.speak(utterance);
    }

    /**
     * Update transcript display
     */
    updateTranscript(text) {
        const transcripts = document.querySelectorAll('.voice-transcript');
        transcripts.forEach(transcript => {
            transcript.textContent = `You said: ${text}`;
        });
    }

    /**
     * Update response display
     */
    updateResponse(text) {
        const responses = document.querySelectorAll('.voice-response');
        responses.forEach(response => {
            response.textContent = `Assistant: ${text}`;
        });
    }

    /**
     * Handle recognition error
     */
    handleRecognitionError(error) {
        let message = 'Speech recognition error occurred.';
        
        switch (error) {
            case 'no-speech':
                message = 'No speech detected. Please try again.';
                break;
            case 'audio-capture':
                message = 'No microphone found. Please check your microphone.';
                break;
            case 'not-allowed':
                message = 'Microphone permission denied. Please enable microphone access.';
                break;
            case 'network':
                message = 'Network error. Please check your connection.';
                break;
        }

        this.updateResponse(message);
        this.speak(message);
    }

    /**
     * Set language
     */
    setLanguage(lang) {
        if (this.recognition) {
            this.recognition.lang = lang;
        }
    }

    /**
     * Get available voices
     */
    getAvailableVoices() {
        if (!this.synthesis) {
            return [];
        }

        return this.synthesis.getVoices();
    }

    /**
     * Set voice
     */
    setVoice(voiceName) {
        // This would be used when speaking
        this.selectedVoice = voiceName;
    }
}

// Auto-initialize
const voiceAssistantIntegration = new VoiceAssistantIntegration();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoiceAssistantIntegration;
}
