/**
 * Voice Recognition
 * Voice recognition and speech-to-text
 */

class VoiceRecognition {
    constructor() {
        this.recognition = null;
        this.init();
    }
    
    init() {
        this.setupRecognition();
    }
    
    setupRecognition() {
        // Setup voice recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
        }
    }
    
    async startRecognition() {
        // Start voice recognition
        if (!this.recognition) {
            throw new Error('Speech recognition not supported');
        }
        
        return new Promise((resolve, reject) => {
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                resolve(transcript);
            };
            
            this.recognition.onerror = (event) => {
                reject(event.error);
            };
            
            this.recognition.start();
        });
    }
    
    stopRecognition() {
        // Stop voice recognition
        if (this.recognition) {
            this.recognition.stop();
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.voiceRecognition = new VoiceRecognition(); });
} else {
    window.voiceRecognition = new VoiceRecognition();
}

