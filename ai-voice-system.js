/**
 * AI Voice Acting System
 * Phase 6: The Architect's Burden Campaign
 * Provides dynamic Text-to-Speech narration for the campaign.
 */

class AIVoiceSystem {
    constructor() {
        this.enabled = 'speechSynthesis' in window;
        this.voices = [];
        this.personas = {
            'Architect': { lang: 'en-GB', pitch: 0.8, rate: 0.9 }, // Serious, deep
            'Construct': { lang: 'en-US', pitch: 1.2, rate: 1.1 }, // Robotic, fast
            'Human': { lang: 'en-US', pitch: 1.0, rate: 1.0 }     // Normal
        };

        if (this.enabled) {
            window.speechSynthesis.onvoiceschanged = () => {
                this.voices = window.speechSynthesis.getVoices();
            };
        }
    }

    init() {
        console.log(`🗣️ AI Voice System: ${this.enabled ? 'ONLINE' : 'UNAVAILABLE'}`);
    }

    speak(text, personaName = 'Architect') {
        if (!this.enabled) {
            console.log(`[${personaName}]: ${text}`);
            return;
        }

        // Cancel previous speech to allow interruptions (more game-like)
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        const persona = this.personas[personaName] || this.personas['Human'];

        // Find suitable voice
        // This is a rough heuristic as browser voices vary wildly
        const preferredVoice = this.voices.find(v => v.lang.includes(persona.lang) && (personaName === 'Architect' ? v.name.includes('Male') : true));

        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.pitch = persona.pitch;
        utterance.rate = persona.rate;
        utterance.volume = 1.0;

        console.log(`🔊 [${personaName}]: "${text}"`);
        window.speechSynthesis.speak(utterance);
    }

    stop() {
        if (this.enabled) window.speechSynthesis.cancel();
    }
}

if (typeof window !== 'undefined') {
    window.AIVoiceSystem = AIVoiceSystem;
    window.aiVoiceSystem = new AIVoiceSystem();
}
