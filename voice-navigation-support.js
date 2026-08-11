/**
 * Voice Navigation Support
 * Support voice navigation
 */
(function() {
    'use strict';

    class VoiceNavigationSupport {
        constructor() {
            this.recognition = null;
            this.init();
        }

        init() {
            this.setupUI();
            this.setupVoiceRecognition();
        }

        setupUI() {
            if (!document.getElementById('voice-navigation')) {
                const voice = document.createElement('div');
                voice.id = 'voice-navigation';
                voice.className = 'voice-navigation';
                voice.innerHTML = `
                    <button id="start-voice">Start Voice Navigation</button>
                `;
                document.body.appendChild(voice);
            }

            document.getElementById('start-voice')?.addEventListener('click', () => {
                this.startRecognition();
            });
        }

        setupVoiceRecognition() {
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                this.recognition = new SpeechRecognition();
                this.recognition.continuous = true;
                this.recognition.interimResults = false;

                this.recognition.onresult = (event) => {
                    const command = event.results[event.results.length - 1][0].transcript.toLowerCase();
                    this.processVoiceCommand(command);
                };
            }
        }

        startRecognition() {
            if (this.recognition) {
                this.recognition.start();
            }
        }

        processVoiceCommand(command) {
            if (command.includes('click') || command.includes('select')) {
                const element = document.activeElement;
                if (element) {
                    element.click();
                }
            } else if (command.includes('next')) {
                this.navigateNext();
            } else if (command.includes('previous')) {
                this.navigatePrevious();
            }
        }

        navigateNext() {
            const focusable = document.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
            const currentIndex = Array.from(focusable).indexOf(document.activeElement);
            if (currentIndex < focusable.length - 1) {
                focusable[currentIndex + 1].focus();
            }
        }

        navigatePrevious() {
            const focusable = document.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
            const currentIndex = Array.from(focusable).indexOf(document.activeElement);
            if (currentIndex > 0) {
                focusable[currentIndex - 1].focus();
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.voiceNavigation = new VoiceNavigationSupport();
        });
    } else {
        window.voiceNavigation = new VoiceNavigationSupport();
    }
})();

