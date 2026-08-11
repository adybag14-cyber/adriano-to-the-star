/**
 * Web Speech API v2
 * Enhanced speech recognition and synthesis
 */

class WebSpeechAPIV2 {
    constructor() {
        this.recognition = null;
        this.synthesis = null;
        this.initialized = false;
    }

    /**
     * Initialize Web Speech API v2
     */
    async initialize() {
        if (!this.isSupported()) {
            throw new Error('Web Speech API is not supported');
        }
        this.synthesis = window.speechSynthesis;
        this.initialized = true;
        return { success: true, message: 'Web Speech API v2 initialized' };
    }

    /**
     * Check if Web Speech is supported
     * @returns {boolean}
     */
    isSupported() {
        return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) && 'speechSynthesis' in window;
    }

    /**
     * Start recognition
     * @param {Function} onResult - Result callback
     * @returns {SpeechRecognition}
     */
    startRecognition(onResult) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript;
            onResult(transcript);
            this.trackEvent('speech_recognized', { length: transcript.length });
        };
        this.recognition.onerror = (event) => {
            this.trackEvent('recognition_error', { error: event.error });
        };
        this.recognition.start();
        this.trackEvent('recognition_started');
        return this.recognition;
    }

    /**
     * Speak text
     * @param {string} text - Text to speak
     * @param {Object} options - Speech options
     */
    speak(text, options = {}) {
        const utterance = new SpeechSynthesisUtterance(text);
        Object.assign(utterance, options);
        this.synthesis.speak(utterance);
        this.trackEvent('speech_synthesized', { length: text.length, lang: options.lang || 'en-US' });
    }

    trackEvent(eventName, data = {}) {
        if (window.performanceMonitoring && typeof window.performanceMonitoring.recordMetric === 'function') {
            try {
                window.performanceMonitoring.recordMetric(`speech:${eventName}`, 1, {
                    source: 'web-speech-api-v2',
                    ...data
                });
            } catch (e) {
                console.warn('Failed to record speech event:', e);
            }
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebSpeechAPIV2;
}

