/**
 * Planet Discovery Game
 * Interactive game to discover new planets
 */

class PlanetDiscoveryGame {
    constructor() {
        this.currentLevel = 1;
        this.score = 0;
        this.discoveredPlanets = [];
        this.gameState = 'menu'; // menu, playing, paused, gameover
        this.isInitialized = false;
        
        this.init();
    }

    init() {
        this.loadGameProgress();
        this.isInitialized = true;
        console.log('🎮 Planet Discovery Game initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_ga_me_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadGameProgress() {
        try {
            const stored = localStorage.getItem('planet-discovery-game-progress');
            if (stored) {
                const progress = JSON.parse(stored);
                this.currentLevel = progress.level || 1;
                this.score = progress.score || 0;
                this.discoveredPlanets = progress.discoveredPlanets || [];
            }
        } catch (error) {
            console.error('Error loading game progress:', error);
        }
    }

    saveGameProgress() {
        try {
            localStorage.setItem('planet-discovery-game-progress', JSON.stringify({
                level: this.currentLevel,
                score: this.score,
                discoveredPlanets: this.discoveredPlanets
            }));
        } catch (error) {
            console.error('Error saving game progress:', error);
        }
    }

    /**
     * Start new game
     */
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.discoveredPlanets = [];
        this.currentLevel = 1;
        this.saveGameProgress();
    }

    /**
     * Discover a planet
     */
    discoverPlanet(planetData) {
        if (this.gameState !== 'playing') return false;

        const planetId = planetData.kepid || `planet-${Date.now()}`;
        
        if (!this.discoveredPlanets.find(p => p.id === planetId)) {
            this.discoveredPlanets.push({
                id: planetId,
                name: planetData.kepler_name || planetData.kepoi_name,
                discoveredAt: new Date().toISOString(),
                points: this.calculatePoints(planetData)
            });

            this.score += this.discoveredPlanets[this.discoveredPlanets.length - 1].points;
            this.saveGameProgress();
            return true;
        }

        return false;
    }

    /**
     * Calculate points for discovering a planet
     */
    calculatePoints(planetData) {
        let points = 100; // Base points

        // Bonus for Earth-like planets
        const radius = parseFloat(planetData.radius) || 1;
        if (radius >= 0.8 && radius <= 1.5) {
            points += 50;
        }

        // Bonus for confirmed planets
        if (planetData.status === 'CONFIRMED' || planetData.status === 'Confirmed Planet') {
            points += 25;
        }

        // Bonus for rare types
        const type = (planetData.type || '').toLowerCase();
        if (type.includes('super') || type.includes('earth')) {
            points += 30;
        }

        return points;
    }

    /**
     * Render game UI
     */
    renderGame(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="planet-discovery-game" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <h3 style="color: #ba944f; margin: 0 0 1.5rem 0;">🎮 Planet Discovery Game</h3>
                
                <div class="game-stats" style="display: flex; justify-content: space-around; margin-bottom: 2rem; padding: 1rem; background: rgba(0, 0, 0, 0.4); border-radius: 10px;">
                    <div>
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">Score</div>
                        <div style="color: #ba944f; font-size: 2rem; font-weight: bold;">${this.score}</div>
                    </div>
                    <div>
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">Level</div>
                        <div style="color: #4a90e2; font-size: 2rem; font-weight: bold;">${this.currentLevel}</div>
                    </div>
                    <div>
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">Discovered</div>
                        <div style="color: #4ade80; font-size: 2rem; font-weight: bold;">${this.discoveredPlanets.length}</div>
                    </div>
                </div>

                ${this.gameState === 'menu' ? this.renderMenu() : ''}
                ${this.gameState === 'playing' ? this.renderGameplay() : ''}
            </div>
        `;

        this.setupGameEventListeners();
    }

    renderMenu() {
        return `
            <div class="game-menu" style="text-align: center;">
                <p style="color: rgba(255, 255, 255, 0.8); margin-bottom: 2rem;">Discover planets and earn points!</p>
                <button id="start-game-btn" class="btn-primary" style="padding: 1rem 2rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600; font-size: 1.1rem;">
                    🚀 Start Game
                </button>
            </div>
        `;
    }

    renderGameplay() {
        return `
            <div class="gameplay-area">
                <p style="color: rgba(255, 255, 255, 0.8); margin-bottom: 1rem;">Explore the database to discover new planets!</p>
                <div class="recent-discoveries" style="margin-top: 1.5rem;">
                    <h4 style="color: #ba944f; margin: 0 0 1rem 0;">Recent Discoveries</h4>
                    ${this.renderRecentDiscoveries()}
                </div>
            </div>
        `;
    }

    renderRecentDiscoveries() {
        if (this.discoveredPlanets.length === 0) {
            return '<p style="color: rgba(255, 255, 255, 0.5);">No planets discovered yet. Start exploring!</p>';
        }

        const recent = this.discoveredPlanets.slice(-5).reverse();
        return recent.map(planet => `
            <div style="padding: 0.75rem; background: rgba(0, 0, 0, 0.3); border-radius: 8px; margin-bottom: 0.5rem;">
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: #e0e0e0;">${planet.name}</span>
                    <span style="color: #4ade80; font-weight: 600;">+${planet.points} pts</span>
                </div>
            </div>
        `).join('');
    }

    setupGameEventListeners() {
        const startBtn = document.getElementById('start-game-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startGame();
                this.renderGame('game-container');
            });
        }
    }
}

// Initialize globally
if (typeof window !== 'undefined') {
    window.PlanetDiscoveryGame = PlanetDiscoveryGame;
    window.planetDiscoveryGame = new PlanetDiscoveryGame();
}

