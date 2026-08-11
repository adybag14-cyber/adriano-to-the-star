/**
 * AIHistorian.js
 * "The Chronicler" - Generates narrative logs and news highlights from game events.
 * Simulates an AI constructing a history of the player's civilization.
 */

class AIHistorian {
    constructor(game) {
        this.game = game;
        this.logs = [];
        this.newsTicker = [];
    }

    init() {
        // Initial log
        this.logEvent("Simulation initialized. Subject: 'The Pioneer'.");
        this.myths = []; // Roadmap Item 129: Myths and Legends
    }

    logEvent(message, type = 'normal') {
        const now = new Date();
        const timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        const entry = `[${timestamp}] ${message}`;
        this.logs.unshift(entry); // Newest first

        // Update Log UI if it exists
        this.updateLogUI();

        // Chance to generate a "News Headline"
        if (Math.random() > 0.7 || type === 'major') {
            this.generateNews(message);
        }

        // Roadmap Item 129: Procedural Myths
        if (type === 'major' && Math.random() < 0.3) {
            this.generateMyth(message);
        }
    }

    generateMyth(eventContext) {
        const archetypes = ['The Great Descent', 'The Star-Bringer', 'The Void Shadow', 'The First Spark'];
        const archetype = archetypes[Math.floor(Math.random() * archetypes.length)];
        const myth = `Legend of ${archetype}: Derived from the event "${eventContext}". Pioneers whisper of its deeper meaning.`;
        this.myths.push(myth);
        this.game.notify("📜 MYTHOS: A new colonial legend has emerged among the pioneers.", "info");
    }

    generateNews(context) {
        const headlines = [
            `Breaking: ${context}`,
            `Galactic Geographic: ${context}`,
            `Historians Note: ${context}`,
            `Rumor Mill: ${context}`
        ];
        const headline = headlines[Math.floor(Math.random() * headlines.length)];
        this.newsTicker.unshift(headline);

        // Update News UI
        this.updateNewsUI();
    }

    updateLogUI() {
        const logContainer = document.getElementById('historian-log');
        if (logContainer) {
            logContainer.innerHTML = this.logs.slice(0, 10).map(l => `<div>${l}</div>`).join('');
        }
    }

    updateNewsUI() {
        const newsContainer = document.getElementById('historian-news');
        if (newsContainer) {
            // Marquee style or list
            newsContainer.innerHTML = this.newsTicker.slice(0, 3).map(n => `<div style="color: #0ff; margin-bottom: 5px;">${n}</div>`).join('');
        }
    }
}

window.AIHistorian = AIHistorian;
