/**
 * Stellar Guide (AI Tutor)
 * Provides contextual help and simplifications for education modules.
 */
class StellarGuide {
    constructor() {
        this.isThinking = false;
        this.init();
    }

    init() {
        // Any setup needed
    }

    /**
     * Get help for a specific topic
     * @param {string} topic - The topic to explain
     * @param {string} mode - 'simplify', 'analogy', 'deep-dive'
     */
    async getHelp(topic, mode = 'simplify') {
        this.isThinking = true;

        // Simulate API delay
        await new Promise(r => setTimeout(r, 1500));

        this.isThinking = false;

        // Mock Responses (In production, call OpenAI/Gemini API)
        const responses = {
            'Exoplanets': {
                'simplify': "Think of them as cousins to Earth, Mars, and Jupiter, but they live in a different neighborhood (around another star).",
                'analogy': "If our Solar System is a house, Exoplanets are the houses down the street.",
                'deep-dive': "Exoplanets are planetary bodies orbiting stars other than the Sun. They are detected mainly via Transit Photometry and Radial Velocity methods."
            },
            'Gravity': {
                'simplify': "Gravity is the invisible glue that holds the universe together. It pulls everything with mass towards everything else.",
                'analogy': "Imagine a bowling ball on a mattress. It curves the mattress so marbles roll towards it. That's how stars pull planets!",
                'deep-dive': "Gravity is a fundamental interaction which causes mutual attraction between all things with mass or energy."
            },
            'Transit Method': {
                'simplify': "It's like seeing a shadow pass in front of a lightbulb. If the light gets dimmer, something (a planet) is blocking it.",
                'analogy': "Like a bug flying in front of a street lamp.",
                'deep-dive': "The transit method detects exoplanets by monitoring the periodic dimming of a star's flux as a planet passes between the star and the observer."
            }
        };

        // Fuzzy match or default
        const keys = Object.keys(responses);
        const match = keys.find(k => topic.includes(k) || k.includes(topic));

        if (match && responses[match][mode]) {
            return responses[match][mode];
        }

        return `I'm analyzing the data on "${topic}". It seems to be a complex celestial phenomenon. I recommend checking the glossary!`;
    }

    /**
     * Render the Help Widget
     */
    renderWidget(containerId, topic) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="stellar-guide-widget" style="margin-top: 20px; background: rgba(50,50,80,0.5); border: 1px solid #6366f1; border-radius: 8px; padding: 15px;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <div style="background: #6366f1; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">🤖</div>
                    <strong style="color: #a5b4fc;">Stellar Guide</strong>
                </div>
                <p id="sg-output" style="color: #e0e7ff; font-style: italic; margin-bottom: 15px;">
                    "I'm here to help! What do you need to know about ${topic}?"
                </p>
                <div style="display: flex; gap: 8px;">
                    <button onclick="window.stellarGuide.ask('${topic}', 'simplify')" style="padding: 6px 12px; background: #4f46e5; border: none; border-radius: 4px; color: white; cursor: pointer;">Simplify</button>
                    <button onclick="window.stellarGuide.ask('${topic}', 'analogy')" style="padding: 6px 12px; background: #4f46e5; border: none; border-radius: 4px; color: white; cursor: pointer;">Give Analogy</button>
                    <button onclick="window.stellarGuide.ask('${topic}', 'deep-dive')" style="padding: 6px 12px; background: #4f46e5; border: none; border-radius: 4px; color: white; cursor: pointer;">Deep Dive</button>
                </div>
            </div>
        `;
    }

    async ask(topic, mode) {
        const out = document.getElementById('sg-output');
        if (out) out.innerHTML = 'Thinking... <span class="blink">_</span>';

        const response = await this.getHelp(topic, mode);

        if (out) out.innerHTML = `"${response}"`;
    }
}

window.StellarGuide = StellarGuide;
window.stellarGuide = new StellarGuide();
