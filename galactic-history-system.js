/**
 * Galactic History System
 * Records major events and generates a living history of the universe.
 * Acts as the "News Network" for the game.
 */

class GalacticHistorySystem {
    constructor() {
        this.eventsLog = [];
        this.newsTickerActive = false;

        // Listen to global events
        this.initEventListeners();
    }

    initEventListeners() {
        // Hook into GalacticEventsManager if available
        // We poll or override the method, or use a custom event bus if we had one.
        // For now, we'll expose a 'recordEvent' method that other systems call.

        window.recordGalacticHistory = (title, type, description) => {
            this.addEvent(title, type, description);
        };

        // Example: Hook into console for debug
        console.log('📜 Galactic History System observing universe...');
    }

    addEvent(title, type, description) {
        const event = {
            id: 'hist_' + Date.now(),
            timestamp: Date.now(),
            gameYear: 2305 + Math.floor((Date.now() - 1700000000000) / 10000000), // Mock game year
            title,
            type, // 'WAR', 'DISCOVERY', 'POLITICS', 'CATASTROPHE'
            description
        };

        this.eventsLog.unshift(event); // Newest first
        console.log(`📜 HISTORY RECORDED: [${event.gameYear}] ${title}`);

        this.showNewsTicker(event);
    }

    showNewsTicker(event) {
        let ticker = document.getElementById('galactic-news-ticker');

        if (!ticker) {
            ticker = document.createElement('div');
            ticker.id = 'galactic-news-ticker';
            ticker.style.cssText = `
                position: fixed; bottom: 0; left: 0; width: 100%;
                background: linear-gradient(90deg, #000, #1a0b00, #000);
                border-top: 1px solid #ff4400;
                color: #ffcc00;
                font-family: 'Courier New', monospace;
                padding: 0.5rem;
                font-size: 1rem;
                white-space: nowrap;
                overflow: hidden;
                z-index: 9999;
                display:flex; justify-content: center;
                box-shadow: 0 -5px 15px rgba(0,0,0,0.5);
                opacity: 0; transition: opacity 0.5s;
            `;
            document.body.appendChild(ticker);
        }

        // Set text
        ticker.innerHTML = `<span style="color:#ff4400; font-weight:bold; margin-right:1rem;">BREAKING NEWS:</span> ${event.title} - ${event.description}`;

        // Animate In
        ticker.style.opacity = '1';

        // Auto hide after 8 seconds
        setTimeout(() => {
            ticker.style.opacity = '0';
        }, 8000);
    }
}

// Initialize
if (typeof window !== 'undefined') {
    window.GalacticHistorySystem = GalacticHistorySystem;
    window.galacticHistorySystem = new GalacticHistorySystem();

    // Test Event
    setTimeout(() => {
        window.recordGalacticHistory("First Contact Confirmed", "DISCOVERY", "Explorers in the Alpha Centauri sector report contact with a sentient crystalline species.");
    }, 5000);
}
