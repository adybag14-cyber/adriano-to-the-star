/**
 * Ruffle Games Manager
 * Handles the build-cached SWF catalogue with paginated, accessible launch controls.
 */

class RuffleGamesManager {
    constructor() {
        this.games = [];
        this.filteredGames = [];
        this.currentGame = null;
        this.rufflePlayer = null;
        this.debugMode = false;
        this.r2BaseUrl = (window.AppConfig && window.AppConfig.urls.r2Base) || 'https://starisdons-swf-worker.adybag14.workers.dev'; // Use config or fallback
        this.currentSort = 'name-asc'; // Default sort
        this.currentPage = 1;
        this.pageSize = 48;
        this.lastLaunchControl = null;
        this.archiveState = 'checking';
        this.launchSequence = 0;
        this.init();
    }

    async init() {
        try {
            this.log('🎮 Initializing Ruffle Games Manager...', 'info');
            await this.loadGames();
            await this.loadArchiveIndex();
            this.setupEventListeners();
            this.renderGames(); // FIXED: was "render Games()" with space
            await this.checkArchiveAvailability();
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
        const resolved = new URL(url, document.baseURI);
        if (resolved.origin !== window.location.origin) throw new Error('Cross-origin catalogue requests are not allowed');
        const response = await fetch(resolved.href, options);
        if (!response.ok) throw new Error(`HTTP ${response.status} while loading the game catalogue`);
        return response.json();
    }

    async loadGames() {
        try {
            this.log('📥 Loading games manifest...', 'info');

            // Try multiple paths for games-manifest.json (GitLab Pages compatibility)
            const manifestPaths = [
                'games-manifest.json',
                './games-manifest.json'
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

            if (!Array.isArray(allGames) || allGames.some(game => !game ||
                typeof game.name !== 'string' || !/^swf\/[^/]+\.swf$/i.test(game.file) ||
                !Number.isFinite(game.size) || game.size < 0)) {
                throw new Error('The archive catalogue contains an invalid entry');
            }
            // These are remote archive paths, not files deployed with GitLab Pages.
            this.games = allGames;
            this.filteredGames = [...this.games];
            this.sortGames();
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
                    this.currentPage = 1;
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
                        this.lastLaunchControl = gameCard;
                        const gameFile = gameCard.dataset.game;
                        const gameName = gameCard.dataset.name;
                        this.log(`🎯 Game clicked: ${gameName}`, 'info');
                        if (!gameCard.disabled) this.playGame(gameFile, gameName);
                    }
                });
            } else {
                this.log('⚠️ Games grid not found', 'warning');
            }

            // Modal close buttons
            const closeModalBtn = document.getElementById('close-game-modal');
            const closeGameBtn = document.getElementById('close-game-btn');
            const gameModal = document.getElementById('game-modal');
            // Portal the modal outside main's stacking context, so floating site
            // widgets cannot cover its close/fullscreen controls on small screens.
            if (gameModal && gameModal.parentElement !== document.body) document.body.appendChild(gameModal);

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
                if (e.key === 'Tab' && gameModal?.style.display === 'flex') {
                    const controls = [...gameModal.querySelectorAll('button:not([disabled]), [tabindex="0"]')]
                        .filter(control => control.getClientRects().length);
                    const first = controls[0];
                    const last = controls[controls.length - 1];
                    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
                    if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
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
            this.currentPage = 1;
            this.sortGames(); // Apply current sort
            this.log(`🔍 Filtered to ${this.filteredGames.length} games`, 'info');
            this.renderGames();
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
            this.log(`🎨 Rendering page ${this.currentPage} of the filtered archive...`, 'info');

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

            document.querySelector('.games-pager')?.remove();
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

            const totalPages = Math.max(1, Math.ceil(this.filteredGames.length / this.pageSize));
            this.currentPage = Math.min(Math.max(1, this.currentPage), totalPages);
            const start = (this.currentPage - 1) * this.pageSize;
            const visibleGames = this.filteredGames.slice(start, start + this.pageSize);

            // Update game count display
            if (gameCount) {
                gameCount.innerHTML = `Showing <span id="visible-count">${visibleGames.length}</span> of ${this.filteredGames.length} matches · ${this.games.length} archived games`;
                if (visibleCount) {
                    visibleCount.textContent = visibleGames.length;
                }
            }

            gamesGrid.innerHTML = visibleGames.map(game => {
                // Sanitize name to prevent XSS
                const safeName = this.escapeAttribute(this.formatGameName(game.name));
                const canLaunch = this.archiveState === 'available' && game.archive?.status !== 'unavailable' && !this.isRuntimeBlocked(game.archive);
                const unavailableReason = game.archive?.status === 'unavailable' ? `<div class="game-availability">${this.escapeAttribute(game.archive.reason)} Original preserved; replacement needed.</div>` : '';
                const publisher = this.isRuntimeBlocked(game.archive) && ['https://www.coolmathgames.com/0-bloxorz', 'https://www.coolmathgames.com/0-sugar-sugar'].includes(game.archive.publisherUrl);
                const restrictedReason = publisher ? `<div class="game-availability">${this.escapeAttribute(game.archive.runtimeReason)}</div>` : '';
                const card = `
                <button type="button" class="game-card" data-game="${this.escapeAttribute(game.file)}" data-name="${this.escapeAttribute(game.name)}" aria-label="${canLaunch ? 'Launch' : 'Unavailable:'} ${safeName}" ${canLaunch ? '' : 'disabled aria-describedby="archive-connection-message"'}>
                    <div class="game-thumbnail">
                        <div class="play-icon" aria-hidden="true">${canLaunch ? '▷' : '—'}</div>
                        <div class="game-name">${safeName}</div>
                    </div>
                    <div class="game-size">${this.formatBytes(game.archive?.bytes || game.size)}</div>
                    ${unavailableReason}
                    ${restrictedReason}
                </button>
            `;
                return publisher ? `<div class="game-publisher-entry">${card}<a class="archive-publisher-link" href="${this.escapeAttribute(game.archive.publisherUrl)}" target="_blank" rel="noopener noreferrer">Play on publisher site<span class="sr-only"> — ${safeName}, opens a new tab</span></a></div>` : card;
            }).join('');

            if (totalPages > 1) {
                const pager = document.createElement('nav');
                pager.className = 'games-pager';
                pager.setAttribute('aria-label', 'Games archive pages');
                pager.innerHTML = `
                    <button type="button" data-page="previous" ${this.currentPage === 1 ? 'disabled' : ''}>Previous</button>
                    <span aria-live="polite">Page ${this.currentPage} of ${totalPages}</span>
                    <button type="button" data-page="next" ${this.currentPage === totalPages ? 'disabled' : ''}>Next</button>`;
                pager.addEventListener('click', event => {
                    const action = event.target.closest('button')?.dataset.page;
                    if (!action) return;
                    this.currentPage += action === 'next' ? 1 : -1;
                    this.renderGames();
                    const nextControl = document.querySelector(`.games-pager [data-page="${action}"]:not([disabled])`) || document.querySelector('.games-pager button:not([disabled])');
                    nextControl?.focus({ preventScroll: true });
                    document.getElementById('games-grid')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
                });
                gamesGrid.after(pager);
            }

            this.log(`✅ Rendered ${this.filteredGames.length} game cards`, 'success');
        } catch (error) {
            this.log(`❌ Error rendering games: ${error.message}`, 'error');
            this.showError('Failed to display games', error);
        }
    }

    formatGameName(name) {
        // Clean up game names for display
        return name
            .replace(/^f-?\d+(?:swf-nr2kjn-jekb|Yt6Rfd|resourcepublicfiles|publicfiles|filesgames|gamesflash)/i, '')
            .replace(/[-_](?:REMOTE|LOCAL)$/i, '')
            .replace(/-\d{3,}$/, '')
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
            .substring(0, 50) + (name.length > 50 ? '...' : '');
    }

    formatBytes(bytes) {
        if (!bytes) return 'Size not recorded';
        return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }

    isRuntimeBlocked(record) {
        return ['publisher-restricted', 'startup-blocked'].includes(record?.runtimeStatus);
    }

    archiveUrl(gameFile) {
        if (!/^swf\/[^/]+\.swf(?:\.part-\d+)?$/i.test(gameFile)) throw new Error('Invalid archive path');
        return `${this.r2BaseUrl.replace(/\/$/, '')}/${gameFile.split('/').map(encodeURIComponent).join('/')}`;
    }

    async loadArchiveIndex() {
        const index = await this.fetchJSON('games-archive-index.json');
        const approvedBase = 'https://starisdons-archive-assets.adybag14.workers.dev';
        if (index.schemaVersion !== 1 || index.assetBaseUrl !== approvedBase || !index.entries) throw new Error('Archive verification index is invalid');
        for (const game of this.games) {
            const record = index.entries[game.file];
            if (!record || !['verified-container', 'unavailable'].includes(record.status)) throw new Error(`Archive verification index is incomplete for ${game.file}`);
            if (record.status === 'verified-container' && (!Number.isSafeInteger(record.bytes) || record.bytes < 8 || !/^[a-f0-9]{64}$/.test(record.sha256))) throw new Error('Archive verification record is invalid');
            game.archive = record;
        }
        this.archiveIndex = index;
        this.r2BaseUrl = approvedBase;
    }

    async loadChunkedGame(record, gameFile, signal) {
        if (!Array.isArray(record.chunks) || record.chunks.length < 2 || record.chunks.length > 8 || record.bytes > 128 * 1024 * 1024) throw new Error('Invalid split archive record');
        const assembled = new Uint8Array(record.bytes);
        let offset = 0;
        for (const [index, chunk] of record.chunks.entries()) {
            if (chunk.path !== `${gameFile}.part-${index}` || !Number.isSafeInteger(chunk.bytes) || chunk.bytes < 1 || chunk.bytes > 25 * 1024 * 1024) throw new Error('Invalid archive chunk');
            const response = await fetch(this.archiveUrl(chunk.path), { signal: window.AbortSignal.any([signal, window.AbortSignal.timeout(60000)]) });
            if (!response.ok) throw new Error(`Archive part ${index + 1} returned HTTP ${response.status}`);
            const bytes = new Uint8Array(await response.arrayBuffer());
            if (bytes.length !== chunk.bytes || offset + bytes.length > assembled.length) throw new Error('Archive part has an unexpected size');
            await this.verifyDigest(bytes, chunk.sha256);
            assembled.set(bytes, offset);
            offset += bytes.length;
        }
        if (offset !== assembled.length) throw new Error('Split archive file is incomplete');
        await this.verifyDigest(assembled, record.sha256);
        return { data: assembled, swfFileName: gameFile.split('/').pop(), base: `${this.r2BaseUrl}/swf/`, allowScriptAccess: false, openUrlMode: 'confirm', letterbox: 'on' };
    }

    async verifyDigest(bytes, expected) {
        const hash = await window.crypto.subtle.digest('SHA-256', bytes);
        const actual = [...new Uint8Array(hash)].map(value => value.toString(16).padStart(2, '0')).join('');
        if (actual !== expected) throw new Error('Archive integrity check failed; no game code was started');
    }

    renderArchiveStatus(message) {
        let status = document.getElementById('archive-connection-status');
        if (!status) {
            status = document.createElement('section');
            status.id = 'archive-connection-status';
            status.className = 'archive-connection-status';
            status.innerHTML = '<p id="archive-connection-message" role="status" aria-live="polite"></p><button type="button" id="archive-retry-connection">Check archive connection</button>';
            document.getElementById('games-grid')?.before(status);
            status.querySelector('button').addEventListener('click', () => this.checkArchiveAvailability());
        }
        status.dataset.state = this.archiveState;
        status.querySelector('p').textContent = message;
        status.querySelector('button').disabled = this.archiveState === 'checking';
    }

    async checkArchiveAvailability() {
        if (!this.games.length) return;
        this.archiveState = 'checking';
        this.renderArchiveStatus('Checking the remote archive storage. You can continue searching the catalogue.');
        this.renderGames();
        try {
            const sample = this.games.find(game => (!game.archive || game.archive.status === 'verified-container') && !this.isRuntimeBlocked(game.archive));
            if (!sample) throw new Error('No verified game copies are currently available');
            await this.checkAssetHeader(sample.file);
            this.archiveState = 'available';
            const available = this.games.filter(game => game.archive?.status === 'verified-container').length;
            const summary = this.archiveIndex ? ` ${available} original game containers verified; ${this.games.length - available} original downloads need recovery and cannot launch.` : '';
            this.renderArchiveStatus(`Archive storage is reachable.${summary} Individual legacy games may depend on features or remote services that Ruffle cannot reproduce.`);
        } catch (error) {
            this.archiveState = 'unavailable';
            this.renderArchiveStatus(`${error.message}. Browser launches are temporarily unavailable; the catalogue remains searchable. Check the connection again to retry. No game files have been removed.`);
        }
        this.renderGames();
    }

    async checkAssetHeader(gameFile) {
        const record = this.archiveIndex?.entries[gameFile];
        if (record?.status === 'unavailable') throw new Error(record.reason);
        if (this.isRuntimeBlocked(record)) throw new Error(record.runtimeReason);
        const probePath = record?.chunks?.[0]?.path || gameFile;
        const response = await fetch(this.archiveUrl(probePath), {
            headers: { Range: 'bytes=0-7' }, signal: window.AbortSignal.timeout(10000), cache: 'no-store'
        });
        if (!response.ok) { await response.body?.cancel(); throw new Error(`Archive storage returned HTTP ${response.status}`); }
        const reader = response.body.getReader();
        const prefix = [];
        try {
            while (prefix.length < 8) {
                const { done, value } = await reader.read();
                if (done) break;
                prefix.push(...value.subarray(0, 8 - prefix.length));
            }
        } finally { await reader.cancel(); }
        if (prefix.length < 8 || !['FWS', 'CWS', 'ZWS'].includes(String.fromCharCode(...prefix.slice(0, 3)))) {
            throw new Error('Archive storage did not return a Flash game file');
        }
    }

    waitForMovie(player, api, signal) {
        if (api.readyState === 2) return Promise.resolve();
        return new Promise((resolve, reject) => {
            const cleanup = () => {
                clearTimeout(timer);
                player.removeEventListener('loadeddata', loaded);
                signal.removeEventListener('abort', aborted);
            };
            const loaded = () => { cleanup(); resolve(); };
            const aborted = () => { cleanup(); reject(new Error('Game launch cancelled')); };
            const timer = setTimeout(() => { cleanup(); reject(new Error('The legacy runtime did not report a playable movie within 30 seconds')); }, 30000);
            player.addEventListener('loadeddata', loaded, { once: true });
            signal.addEventListener('abort', aborted, { once: true });
            if (signal.aborted) aborted();
        });
    }

    escapeAttribute(value) {
        return String(value || '')
            .replaceAll('&', '&amp;')
            .replaceAll('"', '&quot;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;');
    }

    async playGame(gameFile, gameName) {
        const launchId = ++this.launchSequence;
        this.loadAbortController?.abort();
        this.loadAbortController = new window.AbortController();
        const signal = this.loadAbortController.signal;
        try {

            if (this.archiveState !== 'available') return;

            this.log(`🎮 Loading game: ${gameName}`, 'info');

            const modal = document.getElementById('game-modal');
            const modalTitle = document.getElementById('game-modal-title');
            const gameContainer = document.getElementById('game-container');

            if (!modal || !gameContainer) {
                throw new Error('Modal elements not found');
            }

            // Show modal
            modal.hidden = false;
            modal.style.display = 'flex';
            modal.setAttribute('aria-hidden', 'false');
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
            document.getElementById('close-game-modal')?.focus();

            // Clear previous game
            gameContainer.innerHTML = '<div style="color: white; text-align: center; padding: 2rem;">Loading game...</div>';

            // Check if Ruffle is available
            await this.checkAssetHeader(gameFile);
            if (launchId !== this.launchSequence) return;
            if (!window.RufflePlayer) {
                throw new Error('Ruffle player not loaded. Please refresh the page.');
            }

            // Create Ruffle player
            const ruffle = window.RufflePlayer.newest();
            this.rufflePlayer?.remove();
            const player = ruffle.createPlayer();
            this.rufflePlayer = player;

            // Style the player
            this.rufflePlayer.style.width = '100%';
            this.rufflePlayer.style.height = '100%';

            // Clear loading message and add player
            gameContainer.innerHTML = '';
            gameContainer.appendChild(this.rufflePlayer);

            // Load the SWF from Cloudflare R2 (via Worker)
            // gameFile is "swf/filename.swf"
            const swfUrl = this.archiveUrl(gameFile);
            this.log(`📂 Loading SWF file from R2: ${swfUrl}`, 'info');
            const api = typeof player.ruffle === 'function' ? player.ruffle() : player;
            const record = this.archiveIndex?.entries[gameFile];
            const loadOptions = record?.chunks ? await this.loadChunkedGame(record, gameFile, signal) : { url: swfUrl, allowScriptAccess: false, openUrlMode: 'confirm', letterbox: 'on' };
            await api.load(loadOptions);
            await this.waitForMovie(player, api, signal);
            if (launchId !== this.launchSequence) { player.remove(); return; }

            this.currentGame = { file: gameFile, name: gameName };
            this.log(`✅ Game loaded successfully: ${gameName}`, 'success');

        } catch (error) {
            if (launchId !== this.launchSequence) return;
            console.error('❌ ERROR loading game:', error);

            // Enhanced Error Diagnostics
            const errorContainer = document.getElementById('game-container');
            if (errorContainer) {
                errorContainer.innerHTML = `
                    <div class="game-error">
                        <h3>Game could not start</h3>
                        <p>Could not load game: ${this.escapeAttribute(gameName)}</p>
                        <p class="error-details">${this.escapeAttribute(error.message)}</p>
                        <p>The original file, remote archive storage, or an unsupported legacy runtime feature may be responsible. This does not establish that the file is corrupt.</p>
                        <button type="button" class="retry-btn">Retry this game</button>
                    </div>
                `;

                errorContainer.querySelector('.retry-btn').addEventListener('click', () => this.playGame(gameFile, gameName));
            }

            // Reset player instance
            this.rufflePlayer = null;
        }
    }

    closeGame() {
        try {
            this.launchSequence++;
            this.loadAbortController?.abort();
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
            modal.hidden = true;
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';

            modal.style.animation = '';
            modal.style.opacity = '';
            modal.style.visibility = '';

            this.log('✅ Game closed', 'success');
            this.lastLaunchControl?.focus();
        } catch (error) {
            this.log(`❌ Error closing game: ${error.message}`, 'error');
        }
    }

    async toggleFullscreen() {
        try {
            const gameContainer = document.getElementById('game-container');
            if (!gameContainer) return;

            if (!document.fullscreenElement) {
                if (!gameContainer.requestFullscreen) throw new Error('Fullscreen is unavailable in this browser');
                await gameContainer.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (error) {
            let feedback = document.getElementById('archive-fullscreen-status');
            if (!feedback) {
                feedback = document.createElement('p');
                feedback.id = 'archive-fullscreen-status';
                feedback.setAttribute('role', 'status');
                document.querySelector('.game-modal-footer')?.prepend(feedback);
            }
            feedback.textContent = error.message;
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
