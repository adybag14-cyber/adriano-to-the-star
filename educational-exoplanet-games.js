/**
 * Educational Games for Learning About Exoplanets
 * Interactive games to make learning fun
 */

class EducationalExoplanetGames {
    constructor() {
        this.games = [];
        this.scores = [];
        this.currentUser = null;
        this.isInitialized = false;
        
        this.init();
    }

    async init() {
        if (window.supabase) {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (user) {
                this.currentUser = user;
            }
        }

        this.initializeGames();
        this.loadData();

        this.isInitialized = true;
        console.log('🎮 Educational Exoplanet Games initialized');
    }

    initializeGames() {
        this.games = [
            {
                id: 'planet-match',
                title: 'Planet Match',
                description: 'Match planets with their characteristics.',
                type: 'matching',
                difficulty: 'beginner'
            },
            {
                id: 'discovery-quiz',
                title: 'Discovery Quiz',
                description: 'Test your knowledge of exoplanet discovery methods.',
                type: 'quiz',
                difficulty: 'intermediate'
            },
            {
                id: 'orbit-simulator',
                title: 'Orbit Simulator',
                description: 'Create stable orbits and learn about orbital mechanics.',
                type: 'simulation',
                difficulty: 'advanced'
            },
            {
                id: 'planet-builder',
                title: 'Planet Builder',
                description: 'Build your own planet and see if it\'s habitable.',
                type: 'builder',
                difficulty: 'intermediate'
            },
            {
                id: 'constellation-finder',
                title: 'Constellation Finder',
                description: 'Find exoplanets in different constellations.',
                type: 'puzzle',
                difficulty: 'beginner'
            }
        ];
    }

    loadData() {
        try {
            const scoresData = localStorage.getItem('exoplanet-game-scores');
            if (scoresData) {
                this.scores = JSON.parse(scoresData);
            }
        } catch (error) {
            console.error('Error loading game data:', error);
        }
    }

    saveData() {
        try {
            localStorage.setItem('exoplanet-game-scores', JSON.stringify(this.scores));
        } catch (error) {
            console.error('Error saving game data:', error);
        }
    }

    /**
     * Submit game score
     */
    submitScore(gameId, score, time = 0, accuracy = 0) {
        const gameScore = {
            id: `score-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            gameId: gameId,
            userId: this.currentUser?.id || 'guest',
            userName: this.currentUser?.email || 'Guest',
            score: score,
            time: time,
            accuracy: accuracy,
            playedAt: new Date().toISOString()
        };

        this.scores.push(gameScore);
        this.saveData();

        // Save to Supabase if available
        if (window.supabase && this.currentUser) {
            try {
                window.supabase
                    .from('game_scores')
                    .insert({
                        score_id: gameScore.id,
                        game_id: gameId,
                        user_id: this.currentUser.id,
                        score: score,
                        time: time,
                        accuracy: accuracy,
                        played_at: gameScore.playedAt
                    });
            } catch (error) {
                console.error('Error saving score to Supabase:', error);
            }
        }

        return gameScore;
    }

    /**
     * Get leaderboard for a game
     */
    getLeaderboard(gameId, limit = 10) {
        return this.scores
            .filter(s => s.gameId === gameId)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    /**
     * Get user's best score
     */
    getUserBestScore(gameId) {
        if (!this.currentUser) return null;
        
        const userScores = this.scores.filter(s => 
            s.gameId === gameId && s.userId === this.currentUser.id
        );

        if (userScores.length === 0) return null;

        return userScores.reduce((best, current) => 
            current.score > best.score ? current : best
        );
    }

    /**
     * Get all games
     */
    getAllGames() {
        return this.games;
    }

    /**
     * Get game by ID
     */
    getGame(gameId) {
        return this.games.find(g => g.id === gameId);
    }
}

if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (!window.educationalExoplanetGames) {
            window.educationalExoplanetGames = new EducationalExoplanetGames();
        }
    });
}

