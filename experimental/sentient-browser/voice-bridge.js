/**
 * Voice Command Bridge
 * Handles Speech-to-Text (STT) and Text-to-Speech (TTS) for HAL.
 */

class VoiceBridge {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.halEye = document.getElementById('hal-eye');
        this.inputField = document.getElementById('text-input');

        this.initSR();
    }

    initSR() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn("Speech Recognition API not supported.");
            document.getElementById('voice-btn').style.display = 'none';
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.lang = 'en-US';
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
            this.isListening = true;
            document.getElementById('voice-btn').classList.add('active');
            if (this.halEye) this.halEye.classList.add('listening');
            console.log("Listen start");
        };

        this.recognition.onend = () => {
            this.isListening = false;
            document.getElementById('voice-btn').classList.remove('active');
            if (this.halEye) this.halEye.classList.remove('listening');
            console.log("Listen end");
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log("Heard:", transcript);

            if (this.inputField) {
                this.inputField.value = transcript;
                // Auto-submit
                if (window.hal) {
                    window.hal.processInput(transcript);
                    this.inputField.value = '';
                }
            }
        };

        // Setup Button
        const btn = document.getElementById('voice-btn');
        if (btn) {
            btn.addEventListener('click', () => {
                if (this.isListening) {
                    this.recognition.stop();
                } else {
                    this.recognition.start();
                }
            });
        }
    }

    speak(text) {
        if (!this.synthesis) return;

        // Cancel previous
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9; // Slightly slower, more deliberate
        utterance.pitch = 0.8; // Lower pitch

        // Try to find a good voice
        const voices = this.synthesis.getVoices();
        // Prefer "Google US English" or similar standard voices
        const maleVoice = voices.find(v => v.name.includes('Google US English')) || voices.find(v => v.lang === 'en-US');
        if (maleVoice) utterance.voice = maleVoice;

        utterance.onstart = () => {
            if (this.halEye) this.halEye.style.boxShadow = "0 0 80px rgba(255, 50, 50, 0.9)";
        };

        utterance.onend = () => {
            if (this.halEye) this.halEye.style.boxShadow = "";
        };

        this.synthesis.speak(utterance);
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    window.voiceBridge = new VoiceBridge();
});
