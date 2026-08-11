/**
 * Ruffle Games Manager
 * Handles SWF game loading and playback for 1122+ games
 * Enhanced with comprehensive error debugging
 */

class RuffleGamesManager {
    constructor() {
        this.games = [];
        this.filteredGames = [];
        this.currentGame = null;
        this.rufflePlayer = null;
        this.debugMode = true; // Enable detailed logging
        this.r2BaseUrl = (window.AppConfig && window.AppConfig.urls.r2Base) || 'https://starisdons-swf-worker.adybag14.workers.dev'; // Use config or fallback
        this.currentSort = 'name-asc'; // Default sort
        this.init();
    }

    async init() {
        try {
            this.log('🎮 Initializing Ruffle Games Manager...', 'info');
            await this.loadGames();
            this.setupEventListeners();
            this.renderGames(); // FIXED: was "render Games()" with space
            this.log(`✅ Initialization complete! ${this.games.length} games loaded`, 'success');
        } catch (error) {
            this.log(`❌ Initialization failed: ${error.message}`, 'error');
            this.showError('Failed to initialize games system', error);
        }
    }

    log(message, level = 'info') {
        if (!this.debugMode) return;

        const styles = {
            info: 'color: #4A90E2',
            success: 'color: #7ED321',
            warning: 'color: #F5A623',
            error: 'color: #D0021B'
        };

        console.log(`%c[Games] ${message}`, styles[level] || styles.info);
    }

    async fetchJSON(url, options = {}) {
        try {
            // First attempt: direct fetch
            const response = await fetch(url, options);
            if (response.ok) return await response.json();
            throw new Error(`HTTP error! status: ${response.status}`);
        } catch (error) {
            this.log(`Direct fetch failed for ${url}, trying proxies...`, 'warning');
            
            // Second attempt: AllOrigins proxy
            try {
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl);
                if (proxyRes.ok) {
                    const data = await proxyRes.json();
                    return typeof data.contents === 'string' ? JSON.parse(data.contents) : data.contents;
                }
            } catch (proxyError) {
                this.log('AllOrigins proxy failed', 'warning');
            }

            // Third attempt: corsproxy.io fallback
            try {
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl, options);
                if (proxyRes.ok) return await proxyRes.json();
            } catch (proxyError) {
                this.log('All proxies failed', 'error');
            }

            throw error; // Rethrow original error if all fail
        }
    }

    async loadGames() {
        try {
            this.log('📥 Loading games manifest...', 'info');

            // Try multiple paths for games-manifest.json (GitLab Pages compatibility)
            const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/')) || '';
            const manifestPaths = [
                'games-manifest.json',
                './games-manifest.json',
                '/games-manifest.json',
                `${basePath}/games-manifest.json`,
                `${window.location.origin}/games-manifest.json`,
                'games/games-manifest.json',
                `${basePath}/games/games-manifest.json`
            ];

            let allGames = null;
            let lastError = null;

            for (const manifestPath of manifestPaths) {
                try {
                    this.log(`🔍 Trying manifest path: ${manifestPath}`, 'info');
                    allGames = await this.fetchJSON(manifestPath, {
                        method: 'GET',
                        cache: 'default', // Allow browser caching for faster subsequent loads
                        headers: {
                            'Accept': 'application/json'
                        }
                    });

                    if (allGames) {
                        this.log(`✅ Found manifest at: ${manifestPath}`, 'success');
                        break;
                    }
                } catch (err) {
                    lastError = err;
                    this.log(`⚠️ Error fetching ${manifestPath}: ${err.message}`, 'warning');
                    continue;
                }
            }

            if (!allGames) {
                throw new Error(`Failed to load games manifest from all paths. Last error: ${lastError ? lastError.message : 'Unknown error'}`);
            }

            // Load ALL games - files are hosted on Cloudflare R2 (no GitLab 1GB limit)
            this.games = allGames; // All games available!
            this.filteredGames = [...this.games];
            this.log(`✅ Loaded ${this.games.length} games from manifest (hosted on Cloudflare R2)`, 'success');

            // Validate games data
            if (!Array.isArray(this.games) || this.games.length === 0) {
                throw new Error('Games manifest is empty or invalid');
            }

        } catch (error) {
            this.log(`❌ Error loading games manifest: ${error.message}`, 'error');
            this.showError('Failed to load games list', error);
            throw error;
        }
    }

    setupEventListeners() {
        try {
            this.log('🔧 Setting up event listeners...', 'info');

            // Search functionality
            const searchInput = document.getElementById('game-search');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.log(`🔍 Search: "${e.target.value}"`, 'info');
                    this.filterGames(e.target.value);
                });
            } else {
                this.log('⚠️ Search input not found', 'warning');
            }

            // Sort functionality
            const sortSelect = document.getElementById('game-sort');
            if (sortSelect) {
                sortSelect.addEventListener('change', (e) => {
                    this.currentSort = e.target.value;
                    this.log(`🔄 Sort changed to: ${this.currentSort}`, 'info');
                    this.sortGames();
                    this.renderGames();
                });
            }

            // Game card clicks (delegated)
            const gamesGrid = document.getElementById('games-grid');
            if (gamesGrid) {
                gamesGrid.addEventListener('click', (e) => {
                    const gameCard = e.target.closest('.game-card');
                    if (gameCard) {
                        const gameFile = gameCard.dataset.game;
                        const gameName = gameCard.dataset.name;
                        this.log(`🎯 Game clicked: ${gameName}`, 'info');
                        this.playGame(gameFile, gameName);
                    }
                });
            } else {
                this.log('⚠️ Games grid not found', 'warning');
            }

            // Modal close buttons
            const closeModalBtn = document.getElementById('close-game-modal');
            const closeGameBtn = document.getElementById('close-game-btn');
            const gameModal = document.getElementById('game-modal');

            if (closeModalBtn) closeModalBtn.addEventListener('click', () => this.closeGame());
            if (closeGameBtn) closeGameBtn.addEventListener('click', () => this.closeGame());
            if (gameModal) {
                gameModal.addEventListener('click', (e) => {
                    if (e.target === gameModal) this.closeGame();
                });
            }

            // Fullscreen button
            const fullscreenBtn = document.getElementById('fullscreen-btn');
            if (fullscreenBtn) {
                fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
            }

            // Escape key to close modal
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && gameModal && gameModal.style.display !== 'none') {
                    this.closeGame();
                }
            });

            this.log('✅ Event listeners set up successfully', 'success');
        } catch (error) {
            this.log(`❌ Error setting up event listeners: ${error.message}`, 'error');
        }
    }

    filterGames(searchTerm) {
        try {
            const term = searchTerm.toLowerCase().trim();
            this.filteredGames = this.games.filter(game =>
                game.name.toLowerCase().includes(term)
            );
            this.sortGames(); // Apply current sort
            this.log(`🔍 Filtered to ${this.filteredGames.length} games`, 'info');
            this.renderGames();
            this.updateGameCount();
        } catch (error) {
            this.log(`❌ Error filtering games: ${error.message}`, 'error');
        }
    }

    sortGames() {
        try {
            this.filteredGames.sort((a, b) => {
                switch (this.currentSort) {
                    case 'name-asc':
                        return a.name.localeCompare(b.name);
                    case 'name-desc':
                        return b.name.localeCompare(a.name);
                    case 'size-asc':
                        return a.size - b.size;
                    case 'size-desc':
                        return b.size - a.size;
                    default:
                        return 0;
                }
            });
        } catch (error) {
            this.log(`❌ Error sorting games: ${error.message}`, 'error');
        }
    }

    updateGameCount() {
        try {
            const visibleCount = document.getElementById('visible-count');
            if (visibleCount) {
                visibleCount.textContent = this.filteredGames.length;
            }
        } catch (error) {
            this.log(`❌ Error updating count: ${error.message}`, 'error');
        }
    }

    renderGames() {
        try {
            this.log(`🎨 Rendering ${this.filteredGames.length} games...`, 'info');

            const gamesGrid = document.getElementById('games-grid');
            const loadingIndicator = document.getElementById('loading-indicator');
            const gameCount = document.getElementById('game-count');
            const visibleCount = document.getElementById('visible-count');

            if (!gamesGrid) {
                throw new Error('Games grid element not found');
            }

            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }

            if (this.filteredGames.length === 0) {
                gamesGrid.innerHTML = '<div class="no-games"><p>No games found. Try a different search term.</p></div>';
                if (gameCount) {
                    gameCount.textContent = 'No games found';
                }
                if (visibleCount) {
                    visibleCount.textContent = '0';
                }
                return;
            }

            // Update game count display
            if (gameCount) {
                gameCount.innerHTML = `Showing <span id="visible-count">${this.filteredGames.length}</span> of ${this.games.length} deployed games`;
                if (visibleCount) {
                    visibleCount.textContent = this.filteredGames.length;
                }
            }

            gamesGrid.innerHTML = this.filteredGames.map(game => {
                // Sanitize name to prevent XSS
                const safeName = this.formatGameName(game.name).replace(/</g, '&lt;').replace(/>/g, '&gt;');
                return `
                <div class="game-card" data-game="${game.file}" data-name="${game.name.replace(/"/g, '&quot;')}">
                    <div class="game-thumbnail">
                        <div class="play-icon">▶️</div>
                        <div class="game-name">${safeName}</div>
                    </div>
                    <div class="game-size">${Math.round(game.size)} KB</div>
                </div>
            `}).join('');

            this.log(`✅ Rendered ${this.filteredGames.length} game cards`, 'success');
        } catch (error) {
            this.log(`❌ Error rendering games: ${error.message}`, 'error');
            this.showError('Failed to display games', error);
        }
    }

    formatGameName(name) {
        // Clean up game names for display
        return name
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
            .substring(0, 50) + (name.length > 50 ? '...' : '');
    }

    async playGame(gameFile, gameName) {
        try {

            this.log(`🎮 Loading game: ${gameName}`, 'info');

            const modal = document.getElementById('game-modal');
            const modalTitle = document.getElementById('game-modal-title');
            const gameContainer = document.getElementById('game-container');

            if (!modal || !gameContainer) {
                throw new Error('Modal elements not found');
            }

            // Show modal
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';

            const skipAnimations = typeof document !== 'undefined' && document && document.visibilityState !== 'visible';
            if (skipAnimations) {
                modal.style.animation = 'none';
                modal.style.opacity = '1';
                modal.style.visibility = 'visible';
            } else {
                modal.style.animation = '';
                modal.style.opacity = '';
                modal.style.visibility = '';
            }

            // Set title
            if (modalTitle) {
                modalTitle.textContent = this.formatGameName(gameName);
            }

            // Clear previous game
            gameContainer.innerHTML = '<div style="color: white; text-align: center; padding: 2rem;">Loading game...</div>';

            // Check if Ruffle is available
            if (!window.RufflePlayer) {
                throw new Error('Ruffle player not loaded. Please refresh the page.');
            }

            // Create Ruffle player
            const ruffle = window.RufflePlayer.newest();
            this.rufflePlayer = ruffle.createPlayer();

            // Style the player
            this.rufflePlayer.style.width = '100%';
            this.rufflePlayer.style.height = '100%';

            // Clear loading message and add player
            gameContainer.innerHTML = '';
            gameContainer.appendChild(this.rufflePlayer);

            // Load the SWF from Cloudflare R2 (via Worker)
            // gameFile is "swf/filename.swf"
            const swfUrl = `${this.r2BaseUrl}/${gameFile}`;
            this.log(`📂 Loading SWF file from R2: ${swfUrl}`, 'info');
            await this.rufflePlayer.load(swfUrl);

            this.currentGame = { file: gameFile, name: gameName };
            this.log(`✅ Game loaded successfully: ${gameName}`, 'success');

        } catch (error) {
            console.error('❌ ERROR loading game:', error);

            // Enhanced Error Diagnostics
            const errorContainer = document.getElementById('game-container');
            if (errorContainer) {
                errorContainer.innerHTML = `
                    <div class="game-error">
                        <h3>⚠️ Game Load Error</h3>
                        <p>Could not load game: ${gameName}</p>
                        <p class="error-details">${error.message}</p>
                        <div id="fetch-debug" style="margin-top: 10px; font-size: 12px; color: #aaa;">Diagnosing...</div>
                        <button onclick="location.reload()" class="retry-btn">Try Again</button>
                    </div>
                `;

                // Perform explicit fetch to check for 404/403
                const swfUrl = `${this.r2BaseUrl}/${gameFile}`;
                fetch(swfUrl).then(response => {
                    const debugEl = document.getElementById('fetch-debug');
                    if (debugEl) {
                        debugEl.innerHTML = `
                            <strong>Network Check:</strong><br>
                            Status: ${response.status} ${response.statusText}<br>
                            URL: ${swfUrl}<br>
                            Type: ${response.type}<br>
                            Size: ${response.headers.get('content-length') || 'Unknown'} bytes
                        `;
                        if (!response.ok) {
                            debugEl.style.color = '#ff5555';
                        } else {
                            debugEl.style.color = '#55ff55';
                            debugEl.innerHTML += '<br>File exists but Ruffle failed to load it.';
                        }
                    }
                }).catch(fetchErr => {
                    const debugEl = document.getElementById('fetch-debug');
                    if (debugEl) {
                        debugEl.innerHTML = `
                            <strong>Network Check Failed:</strong><br>
                            ${fetchErr.message}<br>
                            Possible CORS or Network Block.
                        `;
                        debugEl.style.color = '#ff5555';
                    }
                });
            }

            // Reset player instance
            this.rufflePlayer = null;
        }
    }

    closeGame() {
        try {
            this.log('🚪 Closing game...', 'info');

            const modal = document.getElementById('game-modal');
            const gameContainer = document.getElementById('game-container');

            if (!modal) return;

            // Remove Ruffle player
            if (this.rufflePlayer) {
                this.rufflePlayer.remove();
                this.rufflePlayer = null;
            }

            // Clear container
            if (gameContainer) {
                gameContainer.innerHTML = '';
            }

            this.currentGame = null;
            modal.style.display = 'none';
            document.body.style.overflow = '';

            modal.style.animation = '';
            modal.style.opacity = '';
            modal.style.visibility = '';

            this.log('✅ Game closed', 'success');
        } catch (error) {
            this.log(`❌ Error closing game: ${error.message}`, 'error');
        }
    }

    toggleFullscreen() {
        try {
            const gameContainer = document.getElementById('game-container');
            if (!gameContainer) return;

            if (!document.fullscreenElement) {
                gameContainer.requestFullscreen().catch(err => {
                    this.log(`❌ Fullscreen error: ${err.message}`, 'error');
                });
            } else {
                document.exitFullscreen();
            }
        } catch (error) {
            this.log(`❌ Error toggling fullscreen: ${error.message}`, 'error');
        }
    }

    showError(title, error) {
        // Display user-friendly error message
        const gamesGrid = document.getElementById('games-grid');
        if (gamesGrid) {
            gamesGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: white;">
                    <h2 style="color: #D0021B; margin-bottom: 1rem;">⚠️ ${title}</h2>
                    <p style="margin-bottom: 1rem;">${error.message}</p>
                    <p style="font-size: 0.9rem; opacity: 0.7;">Check the browser console for more details.</p>
                    <button onclick="location.reload()" style="margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: #4A90E2; color: white; border: none; border-radius: 8px; cursor: pointer;">Reload Page</button>
                </div>
            `;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('%c🎮 Starting Ruffle Games Manager...', 'color: #7ED321; font-size: 14px; font-weight: bold;');
        window.gamesManager = new RuffleGamesManager();
    } catch (error) {
        console.error('❌ Fatal error initializing games:', error);
        alert('Failed to load games system. Please refresh the page.');
    }
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});
