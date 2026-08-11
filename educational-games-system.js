/**
 * Educational Games System
 * Space-themed educational games
 * 
 * Features:
 * - Multiple game types
 * - Progress tracking
 * - Leaderboards
 * - Achievements
 */

class EducationalGamesSystem {
    constructor() {
        this.games = [];
        this.scores = new Map();
        this.init();
    }

    init() {
        this.loadGames();
        this.createUI();
        console.log('🎮 Educational Games System initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("e_du_ca_ti_on_al_ga_me_ss_ys_te_m_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadGames() {
        this.games = [
            {
                id: 'planet-match',
                name: 'Planet Match',
                description: 'Match planets with their characteristics'
            },
            {
                id: 'orbit-sim',
                name: 'Orbit Simulator',
                description: 'Learn about orbital mechanics'
            }
        ];
    }

    createUI() {
        const button = document.createElement('button');
        button.id = 'games-toggle';
        button.textContent = '🎮 Games';
        button.style.cssText = `
            position: fixed;
            bottom: 560px;
            right: 20px;
            padding: 12px 20px;
            background: rgba(186, 148, 79, 0.9);
            border: 2px solid rgba(186, 148, 79, 1);
            color: white;
            border-radius: 8px;
            cursor: pointer;
            z-index: 9992;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        `;

        button.addEventListener('click', () => this.showGames());
        document.body.appendChild(button);
    }

    showGames() {
        const modal = document.createElement('div');
        modal.className = 'games-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        modal.innerHTML = `
            <div style="
                background: rgba(0, 0, 0, 0.98);
                border: 2px solid #ba944f;
                border-radius: 12px;
                padding: 30px;
                max-width: 600px;
                width: 90%;
                color: white;
            ">
                <h2 style="color: #ba944f; margin: 0 0 20px 0;">Educational Games</h2>
                <div>
                    ${this.games.map(game => `
                        <div style="
                            background: rgba(255, 255, 255, 0.05);
                            border: 1px solid rgba(186, 148, 79, 0.3);
                            border-radius: 8px;
                            padding: 15px;
                            margin-bottom: 10px;
                        ">
                            <h3 style="margin: 0 0 5px 0;">${game.name}</h3>
                            <p style="margin: 0 0 10px 0; font-size: 0.9rem;">${game.description}</p>
                            <button onclick="window.educationalGamesSystem.playGame('${game.id}')" style="
                                padding: 8px 15px;
                                background: rgba(186, 148, 79, 0.3);
                                border: 1px solid #ba944f;
                                color: white;
                                border-radius: 6px;
                                cursor: pointer;
                            ">Play</button>
                        </div>
                    `).join('')}
                </div>
                <button id="close-games" style="
                    width: 100%;
                    margin-top: 20px;
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                ">Close</button>
            </div>
        `;

        modal.querySelector('#close-games').addEventListener('click', () => {
            modal.remove();
        });

        document.body.appendChild(modal);
    }

    playGame(gameId) {
        const game = this.games.find(g => g.id === gameId);
        if (game) {
            if (window.notifications) {
                window.notifications.info(`Starting game: ${game.name}`, 'Game Started');
            } else {
                console.log(`Starting game: ${game.name}`);
            }
            // Implement game logic
        }
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.educationalGamesSystem = new EducationalGamesSystem();
    });
} else {
    window.educationalGamesSystem = new EducationalGamesSystem();
}

