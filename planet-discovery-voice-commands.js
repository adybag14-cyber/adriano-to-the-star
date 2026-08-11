/**
 * Planet Discovery Voice Commands
 * Voice control for navigating and interacting with the planet database
 */

class PlanetDiscoveryVoiceCommands {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.commands = this.initializeCommands();
        this.init();
    }

    init() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.setupRecognition();
            console.log('🎤 Voice commands initialized');
        } else {
            console.warn('Speech recognition not supported in this browser');
        }

        this.trackEvent('initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_vo_ic_ec_om_ma_nd_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    setupRecognition() {
        if (!this.recognition) return;

        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateListeningUI(true);
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.updateListeningUI(false);
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase().trim();
            this.processCommand(transcript);
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            this.updateListeningUI(false);
        };
    }

    initializeCommands() {
        return {
            'search': {
                patterns: ['search for', 'find', 'show me', 'look for'],
                action: (query) => this.searchPlanets(query)
            },
            'claim': {
                patterns: ['claim', 'claim planet', 'claim this planet'],
                action: (query) => this.claimCurrentPlanet()
            },
            'compare': {
                patterns: ['compare', 'compare planets', 'show comparison'],
                action: () => this.showComparison()
            },
            'favorites': {
                patterns: ['show favorites', 'my favorites', 'favorite planets'],
                action: () => this.showFavorites()
            },
            'wishlist': {
                patterns: ['show wishlist', 'my wishlist', 'wishlist'],
                action: () => this.showWishlist()
            },
            'bookmarks': {
                patterns: ['show bookmarks', 'my bookmarks', 'bookmarks'],
                action: () => this.showBookmarks()
            },
            'statistics': {
                patterns: ['show statistics', 'statistics', 'stats'],
                action: () => this.showStatistics()
            },
            'leaderboard': {
                patterns: ['show leaderboard', 'leaderboard', 'rankings'],
                action: () => this.showLeaderboard()
            },
            'help': {
                patterns: ['help', 'what can you do', 'commands', 'voice commands'],
                action: () => this.showHelp()
            },
            'next': {
                patterns: ['next', 'next page', 'next results'],
                action: () => this.navigateNext()
            },
            'previous': {
                patterns: ['previous', 'back', 'go back'],
                action: () => this.navigatePrevious()
            }
        };
    }

    startListening() {
        if (!this.recognition) {
            alert('Voice recognition not supported in your browser');
            return false;
        }

        if (this.isListening) {
            this.stopListening();
            return false;
        }

        try {
            this.recognition.start();
            return true;
        } catch (error) {
            console.error('Error starting recognition:', error);
            return false;
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    }

    processCommand(transcript) {
        console.log('Processing voice command:', transcript);

        // Try to match command
        for (const [commandName, command] of Object.entries(this.commands)) {
            for (const pattern of command.patterns) {
                if (transcript.includes(pattern)) {
                    // Extract query if needed
                    const query = transcript.replace(pattern, '').trim();
                    command.action(query);
                    this.showFeedback(`Executed: ${commandName}`);
                    return;
                }
            }
        }

        // If no command matched, try to search
        if (transcript.length > 2) {
            this.searchPlanets(transcript);
        } else {
            this.showFeedback('Command not recognized. Say "help" for available commands.');
        }
    }

    searchPlanets(query) {
        const searchInput = document.getElementById('planet-search');
        if (searchInput) {
            searchInput.value = query;
            searchInput.dispatchEvent(new Event('input'));
            this.showFeedback(`Searching for: ${query}`);
        } else {
            this.showFeedback('Search not available on this page');
        }
    }

    claimCurrentPlanet() {
        // Try to find the currently viewed planet
        const claimButton = document.querySelector('.claim-button:not([disabled])');
        if (claimButton) {
            claimButton.click();
            this.showFeedback('Planet claimed!');
        } else {
            this.showFeedback('No planet available to claim');
        }
    }

    showComparison() {
        const comparisonContainer = document.getElementById('comparison-tool-container');
        if (comparisonContainer) {
            comparisonContainer.scrollIntoView({ behavior: 'smooth' });
            this.showFeedback('Showing comparison tool');
        } else {
            this.showFeedback('Comparison tool not available');
        }
    }

    showFavorites() {
        // Navigate to favorites or show favorites section
        if (window.location.pathname.includes('database.html')) {
            const favorites = document.querySelector('[data-favorites]');
            if (favorites) {
                favorites.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            window.location.href = 'database.html#favorites';
        }
        this.showFeedback('Showing favorites');
    }

    showWishlist() {
        const wishlistContainer = document.getElementById('wishlist-container');
        if (wishlistContainer) {
            wishlistContainer.scrollIntoView({ behavior: 'smooth' });
            this.showFeedback('Showing wishlist');
        } else {
            this.showFeedback('Wishlist not available');
        }
    }

    showBookmarks() {
        const bookmarksContainer = document.getElementById('bookmarks-container');
        if (bookmarksContainer) {
            bookmarksContainer.scrollIntoView({ behavior: 'smooth' });
            this.showFeedback('Showing bookmarks');
        } else {
            this.showFeedback('Bookmarks not available');
        }
    }

    showStatistics() {
        const statsContainer = document.getElementById('discovery-statistics-container');
        if (statsContainer) {
            statsContainer.scrollIntoView({ behavior: 'smooth' });
            this.showFeedback('Showing statistics');
        } else {
            window.location.href = 'analytics-dashboard.html';
        }
    }

    showLeaderboard() {
        const leaderboardContainer = document.getElementById('leaderboard-container');
        if (leaderboardContainer) {
            leaderboardContainer.scrollIntoView({ behavior: 'smooth' });
            this.showFeedback('Showing leaderboard');
        } else {
            window.location.href = 'dashboard.html#leaderboard';
        }
    }

    showHelp() {
        const commandsList = Object.keys(this.commands).join(', ');
        const helpText = `Available voice commands: ${commandsList}. You can also say any planet name to search for it.`;
        this.showFeedback(helpText, 5000);
    }

    navigateNext() {
        const nextButton = document.getElementById('next-page');
        if (nextButton && !nextButton.disabled) {
            nextButton.click();
            this.showFeedback('Next page');
        } else {
            this.showFeedback('No next page available');
        }
    }

    navigatePrevious() {
        const prevButton = document.getElementById('prev-page');
        if (prevButton && !prevButton.disabled) {
            prevButton.click();
            this.showFeedback('Previous page');
        } else {
            this.showFeedback('No previous page available');
        }
    }

    showFeedback(message, duration = 2000) {
        // Remove existing feedback
        const existing = document.getElementById('voice-feedback');
        if (existing) {
            existing.remove();
        }

        const feedback = document.createElement('div');
        feedback.id = 'voice-feedback';
        feedback.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid rgba(186, 148, 79, 0.5);
            border-radius: 10px;
            padding: 1rem 2rem;
            color: #ba944f;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            animation: slideUp 0.3s ease;
        `;
        feedback.textContent = message;

        document.body.appendChild(feedback);

        setTimeout(() => {
            feedback.style.opacity = '0';
            feedback.style.transition = 'opacity 0.3s';
            setTimeout(() => feedback.remove(), 300);
        }, duration);
    }

    updateListeningUI(isListening) {
        const button = document.getElementById('voice-command-button');
        if (button) {
            if (isListening) {
                button.style.background = 'rgba(239, 68, 68, 0.3)';
                button.textContent = '🎤 Listening...';
            } else {
                button.style.background = 'rgba(186, 148, 79, 0.2)';
                button.textContent = '🎤 Voice Commands';
            }
        }
    }

    renderVoiceControl(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        if (!this.recognition) {
            container.innerHTML = `
                <div style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 1.5rem; text-align: center;">
                    <p style="color: rgba(255, 255, 255, 0.7);">Voice commands not supported in this browser</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="voice-controls" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 1.5rem;">
                <h3 style="color: #ba944f; margin-bottom: 1rem; text-align: center;">🎤 Voice Commands</h3>
                
                <button id="voice-command-button" style="width: 100%; padding: 1rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600; font-size: 1.1rem; margin-bottom: 1rem;">
                    🎤 Voice Commands
                </button>
                
                <div style="margin-top: 1rem; padding: 1rem; background: rgba(186, 148, 79, 0.1); border-radius: 10px;">
                    <p style="color: rgba(255, 255, 255, 0.8); font-size: 0.9rem; margin-bottom: 0.5rem; font-weight: 600;">Available Commands:</p>
                    <ul style="color: rgba(255, 255, 255, 0.7); font-size: 0.85rem; text-align: left; list-style: none; padding: 0;">
                        <li>• "Search for [planet name]"</li>
                        <li>• "Show favorites"</li>
                        <li>• "Show wishlist"</li>
                        <li>• "Show statistics"</li>
                        <li>• "Show leaderboard"</li>
                        <li>• "Help" for all commands</li>
                    </ul>
                </div>
            </div>
        `;

        // Setup button listener
        const button = document.getElementById('voice-command-button');
        if (button) {
            button.addEventListener('click', () => {
                this.startListening();
            });
        }
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryVoiceCommands = new PlanetDiscoveryVoiceCommands();
}

