/**
 * Speech Synthesis
 * Text-to-speech synthesis
 */

class SpeechSynthesis {
    constructor() {
        this.synthesis = null;
        this.init();
    }
    
    init() {
        this.setupSynthesis();
    }
    
    setupSynthesis() {
        // Setup speech synthesis
        if ('speechSynthesis' in window) {
            this.synthesis = window.speechSynthesis;
        }
    }
    
    async speak(text, options = {}) {
        // Speak text
        if (!this.synthesis) {
            throw new Error('Speech synthesis not supported');
        }
        
        return new Promise((resolve) => {
            const utterance = new SpeechSynthesisUtterance(text);
            
            if (options.voice) {
                utterance.voice = options.voice;
            }
            
            if (options.rate) {
                utterance.rate = options.rate;
            }
            
            if (options.pitch) {
                utterance.pitch = options.pitch;
            }
            
            utterance.onend = () => resolve();
            utterance.onerror = () => resolve();
            
            this.synthesis.speak(utterance);
        });
    }
    
    stop() {
        // Stop speech
        if (this.synthesis) {
            this.synthesis.cancel();
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.speechSynthesis = new SpeechSynthesis(); });
} else {
    window.speechSynthesis = new SpeechSynthesis();
}

