/**
 * Speech-to-Text and Text-to-Speech System
 * Provides comprehensive STT and TTS capabilities
 */

class SpeechToTextTextToSpeech {
    constructor() {
        this.recognition = null;
        this.synthesis = null;
        this.isListening = false;
        this.isSpeaking = false;
        this.transcripts = [];
        this.init();
    }

    init() {
        this.initializeSpeechAPIs();
        this.setupEventListeners();
    }

    /**
     * Initialize Speech Recognition and Synthesis
     */
    initializeSpeechAPIs() {
        // Speech Recognition (STT)
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.isListening = true;
                this.onListeningStart();
            };

            this.recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }

                this.onTranscript(finalTranscript, interimTranscript);
            };

            this.recognition.onerror = (event) => {
                this.onRecognitionError(event.error);
            };

            this.recognition.onend = () => {
                this.isListening = false;
                this.onListeningEnd();
            };
        }

        // Speech Synthesis (TTS)
        if ('speechSynthesis' in window) {
            this.synthesis = window.speechSynthesis;
        }
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeInterfaces();
        });
    }

    /**
     * Initialize STT/TTS interfaces
     */
    initializeInterfaces() {
        // STT interfaces
        const sttContainers = document.querySelectorAll('[data-stt]');
        sttContainers.forEach(container => {
            this.setupSTTInterface(container);
        });

        // TTS interfaces
        const ttsContainers = document.querySelectorAll('[data-tts]');
        ttsContainers.forEach(container => {
            this.setupTTSInterface(container);
        });
    }

    /**
     * Setup Speech-to-Text interface
     */
    setupSTTInterface(container) {
        if (container.querySelector('.stt-interface')) {
            return;
        }

        const ui = document.createElement('div');
        ui.className = 'stt-interface';

        ui.innerHTML = `
            <button class="stt-toggle-btn" 
                    data-stt-toggle
                    aria-label="Toggle speech recognition">
                <span class="stt-icon">🎤</span>
                <span class="stt-status">Start Listening</span>
            </button>
            <div class="stt-transcript-container">
                <div class="stt-transcript-final" role="log" aria-live="polite"></div>
                <div class="stt-transcript-interim" role="status" aria-live="polite"></div>
            </div>
            <div class="stt-controls">
                <button class="stt-clear-btn" data-stt-clear>Clear</button>
                <button class="stt-copy-btn" data-stt-copy>Copy</button>
                <button class="stt-download-btn" data-stt-download>Download</button>
            </div>
        `;

        container.appendChild(ui);

        // Event listeners
        const toggleBtn = ui.querySelector('[data-stt-toggle]');
        toggleBtn.addEventListener('click', () => {
            this.toggleListening();
        });

        ui.querySelector('[data-stt-clear]').addEventListener('click', () => {
            this.clearTranscript();
        });

        ui.querySelector('[data-stt-copy]').addEventListener('click', () => {
            this.copyTranscript();
        });

        ui.querySelector('[data-stt-download]').addEventListener('click', () => {
            this.downloadTranscript();
        });
    }

    /**
     * Setup Text-to-Speech interface
     */
    setupTTSInterface(container) {
        if (container.querySelector('.tts-interface')) {
            return;
        }

        const ui = document.createElement('div');
        ui.className = 'tts-interface';

        ui.innerHTML = `
            <textarea class="tts-input" 
                      placeholder="Enter text to speak..."
                      data-tts-input
                      aria-label="Text to speak"></textarea>
            <div class="tts-controls">
                <button class="tts-speak-btn" data-tts-speak>Speak</button>
                <button class="tts-stop-btn" data-tts-stop>Stop</button>
                <select class="tts-voice-select" data-tts-voice aria-label="Select voice">
                    <option value="">Default Voice</option>
                </select>
                <label>
                    Rate: <input type="range" class="tts-rate" data-tts-rate min="0.5" max="2" step="0.1" value="1">
                    <span class="tts-rate-value">1.0</span>
                </label>
                <label>
                    Pitch: <input type="range" class="tts-pitch" data-tts-pitch min="0" max="2" step="0.1" value="1">
                    <span class="tts-pitch-value">1.0</span>
                </label>
                <label>
                    Volume: <input type="range" class="tts-volume" data-tts-volume min="0" max="1" step="0.1" value="1">
                    <span class="tts-volume-value">1.0</span>
                </label>
            </div>
        `;

        container.appendChild(ui);

        // Populate voices
        this.populateVoices(ui);

        // Event listeners
        ui.querySelector('[data-tts-speak]').addEventListener('click', () => {
            const text = ui.querySelector('[data-tts-input]').value;
            if (text) {
                this.speakText(text, this.getTTSOptions(ui));
            }
        });

        ui.querySelector('[data-tts-stop]').addEventListener('click', () => {
            this.stopSpeaking();
        });

        // Update value displays
        ui.querySelector('[data-tts-rate]').addEventListener('input', (e) => {
            ui.querySelector('.tts-rate-value').textContent = e.target.value;
        });

        ui.querySelector('[data-tts-pitch]').addEventListener('input', (e) => {
            ui.querySelector('.tts-pitch-value').textContent = e.target.value;
        });

        ui.querySelector('[data-tts-volume]').addEventListener('input', (e) => {
            ui.querySelector('.tts-volume-value').textContent = e.target.value;
        });
    }

    /**
     * Populate voice options
     */
    populateVoices(ui) {
        if (!this.synthesis) return;

        const voiceSelect = ui.querySelector('[data-tts-voice]');
        const voices = this.synthesis.getVoices();

        voices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
        });

        // Reload voices when they become available
        this.synthesis.onvoiceschanged = () => {
            this.populateVoices(ui);
        };
    }

    /**
     * Get TTS options from UI
     */
    getTTSOptions(ui) {
        const voiceSelect = ui.querySelector('[data-tts-voice]');
        const rateInput = ui.querySelector('[data-tts-rate]');
        const pitchInput = ui.querySelector('[data-tts-pitch]');
        const volumeInput = ui.querySelector('[data-tts-volume]');

        const options = {
            rate: parseFloat(rateInput.value),
            pitch: parseFloat(pitchInput.value),
            volume: parseFloat(volumeInput.value)
        };

        if (voiceSelect.value) {
            const voices = this.synthesis.getVoices();
            options.voice = voices[parseInt(voiceSelect.value)];
        }

        return options;
    }

    /**
     * Toggle listening
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
            alert('Speech recognition is not available in your browser.');
            return;
        }

        try {
            this.recognition.start();
        } catch (error) {
            console.error('Error starting recognition:', error);
        }
    }

    /**
     * Stop listening
     */
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    /**
     * On listening start
     */
    onListeningStart() {
        const buttons = document.querySelectorAll('[data-stt-toggle]');
        buttons.forEach(btn => {
            btn.classList.add('listening');
            btn.querySelector('.stt-status').textContent = 'Listening...';
        });
    }

    /**
     * On listening end
     */
    onListeningEnd() {
        const buttons = document.querySelectorAll('[data-stt-toggle]');
        buttons.forEach(btn => {
            btn.classList.remove('listening');
            btn.querySelector('.stt-status').textContent = 'Start Listening';
        });
    }

    /**
     * On transcript update
     */
    onTranscript(final, interim) {
        const finalContainers = document.querySelectorAll('.stt-transcript-final');
        const interimContainers = document.querySelectorAll('.stt-transcript-interim');

        if (final) {
            this.transcripts.push(final.trim());
            finalContainers.forEach(container => {
                container.textContent += final;
            });
        }

        interimContainers.forEach(container => {
            container.textContent = interim;
        });
    }

    /**
     * On recognition error
     */
    onRecognitionError(error) {
        console.error('Recognition error:', error);
        const errorMsg = this.getErrorMessage(error);
        
        const containers = document.querySelectorAll('.stt-transcript-interim');
        containers.forEach(container => {
            container.textContent = `Error: ${errorMsg}`;
        });
    }

    /**
     * Get error message
     */
    getErrorMessage(error) {
        const messages = {
            'no-speech': 'No speech detected',
            'audio-capture': 'No microphone found',
            'not-allowed': 'Microphone permission denied',
            'network': 'Network error',
            'aborted': 'Recognition aborted'
        };
        return messages[error] || 'Unknown error';
    }

    /**
     * Speak text
     */
    speakText(text, options = {}) {
        if (!this.synthesis) {
            alert('Text-to-speech is not available in your browser.');
            return;
        }

        this.stopSpeaking();

        const {
            rate = 1.0,
            pitch = 1.0,
            volume = 1.0,
            voice = null,
            lang = 'en-US'
        } = options;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;
        utterance.lang = lang;

        if (voice) {
            utterance.voice = voice;
        }

        utterance.onstart = () => {
            this.isSpeaking = true;
        };

        utterance.onend = () => {
            this.isSpeaking = false;
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
            this.isSpeaking = false;
        };

        this.synthesis.speak(utterance);
    }

    /**
     * Stop speaking
     */
    stopSpeaking() {
        if (this.synthesis && this.isSpeaking) {
            this.synthesis.cancel();
            this.isSpeaking = false;
        }
    }

    /**
     * Clear transcript
     */
    clearTranscript() {
        this.transcripts = [];
        const containers = document.querySelectorAll('.stt-transcript-final, .stt-transcript-interim');
        containers.forEach(container => {
            container.textContent = '';
        });
    }

    /**
     * Copy transcript
     */
    copyTranscript() {
        const fullTranscript = this.transcripts.join(' ');
        if (fullTranscript) {
            navigator.clipboard.writeText(fullTranscript).then(() => {
                alert('Transcript copied to clipboard');
            });
        }
    }

    /**
     * Download transcript
     */
    downloadTranscript() {
        const fullTranscript = this.transcripts.join(' ');
        if (!fullTranscript) {
            return;
        }

        const blob = new Blob([fullTranscript], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcript-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Set language for recognition
     */
    setRecognitionLanguage(lang) {
        if (this.recognition) {
            this.recognition.lang = lang;
        }
    }
}

// Auto-initialize
const speechToTextTextToSpeech = new SpeechToTextTextToSpeech();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpeechToTextTextToSpeech;
}
