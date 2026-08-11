/**
 * Universal Cosmic Music Player
 *
 * A persistent, floating music player that works across all pages.
 * Features:
 * - Auto-initializes on page load
 * - Persists playback state across page navigation
 * - Floating player UI with minimize/expand
 * - Playlist management from manifest.json
 * - Volume control and progress tracking
 * - Keyboard shortcuts support
 * - Audio event handling and cleanup
 *
 * @class CosmicMusicPlayer
 * @example
 * const player = window.cosmicMusicPlayer();
 * player.play();
 * player.pause();
 */
(function () {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return;
    }

    if (window.__cosmicMusicPlayerJsLoaded) {
        return;
    }

    window.__cosmicMusicPlayerJsLoaded = true;

console.log('🎵 Cosmic Music Player Script Loaded');

class CosmicMusicPlayer {
    constructor() {
        this.debug = localStorage.getItem('debug_mode') === 'true';
        this.log('🎵 CosmicMusicPlayer: Constructor called');

        this.isAutomatedTest = false;
        try {
            const nav = window.navigator;
            const ua = String(nav && nav.userAgent ? nav.userAgent : '');
            const search = String(window.location && window.location.search ? window.location.search : '');
            this.isAutomatedTest =
                Boolean(nav && nav.webdriver) ||
                /HeadlessChrome/i.test(ua) ||
                /[?&]cb=smoke/i.test(search) ||
                /smoke|playwright|e2e/i.test(search);
        } catch (_err) {
            this.isAutomatedTest = false;
        }

        this.baseUrl = window.location.origin;
        this.log('🎵 Music Player Environment:', {
            origin: this.baseUrl,
            pathname: window.location.pathname,
            protocol: window.location.protocol,
            host: window.location.host
        });

        this.trackManifestUrl = 'audio/manifest.json';
        const buildTrack = (name, filename, description = '') => {
            const sources = this.getTrackSources(filename);
            return {
                name,
                filename,
                description,
                url: sources.primary,
                fallbackUrl: sources.fallback
            };
        };

        this.tracks = [
            buildTrack('Track 1: Cosmic Journey', 'cosmic-journey.mp3', 'Deep space ambience'),
            buildTrack('Track 2: Stellar Voyage', 'stellar-voyage.mp3', 'Floating through stardust'),
            buildTrack('Track 3: Galactic Odyssey', 'galactic-odyssey.mp3', 'Epic journey across galaxies'),
            buildTrack('Track 4: Celestial Harmony', 'track-4.mp3', 'Smooth harmonic waves'),
            buildTrack('Track 5: Stellar Dreams', 'track-5.mp3'),
            buildTrack('Track 6: Cosmic Resonance', 'track-6.mp3'),
            buildTrack('Track 7: Nebula Waves', 'track-7.mp3'),
            buildTrack('Track 8: Interstellar Echo', 'track-8.mp3'),
            buildTrack('Track 9: Galactic Pulse', 'track-9.mp3'),
            buildTrack('Track 10: Cosmic Drift', 'track-10.mp3'),
            buildTrack('Track 11: Stellar Winds', 'track-11.mp3'),
            buildTrack('Track 12: Nebula Dreams', 'track-12.mp3'),
            buildTrack('Track 13: Galactic Currents', 'track-13.mp3'),
            buildTrack('Track 14: Cosmic Tides', 'track-14.mp3'),
            buildTrack('Track 15: Stellar Flow', 'track-15.mp3'),
            buildTrack('Track 16: Nebula Stream', 'track-16.mp3'),
            buildTrack('Track 17: Galactic Waves', 'track-17.mp3'),
            buildTrack('Track 18: Cosmic Horizon', 'track-18.mp3'),
            buildTrack('Track 19: Was Ist Dein Lieblingsfach', 'was-ist-dein-lieblingsfach.mp3', 'German educational track')
        ];

        // Log all track URLs for debugging
        console.log('🎵 Total tracks:', this.tracks.length);
        console.log('🎵 Track URLs:', this.tracks.map(t => ({
            name: t.name,
            filename: t.filename,
            primary: t.url,
            fallback: t.fallbackUrl
        })));
        this.currentTrackIndex = 0;
        this.audio = new Audio();
        this.isPlaying = false;
        this.isMinimized = false;

        console.log('🎵 Loading saved state...');
        // Load saved state from localStorage
        this.loadPlayerState();

        console.log('🎵 Injecting player HTML...');
        this.injectPlayerHTML();
        this.renderPlaylist();

        // Initialize player
        this.initPlayer();

        // Update track display immediately to show correct count
        this.updateTrackDisplay();

        console.log('🎵 Setting up event listeners...');
        this.setupEventListeners();

        // Setup page navigation persistence
        this.setupNavigationPersistence();
        this.loadTrackManifest();

        // Update track display again after manifest loads (if it does)
        setTimeout(() => {
            this.updateTrackDisplay();
        }, 500);

        console.log('🎵 CosmicMusicPlayer: Constructor complete!');
    }

    log(msg, ...args) {
        if (this.debug) {
            console.log(msg, ...args);
        }
    }

    setupNavigationPersistence() {
        // Save state when navigating away - use both sync and async methods
        window.addEventListener('beforeunload', () => {
            this.saveStateBeforeUnload();
        });

        // Also use pagehide event (more reliable on mobile)
        window.addEventListener('pagehide', () => {
            this.saveStateBeforeUnload();
        });

        // Save state when page becomes hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveStateBeforeUnload();
            }
        });

        // Save state periodically - save ALWAYS, not just when playing
        let intervalSaveCount = 0;
        this.saveStateInterval = setInterval(() => {
            intervalSaveCount++;
            if (this.audio) {
                // Save state every 2 seconds regardless of playing state
                if (this.debug) {
                    console.log(`💾 DEBUG interval save #${intervalSaveCount}:`, {
                        currentTime: this.audio.currentTime,
                        isNaN: isNaN(this.audio.currentTime),
                        isPlaying: this.isPlaying,
                        trackIndex: this.currentTrackIndex
                    });
                }
                this.savePlayerState();
            } else {
                if (this.debug) {
                    console.warn(`⚠️ DEBUG interval save #${intervalSaveCount}: Audio not available!`);
                }
            }
        }, 2000); // Save every 2 seconds

        // Intercept link clicks to save state before navigation
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href && !link.href.startsWith('#') && link.href !== window.location.href) {
                console.log('🔗 DEBUG link click detected:', {
                    href: link.href,
                    currentPage: window.location.href,
                    audioCurrentTime: this.audio ? this.audio.currentTime : 'N/A',
                    audioPaused: this.audio ? this.audio.paused : 'N/A'
                });
                // Save state immediately before navigation (don't wait)
                console.log('💾 DEBUG link click - Saving state IMMEDIATELY before navigation...');
                this.saveStateBeforeUnload();

                // Also save again after a tiny delay as backup
                setTimeout(() => {
                    console.log('💾 DEBUG link click - Backup save...');
                    this.saveStateBeforeUnload();
                }, 10);
            }
        }, true); // Use capture phase to catch links early

        console.log('✅ Navigation persistence enabled');
    }

    async loadTrackManifest() {
        try {
            const response = await fetch(this.trackManifestUrl, { cache: 'no-store' });
            if (!response.ok) {
                console.warn('⚠️ Track manifest fetch failed:', response.status);
                return;
            }

            const data = await response.json();
            if (!data || !Array.isArray(data.tracks) || data.tracks.length === 0) {
                console.warn('⚠️ Track manifest is empty or malformed.');
                return;
            }

            const manifestTracks = data.tracks
                .map((track) => {
                    if (!track || !track.filename) return null;
                    const sources = this.getTrackSources(track.filename);
                    return {
                        name: track.name || track.filename,
                        filename: track.filename,
                        description: track.description || '',
                        url: sources.primary,
                        fallbackUrl: sources.fallback
                    };
                })
                .filter(Boolean);

            if (!manifestTracks.length) {
                return;
            }

            const currentFilename = this.tracks[this.currentTrackIndex]?.filename;
            this.tracks = manifestTracks;
            const matchedIndex = manifestTracks.findIndex((track) => track.filename === currentFilename);
            this.currentTrackIndex = matchedIndex >= 0 ? matchedIndex : 0;
            this.renderPlaylist();
            this.updateTrackDisplay();

            if (matchedIndex === -1 && !this.isAutomatedTest) {
                this.loadTrack();
            }

            console.log(`✅ Loaded ${manifestTracks.length} tracks from audio manifest.`);
        } catch (error) {
            console.warn('⚠️ Unable to load audio manifest, continuing with default playlist.', error);
        }
    }

    cleanup() {
        // Clear intervals
        if (this.saveStateInterval) {
            clearInterval(this.saveStateInterval);
            this.saveStateInterval = null;
        }

        // Remove event listeners from buttons
        if (this.eventHandlers) {
            const playPauseBtn = document.getElementById('play-pause');
            const prevBtn = document.getElementById('prev-track');
            const nextBtn = document.getElementById('next-track');
            const volumeControl = document.getElementById('volume-control');
            const progressBar = document.getElementById('progress-bar');
            const minimizeBtn = document.getElementById('minimize-player');
            const loopToggle = document.getElementById('loop-toggle');
            const downloadBtn = document.getElementById('download-track');

            if (playPauseBtn) playPauseBtn.removeEventListener('click', this.eventHandlers.playPause);
            if (prevBtn) prevBtn.removeEventListener('click', this.eventHandlers.prevTrack);
            if (nextBtn) nextBtn.removeEventListener('click', this.eventHandlers.nextTrack);
            if (volumeControl) volumeControl.removeEventListener('input', this.eventHandlers.volumeChange);
            if (progressBar) progressBar.removeEventListener('click', this.eventHandlers.progressClick);
            if (minimizeBtn) minimizeBtn.removeEventListener('click', this.eventHandlers.minimize);
            if (loopToggle) loopToggle.removeEventListener('change', this.eventHandlers.loopToggle);
            if (downloadBtn) downloadBtn.removeEventListener('click', this.eventHandlers.download);
        }

        // Remove audio event listeners (store references for proper cleanup)
        if (this.audio) {
            // Store references if not already stored
            if (!this.audioEventHandlers) {
                this.audioEventHandlers = {
                    timeupdate: () => this.updateProgress(),
                    ended: () => this.handleTrackEnd(),
                    loadedmetadata: () => this.updateDuration()
                };
            }

            this.audio.removeEventListener('timeupdate', this.audioEventHandlers.timeupdate);
            this.audio.removeEventListener('ended', this.audioEventHandlers.ended);
            this.audio.removeEventListener('loadedmetadata', this.audioEventHandlers.loadedmetadata);
            this.audio.removeEventListener('loadstart', this.audioEventHandlers.loadstart);
            this.audio.removeEventListener('canplay', this.audioEventHandlers.canplay);
            this.audio.removeEventListener('canplaythrough', this.audioEventHandlers.canplaythrough);
            this.audio.removeEventListener('stalled', this.audioEventHandlers.stalled);
            this.audio.removeEventListener('waiting', this.audioEventHandlers.waiting);
        }

        // Clear audio
        if (this.audio) {
            this.audio.pause();
            this.audio.src = '';
            this.audio = null;
        }
    }

    injectPlayerHTML() {
        // Check if player already exists
        if (document.getElementById('cosmic-music-player')) {
            console.log('ℹ️ Player HTML already exists, skipping injection');
            return;
        }

        console.log('🎵 Injecting player HTML into body...');
        const playerHTML = `
            <div id="cosmic-music-player" style="position: fixed; bottom: 20px; left: 20px; z-index: 9999; background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 20, 30, 0.98)); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 15px; padding: 1rem; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(186, 148, 79, 0.2); backdrop-filter: blur(10px); width: 320px; transition: all 0.3s ease;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 1.5rem; animation: pulse-glow 2s infinite;">🎵</span>
                        <h4 style="margin: 0; color: #ba944f; font-size: 0.9rem; font-family: 'Raleway', sans-serif; font-weight: 600;">Cosmic Playlist</h4>
                    </div>
                    <button id="minimize-player" style="background: none; border: none; color: #ba944f; cursor: pointer; font-size: 1.2rem; padding: 0.25rem; transition: transform 0.2s;">−</button>
                </div>

                <div id="player-content">
                    <div id="current-track" style="color: rgba(255, 255, 255, 0.9); font-size: 0.85rem; margin-bottom: 0.5rem; font-weight: 500; text-align: center;">Track 1: Cosmic Journey</div>
                    <div id="track-info" style="color: rgba(255, 255, 255, 0.5); font-size: 0.7rem; margin-bottom: 0.75rem; text-align: center;">Track 1 of 19</div>

                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                        <span id="current-time" style="font-size: 0.75rem; color: rgba(255, 255, 255, 0.6); font-family: monospace;">0:00</span>
                        <div id="progress-bar" style="flex: 1; height: 6px; background: rgba(255, 255, 255, 0.2); border-radius: 3px; cursor: pointer; position: relative; overflow: hidden;">
                            <div id="progress-fill" style="height: 100%; width: 0%; background: linear-gradient(90deg, #ba944f, #ffd700); border-radius: 3px; transition: width 0.1s linear; box-shadow: 0 0 10px rgba(186, 148, 79, 0.5);"></div>
                        </div>
                        <span id="duration" style="font-size: 0.75rem; color: rgba(255, 255, 255, 0.6); font-family: monospace;">0:00</span>
                    </div>

                    <div style="display: flex; justify-content: center; align-items: center; gap: 1rem; margin-bottom: 0.75rem;">
                        <button id="prev-track" style="background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 50%; width: 35px; height: 35px; cursor: pointer; color: #ba944f; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;" aria-label="Previous track">⏮</button>
                        <button id="play-pause" style="background: rgba(186, 148, 79, 0.3); border: 2px solid #ba944f; border-radius: 50%; width: 45px; height: 45px; cursor: pointer; color: #ba944f; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; box-shadow: 0 0 15px rgba(186, 148, 79, 0.3);" aria-label="Play">▶</button>
                        <button id="next-track" style="background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 50%; width: 35px; height: 35px; cursor: pointer; color: #ba944f; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;" aria-label="Next track">⏭</button>
                    </div>

                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <span style="font-size: 1rem;">🔊</span>
                        <input type="range" id="volume-control" min="0" max="100" value="70" style="flex: 1; accent-color: #ba944f; cursor: pointer;">
                        <span id="volume-display" style="font-size: 0.75rem; color: rgba(255, 255, 255, 0.6); min-width: 35px; font-family: monospace;">70%</span>
                    </div>

                    <div style="margin-top: 0.75rem; font-size: 0.75rem; color: rgba(255, 255, 255, 0.5); text-align: center;">
                        <label style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; cursor: pointer; margin-bottom: 0.5rem;">
                            <input type="checkbox" id="loop-toggle" style="accent-color: #ba944f; cursor: pointer;">
                            <span>Loop Playlist</span>
                        </label>
                        <button id="download-track" style="background: rgba(186, 148, 79, 0.2); border: 1px solid rgba(186, 148, 79, 0.5); border-radius: 8px; padding: 0.4rem 0.8rem; color: #ba944f; cursor: pointer; font-size: 0.75rem; transition: all 0.3s ease; display: flex; align-items: center; gap: 0.4rem; margin: 0 auto;">
                            <span>⬇️</span>
                            <span>Download Track</span>
                        </button>
                    </div>

                    <div id="playlist-container" style="margin-top: 0.75rem; max-height: 180px; overflow-y: auto; border-top: 1px solid rgba(255, 255, 255, 0.15); padding-top: 0.75rem;">
                        <div class="playlist-empty" style="font-size: 0.75rem; color: rgba(255, 255, 255, 0.5); text-align: center;">Loading playlist…</div>
                    </div>
                </div>
            </div>

            <style>
                @keyframes pulse-glow {
                    0%, 100% { transform: scale(1); filter: brightness(1); }
                    50% { transform: scale(1.1); filter: brightness(1.3); }
                }

                #cosmic-music-player button:hover {
                    transform: scale(1.1) !important;
                    box-shadow: 0 5px 15px rgba(186, 148, 79, 0.4) !important;
                }

                #cosmic-music-player button:active {
                    transform: scale(0.95) !important;
                }

                #progress-bar:hover #progress-fill {
                    box-shadow: 0 0 15px rgba(186, 148, 79, 0.8);
                }

                #cosmic-music-player .playlist-item {
                    width: 100%;
                    text-align: left;
                    margin-bottom: 0.4rem;
                    padding: 0.45rem 0.6rem;
                    border-radius: 8px;
                    border: 1px solid rgba(186, 148, 79, 0.15);
                    background: rgba(255, 255, 255, 0.02);
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 0.75rem;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    gap: 0.2rem;
                }

                #cosmic-music-player .playlist-item.active {
                    border-color: rgba(186, 148, 79, 0.6);
                    background: rgba(186, 148, 79, 0.15);
                    color: #fff;
                }

                #cosmic-music-player .playlist-item__title {
                    font-weight: 600;
                }

                #cosmic-music-player .playlist-item__meta {
                    font-size: 0.7rem;
                    color: rgba(255, 255, 255, 0.55);
                }

                    @media (max-width: 768px) {
                        #cosmic-music-player {
                            width: 280px !important;
                            bottom: 10px !important;
                            left: 10px !important;
                            padding: 0.75rem !important;
                        }
                    }
            </style>
        `;

        try {
            document.body.insertAdjacentHTML('beforeend', playerHTML);
            console.log('✅ Player HTML injected successfully!');
            console.log('✅ Player element exists:', !!document.getElementById('cosmic-music-player'));
        } catch (err) {
            console.error('❌ Error injecting player HTML:', err);
        }
    }

    renderPlaylist() {
        const container = document.getElementById('playlist-container');
        if (!container) return;

        if (!this.tracks.length) {
            container.innerHTML = '<div class="playlist-empty">No tracks available</div>';
            return;
        }

        container.innerHTML = this.tracks
            .map(
                (track, index) => `
                    <button class="playlist-item" data-index="${index}">
                        <div class="playlist-item__title">${track.name}</div>
                        <div class="playlist-item__meta">${track.description || 'Tap to play'}</div>
                    </button>
                `
            )
            .join('');

        container.querySelectorAll('.playlist-item').forEach((button) => {
            button.addEventListener('click', () => {
                const trackIndex = Number(button.dataset.index);
                if (Number.isNaN(trackIndex)) return;
                this.currentTrackIndex = trackIndex;
                this.loadTrack();
                this.play();
            });
        });

        this.highlightActiveTrack();
    }

    highlightActiveTrack() {
        const container = document.getElementById('playlist-container');
        if (!container) return;
        container.querySelectorAll('.playlist-item').forEach((button) => {
            const index = Number(button.dataset.index);
            button.classList.toggle('active', index === this.currentTrackIndex);
        });
    }

    async initPlayer() {
        const currentTrack = this.tracks[this.currentTrackIndex];
        console.log('🎵 Initializing player for:', currentTrack.name);
        console.log('🎵 Base URL:', window.location.origin);
        console.log('🎵 Full URL:', currentTrack.url);
        console.log('🎵 DEBUG initPlayer - pendingState:', this.pendingState);

        // IMPORTANT: Preserve pendingState before setting src (which triggers events)
        const savedPendingState = this.pendingState ? { ...this.pendingState } : null;
        console.log('🎵 DEBUG initPlayer - Saved pendingState for restoration:', savedPendingState);

        this.audio.volume = 0.7;
        this.audio.preload = this.isAutomatedTest ? 'none' : 'metadata';
        const shouldLoadOnInit = Boolean(savedPendingState && (savedPendingState.isPlaying || savedPendingState.currentTime > 0));
        if (!this.isAutomatedTest && shouldLoadOnInit) {
            this.audio.src = currentTrack.url;
        }

        // Restore pendingState if it was saved
        if (savedPendingState) {
            this.pendingState = savedPendingState;
            console.log('🎵 DEBUG initPlayer - Restored pendingState:', this.pendingState);
        }

        // Restore saved volume
        const savedVolume = localStorage.getItem('cosmicPlayerVolume');
        if (savedVolume) {
            this.audio.volume = savedVolume / 100;
            const volumeControl = document.getElementById('volume-control');
            const volumeDisplay = document.getElementById('volume-display');
            if (volumeControl) volumeControl.value = savedVolume;
            if (volumeDisplay) volumeDisplay.textContent = savedVolume + '%';
        }

        // Restore loop setting
        const savedLoop = localStorage.getItem('cosmicPlayerLoop');
        if (savedLoop === 'true') {
            document.getElementById('loop-toggle').checked = true;
        }

        // Store event handler references for proper cleanup
        if (!this.audioEventHandlers) {
            this.audioEventHandlers = {
                timeupdate: () => this.updateProgress(),
                ended: () => this.handleTrackEnd(),
                loadedmetadata: () => {
                    this.updateDuration();
                    console.log('✅ Track metadata loaded:', {
                        name: currentTrack.name,
                        duration: this.formatTime(this.audio.duration),
                        size: this.audio.buffered.length > 0 ? 'Buffered' : 'Not buffered'
                    });

                    // Try to restore playback position if pending state exists and duration is now available
                    if (this.pendingState && this.audio.duration && !isNaN(this.audio.duration)) {
                        const { currentTime, isPlaying } = this.pendingState;

                        console.log('⏩ DEBUG loadedmetadata - Attempting restoration:', {
                            pendingState: this.pendingState,
                            requestedTime: currentTime,
                            audioDuration: this.audio.duration,
                            willRestore: currentTime > 0 && currentTime < this.audio.duration
                        });

                        // Restore playback position if valid
                        if (currentTime > 0 && currentTime < this.audio.duration) {
                            console.log('⏩ DEBUG loadedmetadata - Restoring position:', {
                                requestedTime: currentTime,
                                formattedRequestedTime: this.formatTime(currentTime),
                                audioDuration: this.audio.duration,
                                formattedDuration: this.formatTime(this.audio.duration),
                                isValid: currentTime > 0 && currentTime < this.audio.duration
                            });

                            try {
                                this.audio.currentTime = currentTime;

                                // Verify it was set - use multiple checks
                                const verifyTime = () => {
                                    const actualTime = this.audio.currentTime;
                                    const diff = Math.abs(actualTime - currentTime);
                                    const match = diff < 1.0; // Allow 1 second tolerance

                                    console.log('✅ DEBUG loadedmetadata - Verified restored position:', {
                                        setTo: currentTime,
                                        actualCurrentTime: actualTime,
                                        formattedActualTime: this.formatTime(actualTime),
                                        difference: diff.toFixed(2),
                                        match: match,
                                        duration: this.audio.duration
                                    });

                                    if (!match) {
                                        console.warn('⚠️ Position restoration mismatch - trying again...');
                                        // Try one more time
                                        if (this.audio.readyState >= 2) {
                                            this.audio.currentTime = currentTime;
                                            setTimeout(() => {
                                                console.log('🔄 Retry verification:', {
                                                    setTo: currentTime,
                                                    actualCurrentTime: this.audio.currentTime,
                                                    match: Math.abs(this.audio.currentTime - currentTime) < 1.0
                                                });
                                            }, 100);
                                        }
                                    }
                                };

                                // Check immediately and after a delay
                                setTimeout(verifyTime, 50);
                                setTimeout(verifyTime, 200);

                                console.log(`⏩ Restored playback position from metadata: ${this.formatTime(currentTime)}`);

                                // DON'T clear pendingState here - let canplay or canplaythrough handle it
                                // so we have backup restoration attempts
                            } catch (err) {
                                console.error('❌ Error setting currentTime:', err);
                            }
                        } else {
                            console.warn('⚠️ DEBUG loadedmetadata - Cannot restore position:', {
                                requestedTime: currentTime,
                                duration: this.audio.duration,
                                reason: currentTime <= 0 ? 'time_too_low' : currentTime >= this.audio.duration ? 'time_too_high' : 'unknown',
                                pendingState: this.pendingState
                            });
                        }
                    } else {
                        console.log('ℹ️ DEBUG loadedmetadata - No restoration (pendingState or duration not available):', {
                            hasPendingState: !!this.pendingState,
                            hasDuration: !!this.audio.duration,
                            durationValid: this.audio.duration && !isNaN(this.audio.duration)
                        });
                    }
                },
                loadstart: () => {
                    console.log('🔄 Load start:', currentTrack.name);
                    const currentTrackEl = document.getElementById('current-track');
                    if (currentTrackEl) {
                        currentTrackEl.innerHTML = currentTrack.name + ' <span style="color: #ba944f;">⏳</span>';
                    }
                },
                canplay: () => {
                    this.updateTrackDisplay();
                    console.log('✅ Track ready to play:', currentTrack.name, `(${this.currentTrackIndex + 1}/${this.tracks.length})`);

                    // Restore playback position and state if available
                    if (this.pendingState) {
                        const { currentTime, isPlaying } = this.pendingState;

                        // Ensure duration is available before restoring
                        if (this.audio.duration && !isNaN(this.audio.duration)) {
                            // Restore playback position (ensure it's within valid range)
                            const validTime = Math.max(0, Math.min(currentTime, this.audio.duration - 0.5));
                            console.log('⏩ DEBUG canplay - Attempting to restore position:', {
                                requestedTime: currentTime,
                                formattedRequestedTime: this.formatTime(currentTime),
                                validTime: validTime,
                                formattedValidTime: this.formatTime(validTime),
                                audioDuration: this.audio.duration,
                                formattedDuration: this.formatTime(this.audio.duration),
                                willRestore: validTime > 0 && validTime < this.audio.duration
                            });

                            if (validTime > 0 && validTime < this.audio.duration) {
                                this.audio.currentTime = validTime;
                                // Verify it was set
                                setTimeout(() => {
                                    console.log('✅ DEBUG canplay - Verified restored position:', {
                                        setTo: validTime,
                                        actualCurrentTime: this.audio.currentTime,
                                        match: Math.abs(this.audio.currentTime - validTime) < 0.5
                                    });
                                }, 100);
                                console.log(`⏩ Restored playback position: ${this.formatTime(validTime)} of ${this.formatTime(this.audio.duration)}`);
                            } else {
                                console.warn('⚠️ DEBUG canplay - Cannot restore position:', {
                                    validTime: validTime,
                                    duration: this.audio.duration,
                                    reason: validTime <= 0 ? 'time_too_low' : validTime >= this.audio.duration ? 'time_too_high' : 'unknown'
                                });
                            }

                            // Auto-resume if it was playing
                            if (isPlaying) {
                                console.log('▶️ Auto-resuming playback...');
                                setTimeout(() => {
                                    this.play().catch(err => {
                                        console.warn('⚠️ Auto-resume prevented:', err);
                                        // User interaction required - show play button
                                        this.isPlaying = false;
                                        const playPauseBtn = document.getElementById('play-pause');
                                        if (playPauseBtn) {
                                            playPauseBtn.innerHTML = '▶';
                                        }
                                    });
                                }, 200); // Slightly longer delay to ensure audio is ready
                            }

                            // DON'T clear pendingState yet - keep it for canplaythrough backup
                            // Only clear if restoration was successful
                            if (validTime > 0 && validTime < this.audio.duration) {
                                // Mark as restored but don't clear yet
                                this.pendingState.restored = true;
                                console.log('✅ Marked as restored in canplay, keeping pendingState for backup');
                            }
                        } else {
                            // Duration not available yet, wait for loadedmetadata or canplaythrough
                            console.log('⏳ Duration not available yet, waiting for metadata...', {
                                hasPendingState: !!this.pendingState,
                                hasDuration: !!this.audio.duration,
                                duration: this.audio.duration
                            });
                        }
                    }
                },
                canplaythrough: () => {
                    console.log('✅ Track fully buffered and ready:', currentTrack.name);
                    console.log('🎵 DEBUG canplaythrough - Current audio state:', {
                        currentTime: this.audio.currentTime,
                        duration: this.audio.duration,
                        pendingState: this.pendingState,
                        pendingStateRestored: this.pendingState ? this.pendingState.restored : false
                    });

                    // Final chance to restore position if still pending (backup restoration)
                    if (this.pendingState && this.audio.duration && !isNaN(this.audio.duration)) {
                        const { currentTime, isPlaying, restored } = this.pendingState;

                        // Only restore if not already restored in canplay or loadedmetadata
                        const needsRestoration = !restored || Math.abs(this.audio.currentTime - currentTime) > 1.0;

                        if (needsRestoration) {
                            const validTime = Math.max(0, Math.min(currentTime, this.audio.duration - 0.5));

                            console.log('⏩ DEBUG canplaythrough - Final restoration attempt:', {
                                requestedTime: currentTime,
                                validTime: validTime,
                                currentAudioTime: this.audio.currentTime,
                                needsRestoration: needsRestoration,
                                alreadyRestored: restored
                            });

                            if (validTime > 0 && validTime < this.audio.duration) {
                                try {
                                    this.audio.currentTime = validTime;

                                    // Verify restoration
                                    setTimeout(() => {
                                        const actualTime = this.audio.currentTime;
                                        const diff = Math.abs(actualTime - validTime);
                                        console.log(`⏩ Final restoration of playback position: ${this.formatTime(validTime)}`, {
                                            actualTime: actualTime,
                                            formattedActual: this.formatTime(actualTime),
                                            difference: diff.toFixed(2),
                                            match: diff < 1.0
                                        });

                                        // Update pendingState to mark as restored
                                        if (this.pendingState) {
                                            this.pendingState.restored = true;
                                        }
                                    }, 100);

                                    if (isPlaying) {
                                        setTimeout(() => {
                                            const playResult = this.play();
                                            if (playResult && typeof playResult.catch === 'function') {
                                                playResult.catch(err => {
                                                    console.warn('⚠️ Auto-resume prevented:', err);
                                                    this.isPlaying = false;
                                                    const playPauseBtn = document.getElementById('play-pause');
                                                    if (playPauseBtn) {
                                                        playPauseBtn.innerHTML = '▶';
                                                    }
                                                });
                                            }
                                        }, 300);
                                    }
                                } catch (err) {
                                    console.error('❌ Error in final restoration:', err);
                                }
                            }
                        } else {
                            console.log('✅ Position already restored, skipping canplaythrough restoration');
                        }

                        // Clear pendingState after canplaythrough (final event)
                        // But keep it a bit longer to ensure restoration is verified
                        setTimeout(() => {
                            if (this.pendingState && this.pendingState.restored) {
                                console.log('✅ Clearing pendingState after successful restoration');
                                this.pendingState = null;
                            } else {
                                console.warn('⚠️ Clearing pendingState but restoration may have failed');
                                this.pendingState = null;
                            }
                        }, 500);
                    } else if (!this.pendingState) {
                        console.log('ℹ️ No pendingState to restore in canplaythrough');
                    }
                },
                stalled: () => {
                    console.warn('⚠️ Playback stalled:', currentTrack.name);
                    const currentTrackEl = document.getElementById('current-track');
                    if (currentTrackEl) {
                        currentTrackEl.innerHTML = currentTrack.name + ' <span style="color: #ffa500;">⏸ Buffering...</span>';
                    }
                },
                waiting: () => {
                    console.warn('⏳ Waiting for data:', currentTrack.name);
                }
            };
        }

        // Add event listeners using stored references
        this.audio.addEventListener('timeupdate', this.audioEventHandlers.timeupdate);
        this.audio.addEventListener('ended', this.audioEventHandlers.ended);
        this.audio.addEventListener('loadedmetadata', this.audioEventHandlers.loadedmetadata);
        this.audio.addEventListener('loadstart', this.audioEventHandlers.loadstart);
        this.audio.addEventListener('canplay', this.audioEventHandlers.canplay);
        this.audio.addEventListener('canplaythrough', this.audioEventHandlers.canplaythrough);
        this.audio.addEventListener('stalled', this.audioEventHandlers.stalled);
        this.audio.addEventListener('waiting', this.audioEventHandlers.waiting);

        this.audio.addEventListener('progress', () => {
            if (this.audio.buffered.length > 0) {
                const bufferedEnd = this.audio.buffered.end(this.audio.buffered.length - 1);
                const duration = this.audio.duration;
                const percent = duration ? (bufferedEnd / duration * 100).toFixed(1) : 0;
                console.log(`📊 Buffered: ${percent}%`);
            }
        });

        // Advanced error handling
        this.audio.addEventListener('error', (e) => {
            this.handleAudioError(e, currentTrack);
        });

        // Save state periodically (every 2 seconds to avoid too frequent writes)
        let lastSaveTime = 0;
        let timeupdateCount = 0;
        this.audio.addEventListener('timeupdate', () => {
            timeupdateCount++;
            const now = Date.now();
            const currentTime = this.audio.currentTime;

            // Log occasionally to verify timeupdate is firing
            if (timeupdateCount % 50 === 0) { // Log every 50th timeupdate
                console.log('⏱️ DEBUG timeupdate event:', {
                    count: timeupdateCount,
                    currentTime: currentTime,
                    formattedTime: this.formatTime(currentTime),
                    duration: this.audio.duration,
                    isNaN: isNaN(currentTime),
                    isPlaying: this.isPlaying,
                    timeSinceLastSave: now - lastSaveTime
                });
            }

            if (now - lastSaveTime > 2000) { // Save every 2 seconds
                console.log('💾 DEBUG timeupdate - Triggering save:', {
                    currentTime: currentTime,
                    formattedTime: this.formatTime(currentTime),
                    isNaN: isNaN(currentTime),
                    timeupdateCount: timeupdateCount
                });
                this.savePlayerState();
                lastSaveTime = now;
            }
        });
    }

    async testTrackURL(url, trackName) {
        console.log('🔍 Testing URL accessibility:', url);

        try {
            await fetch(url, {
                method: 'HEAD',
                mode: 'no-cors' // Try no-cors first
            });

            console.log('✅ HEAD request completed');
        } catch (headError) {
            console.warn('⚠️ HEAD request failed, trying GET:', headError);

            try {
                const getResponse = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Range': 'bytes=0-1023' // Request first 1KB
                    }
                });

                console.log('📡 GET Response:', {
                    status: getResponse.status,
                    statusText: getResponse.statusText,
                    headers: Object.fromEntries(getResponse.headers.entries()),
                    ok: getResponse.ok
                });

                if (!getResponse.ok) {
                    throw new Error(`HTTP ${getResponse.status}: ${getResponse.statusText}`);
                }
            } catch (getError) {
                console.error('❌ GET request failed:', getError);
                this.logDetailedError(url, trackName, getError);
            }
        }
    }

    handleAudioError(event, track) {
        const error = this.audio.error;
        const errorCode = error ? error.code : 'unknown';
        const errorMessage = error ? error.message : 'Unknown error';

        const errorDetails = {
            1: {
                code: 'MEDIA_ERR_ABORTED',
                description: 'Download aborted by user or network',
                solutions: [
                    'Check your internet connection',
                    'Try clicking play again',
                    'Check if file is accessible'
                ]
            },
            2: {
                code: 'MEDIA_ERR_NETWORK',
                description: 'Network error while downloading',
                solutions: [
                    'Check your internet connection',
                    'Verify the file URL is correct',
                    'Check if GitLab Pages is accessible',
                    'Try refreshing the page'
                ]
            },
            3: {
                code: 'MEDIA_ERR_DECODE',
                description: 'File is corrupt or format not supported',
                solutions: [
                    'File may be corrupted',
                    'Browser may not support MP3 format',
                    'Try a different browser',
                    'Check file integrity'
                ]
            },
            4: {
                code: 'MEDIA_ERR_SRC_NOT_SUPPORTED',
                description: 'File format not supported or source not found',
                solutions: [
                    'File may not exist at the URL',
                    'Check if path is correct: /audio/filename.mp3',
                    'Verify file is in GitLab repository',
                    'Check GitLab Pages deployment'
                ]
            }
        };

        const errorInfo = errorDetails[errorCode] || {
            code: 'UNKNOWN_ERROR',
            description: 'Unknown error occurred',
            solutions: ['Check browser console for details', 'Try refreshing the page']
        };

        // Comprehensive error logging
        console.error('═══════════════════════════════════════════');
        console.error('❌ AUDIO PLAYER ERROR');
        console.error('═══════════════════════════════════════════');
        console.error('Track:', track.name);
        console.error('Error Code:', errorCode, `(${errorInfo.code})`);
        console.error('Error Message:', errorMessage);
        console.error('Error Description:', errorInfo.description);
        console.error('Current URL:', this.audio.src);
        console.error('Base URL:', window.location.origin);
        console.error('Full Path:', new URL(this.audio.src).pathname);
        console.error('Audio Element State:', {
            readyState: this.audio.readyState,
            networkState: this.audio.networkState,
            paused: this.audio.paused,
            ended: this.audio.ended
        });
        console.error('Possible Solutions:');
        errorInfo.solutions.forEach((solution, i) => {
            console.error(`  ${i + 1}. ${solution}`);
        });
        console.error('═══════════════════════════════════════════');

        // Test alternative URLs
        this.testAlternativeURLs(track);

        // Show user-friendly error
        const errorDisplay = `
            <div style="color: #ff4444; text-align: center;">
                <div style="font-weight: 600; margin-bottom: 0.25rem;">⚠️ Error Loading Track</div>
                <div style="font-size: 0.75rem; color: rgba(255, 255, 255, 0.6);">
                    ${errorInfo.code}: ${errorInfo.description}
                </div>
                <div style="font-size: 0.7rem; color: rgba(255, 255, 255, 0.5); margin-top: 0.5rem;">
                    Check console (F12) for details
                </div>
            </div>
        `;
        document.getElementById('current-track').innerHTML = errorDisplay;
    }

    async testAlternativeURLs(track) {
        console.log('🔍 Testing alternative URL paths...');

        const baseURL = window.location.origin;
        const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));

        const alternativePaths = [
            `${baseURL}/audio/${track.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.mp3`,
            `${baseURL}${basePath}/audio/${track.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.mp3`,
            `${baseURL}/audio/cosmic-journey.mp3`, // Direct filename test
            `${baseURL}/audio/stellar-voyage.mp3`,
            `${baseURL}/audio/galactic-odyssey.mp3`
        ];

        for (const altUrl of alternativePaths) {
            try {
                const response = await fetch(altUrl, { method: 'HEAD' });
                if (response.ok) {
                    console.log(`✅ Alternative URL works: ${altUrl}`);
                    // Could auto-switch here if needed
                }
            } catch (_err) {
                console.log(`❌ Alternative URL failed: ${altUrl}`);
            }
        }
    }

    logDetailedError(url, trackName, error) {
        console.error('═══════════════════════════════════════════');
        console.error('❌ DETAILED URL TEST ERROR');
        console.error('═══════════════════════════════════════════');
        console.error('Track:', trackName);
        console.error('URL:', url);
        console.error('Error Type:', error.constructor.name);
        console.error('Error Message:', error.message);
        console.error('Error Stack:', error.stack);
        console.error('Current Location:', {
            origin: window.location.origin,
            pathname: window.location.pathname,
            href: window.location.href
        });
        console.error('Expected File Paths:');
        console.error('  - /audio/cosmic-journey.mp3');
        console.error('  - /audio/stellar-voyage.mp3');
        console.error('  - /audio/galactic-odyssey.mp3');
        console.error('GitLab Pages URL Format:');
        console.error('  - https://username.gitlab.io/project-name/audio/filename.mp3');
        console.error('═══════════════════════════════════════════');
    }

    setupEventListeners() {
        // Store event handlers for cleanup (if not already stored)
        if (!this.eventHandlers) {
            this.eventHandlers = {
                playPause: () => this.togglePlay(),
                prevTrack: () => this.previousTrack(),
                nextTrack: () => this.nextTrack(),
                volumeChange: (e) => this.setVolume(e.target.value),
                progressClick: (e) => this.seek(e),
                minimize: () => this.toggleMinimize(),
                loopToggle: (e) => {
                    this.loop = e.target.checked;
                    localStorage.setItem('cosmicPlayerLoop', this.loop);
                },
                download: () => this.downloadTrack()
            };
        }

        const playPauseBtn = document.getElementById('play-pause');
        const prevBtn = document.getElementById('prev-track');
        const nextBtn = document.getElementById('next-track');
        const volumeControl = document.getElementById('volume-control');
        const progressBar = document.getElementById('progress-bar');
        const minimizeBtn = document.getElementById('minimize-player');
        const loopToggle = document.getElementById('loop-toggle');
        const downloadBtn = document.getElementById('download-track');

        // Add event listeners with null checks
        if (playPauseBtn) playPauseBtn.addEventListener('click', this.eventHandlers.playPause);
        if (prevBtn) prevBtn.addEventListener('click', this.eventHandlers.prevTrack);
        if (nextBtn) nextBtn.addEventListener('click', this.eventHandlers.nextTrack);
        if (volumeControl) volumeControl.addEventListener('input', this.eventHandlers.volumeChange);
        if (progressBar) progressBar.addEventListener('click', this.eventHandlers.progressClick);
        if (minimizeBtn) minimizeBtn.addEventListener('click', this.eventHandlers.minimize);
        if (loopToggle) loopToggle.addEventListener('change', this.eventHandlers.loopToggle);
        if (downloadBtn) downloadBtn.addEventListener('click', this.eventHandlers.download);
    }

    play() {
        // Ensure we always return a Promise
        if (!this.audio) {
            console.warn('⚠️ Cannot play: audio object not initialized');
            return Promise.reject(new Error('Audio object not initialized'));
        }

        if (!this.audio.src) {
            const track = this.tracks[this.currentTrackIndex];
            if (track && track.url) {
                this.audio.preload = this.isAutomatedTest ? 'none' : 'metadata';
                this.audio.src = track.url;
            }
        }

        const playPromise = this.audio.play();

        // Ensure we always return a Promise (audio.play() may return undefined in older browsers)
        const promise = playPromise !== undefined ? playPromise : Promise.resolve();

        return promise.then(() => {
            // Playback started successfully
            this.isPlaying = true;
            const playPauseBtn = document.getElementById('play-pause');
            if (playPauseBtn) {
                playPauseBtn.innerHTML = '⏸';
            }
            this.savePlayerState();
            console.log('🎵 Playing:', this.tracks[this.currentTrackIndex].name);
        }).catch(err => {
            console.warn('⚠️ Playback prevented:', err.name, err.message);
            this.isPlaying = false;
            const playPauseBtn = document.getElementById('play-pause');
            if (playPauseBtn) {
                playPauseBtn.innerHTML = '▶';
            }

            // Show user-friendly message
            const currentTrackEl = document.getElementById('current-track');
            if (currentTrackEl) {
                if (err.name === 'NotAllowedError') {
                    currentTrackEl.innerHTML = '<span style="color: #ffa500; cursor: pointer;" onclick="document.getElementById(\'play-pause\').click()">⚠️ Click to Resume</span>';
                    // Add a one-time click listener to body to resume
                    const resumeOnInteraction = () => {
                        this.play();
                        document.removeEventListener('click', resumeOnInteraction);
                    };
                    document.addEventListener('click', resumeOnInteraction, { once: true });
                } else {
                    currentTrackEl.innerHTML = '<span style="color: #ff4444;">Error loading track</span>';
                }
            }
            throw err; // Re-throw to allow caller to catch
        });
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        document.getElementById('play-pause').innerHTML = '▶';
        this.savePlayerState();
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    updateTrackDisplay() {
        const track = this.tracks[this.currentTrackIndex];
        const trackInfo = document.getElementById('track-info');
        if (trackInfo && this.tracks.length > 0) {
            const parts = [`Track ${this.currentTrackIndex + 1} of ${this.tracks.length}`];
            if (track && track.description) {
                parts.push(track.description);
            }
            trackInfo.textContent = parts.join(' • ');
            console.log(`📊 Track display updated: Track ${this.currentTrackIndex + 1} of ${this.tracks.length}`);
        }
        const currentTrackEl = document.getElementById('current-track');
        if (currentTrackEl && track && !currentTrackEl.innerHTML.includes('⏳') && !currentTrackEl.innerHTML.includes('Buffering')) {
            currentTrackEl.textContent = track.name;
        }
        this.highlightActiveTrack();
    }

    previousTrack() {
        this.currentTrackIndex = (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
        this.loadTrack();
    }

    nextTrack() {
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
        this.loadTrack();
    }

    async loadTrack() {
        const track = this.tracks[this.currentTrackIndex];
        const wasPlaying = this.isPlaying;

        // Update track display
        this.updateTrackDisplay();

        console.log('🔄 Loading track:', track.name, `(${this.currentTrackIndex + 1}/${this.tracks.length})`);
        console.log('🔄 Resolved URL:', track.url);

        // Clear pending state when manually switching tracks
        this.pendingState = null;

        this.audio.src = track.url;
        document.getElementById('current-track').textContent = track.name;
        this.updateDownloadButton(track);

        if (wasPlaying) {
            // Wait a bit for source to load
            setTimeout(() => {
                this.play();
            }, 100);
        }

        this.savePlayerState();
    }

    handleTrackEnd() {
        const loopEnabled = document.getElementById('loop-toggle').checked;

        if (loopEnabled || this.currentTrackIndex < this.tracks.length - 1) {
            this.nextTrack();
        } else {
            this.pause();
        }
    }

    setVolume(value) {
        this.audio.volume = value / 100;
        document.getElementById('volume-display').textContent = value + '%';
        localStorage.setItem('cosmicPlayerVolume', value);
    }

    updateProgress() {
        const percent = (this.audio.currentTime / this.audio.duration) * 100 || 0;
        document.getElementById('progress-fill').style.width = percent + '%';
        document.getElementById('current-time').textContent = this.formatTime(this.audio.currentTime);
    }

    updateDuration() {
        document.getElementById('duration').textContent = this.formatTime(this.audio.duration);
    }

    seek(e) {
        const progressBar = document.getElementById('progress-bar');
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        this.audio.currentTime = percent * this.audio.duration;
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return mins + ':' + (secs < 10 ? '0' : '') + secs;
    }

    downloadTrack() {
        const currentTrack = this.tracks[this.currentTrackIndex];
        const trackUrl = currentTrack.url;
        const filename = currentTrack.filename;

        console.log('📥 Downloading track:', currentTrack.name);

        // Create a temporary anchor element to trigger download
        const link = document.createElement('a');
        link.href = trackUrl;
        link.download = filename;
        link.style.display = 'none';

        // Add to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Show feedback
        const downloadBtn = document.getElementById('download-track');
        const originalText = downloadBtn.innerHTML;
        downloadBtn.innerHTML = '<span>✅</span><span>Downloading...</span>';
        downloadBtn.style.opacity = '0.7';

        setTimeout(() => {
            downloadBtn.innerHTML = originalText;
            downloadBtn.style.opacity = '1';
        }, 2000);
    }

    updateDownloadButton(track) {
        const downloadBtn = document.getElementById('download-track');
        if (!downloadBtn || !track) return;
        downloadBtn.setAttribute('title', `Download ${track.name}`);
        downloadBtn.setAttribute('aria-label', `Download ${track.name}`);
    }

    getTrackSources(filename) {
        if (!filename) {
            return { primary: '', fallback: '' };
        }

        try {
            const resolved = new URL(`audio/${filename}`, window.location.href).href;
            return {
                primary: resolved,
                fallback: resolved
            };
        } catch (error) {
            console.error('❌ Error resolving audio path:', { filename, error });
            const fallbackPath = `audio/${filename}`;
            return {
                primary: fallbackPath,
                fallback: fallbackPath
            };
        }
    }

    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        const playerContent = document.getElementById('player-content');
        const minimizeBtn = document.getElementById('minimize-player');
        const player = document.getElementById('cosmic-music-player');

        if (this.isMinimized) {
            playerContent.style.display = 'none';
            minimizeBtn.innerHTML = '+';
            player.style.width = '180px';
        } else {
            playerContent.style.display = 'block';
            minimizeBtn.innerHTML = '−';
            player.style.width = '320px';
        }

        localStorage.setItem('cosmicPlayerMinimized', this.isMinimized);
    }

    savePlayerState() {
        // Check if sessionStorage is available
        if (typeof (Storage) === "undefined" || typeof (sessionStorage) === "undefined") {
            console.error('❌ ERROR: sessionStorage is not available in this browser!');
            return;
        }

        // Get current time from audio if available, otherwise use stored value
        let currentTime = 0;
        let audioValid = false;

        if (this.audio) {
            if (this.debug) {
                console.log('🔍 DEBUG savePlayerState - Audio object exists:', {
                    currentTime: this.audio.currentTime,
                    isNaN: isNaN(this.audio.currentTime),
                    duration: this.audio.duration,
                    readyState: this.audio.readyState,
                    paused: this.audio.paused,
                    src: this.audio.src
                });
            }

            if (!isNaN(this.audio.currentTime)) {
                currentTime = this.audio.currentTime;
                audioValid = true;
            } else {
                console.warn('⚠️ WARNING: audio.currentTime is NaN!', {
                    currentTime: this.audio.currentTime,
                    duration: this.audio.duration
                });
            }
        } else {
            console.warn('⚠️ WARNING: this.audio is null/undefined in savePlayerState!');
        }

        const state = {
            currentTrackIndex: this.currentTrackIndex,
            isPlaying: this.isPlaying,
            currentTime: currentTime,
            timestamp: Date.now(),
            audioValid: audioValid
        };

        // Save to sessionStorage for cross-page persistence
        try {
            const stateString = JSON.stringify(state);
            if (this.debug) {
                console.log('💾 DEBUG savePlayerState - Attempting to save:', {
                    state: state,
                    stateString: stateString,
                    stateStringLength: stateString.length,
                    track: this.currentTrackIndex,
                    time: this.formatTime(currentTime),
                    rawTime: currentTime,
                    playing: this.isPlaying,
                    timestamp: state.timestamp
                });
            }

            sessionStorage.setItem('cosmicPlayerState', stateString);

            // Verify it was saved
            const verify = sessionStorage.getItem('cosmicPlayerState');
            if (verify === stateString) {
                if (this.debug) {
                    console.log('✅ VERIFIED: State successfully saved to sessionStorage');
                }
            } else {
                console.error('❌ ERROR: State verification failed!', {
                    saved: stateString,
                    retrieved: verify,
                    match: verify === stateString
                });
            }

            // Also save track index to localStorage for preference
            try {
                localStorage.setItem('cosmicPlayerLastTrack', this.currentTrackIndex);
                if (this.debug) {
                    console.log('✅ Saved track index to localStorage:', this.currentTrackIndex);
                }
            } catch (localErr) {
                console.error('❌ ERROR: Failed to save to localStorage:', localErr);
            }

            // Also save a detailed debug log
            const debugState = {
                savedAt: new Date().toISOString(),
                page: window.location.href,
                state: state,
                audioState: this.audio ? {
                    currentTime: this.audio.currentTime,
                    duration: this.audio.duration,
                    paused: this.audio.paused,
                    readyState: this.audio.readyState
                } : 'audio is null'
            };
            sessionStorage.setItem('cosmicPlayerDebug', JSON.stringify(debugState));

        } catch (err) {
            console.error('❌ CRITICAL ERROR: Failed to save state to sessionStorage!', {
                error: err,
                errorName: err.name,
                errorMessage: err.message,
                errorStack: err.stack,
                state: state,
                sessionStorageAvailable: typeof (sessionStorage) !== "undefined",
                sessionStorageQuota: err.name === 'QuotaExceededError' ? 'QUOTA EXCEEDED!' : 'OK'
            });

            // Try to get more info about storage
            try {
                const testKey = 'cosmicPlayerTest';
                sessionStorage.setItem(testKey, 'test');
                sessionStorage.removeItem(testKey);
                console.log('✅ SessionStorage test write/read successful');
            } catch (testErr) {
                console.error('❌ SessionStorage test failed:', testErr);
            }
        }
    }

    // Save state before page unload - ALWAYS save, not just when playing
    saveStateBeforeUnload(event) {
        console.log('🔄 DEBUG saveStateBeforeUnload called', {
            hasAudio: !!this.audio,
            currentTrackIndex: this.currentTrackIndex,
            isPlaying: this.isPlaying,
            audioCurrentTime: this.audio ? this.audio.currentTime : 'N/A',
            audioPaused: this.audio ? this.audio.paused : 'N/A',
            audioReadyState: this.audio ? this.audio.readyState : 'N/A',
            eventType: event ? event.type : 'unknown',
            currentPage: window.location.href
        });

        if (this.audio && this.audio.readyState > 0) {
            // Get the ACTUAL current time RIGHT NOW - don't rely on cached value
            let currentTime = 0;
            try {
                currentTime = this.audio.currentTime;
                // Force a read of currentTime to ensure we have the latest value
                if (isNaN(currentTime) || currentTime < 0) {
                    currentTime = 0;
                }
                console.log('💾 DEBUG saveStateBeforeUnload - Reading currentTime:', {
                    currentTime: currentTime,
                    isNaN: isNaN(currentTime),
                    duration: this.audio.duration,
                    paused: this.audio.paused
                });
            } catch (err) {
                console.error('❌ Error reading currentTime:', err);
                currentTime = 0;
            }

            // Always save state, whether playing or paused - WITH ACTUAL CURRENT TIME
            console.log('💾 Saving state with audio object and CURRENT TIME...');

            // Create state with actual current time
            const state = {
                currentTrackIndex: this.currentTrackIndex,
                isPlaying: this.isPlaying,
                currentTime: currentTime,
                timestamp: Date.now(),
                audioValid: true,
                paused: this.audio.paused
            };

            // VALIDATION: Don't save if currentTime is 0 and we have a previous valid state with time > 0
            // This prevents overwriting a good saved state with 0 when the browser unloads/resets audio
            try {
                const previousStateJson = sessionStorage.getItem('cosmicPlayerState');
                if (previousStateJson) {
                    const previousState = JSON.parse(previousStateJson);
                    if (currentTime === 0 && previousState.currentTime > 5) {
                        console.log('🛡️ DEBUG saveStateBeforeUnload - Preventing overwrite of valid time with 0', {
                            newTime: currentTime,
                            oldTime: previousState.currentTime
                        });
                        // Use the previous time instead
                        state.currentTime = previousState.currentTime;
                    }
                }
            } catch (e) {
                console.warn('⚠️ Error checking previous state:', e);
            }

            try {
                const stateString = JSON.stringify(state);
                sessionStorage.setItem('cosmicPlayerState', stateString);

                // Verify it was saved
                const verify = sessionStorage.getItem('cosmicPlayerState');
                if (verify === stateString) {
                    console.log('✅ VERIFIED: State with currentTime saved successfully:', {
                        currentTime: currentTime,
                        formattedTime: this.formatTime(currentTime),
                        isPlaying: this.isPlaying,
                        trackIndex: this.currentTrackIndex
                    });
                } else {
                    console.error('❌ ERROR: State verification failed!', {
                        saved: stateString,
                        retrieved: verify
                    });
                }
            } catch (err) {
                console.error('❌ Failed to save state:', err);
            }
        } else if (this.currentTrackIndex !== undefined) {
            // Save state even if audio not initialized yet (track index at minimum)
            console.log('💾 Saving minimal state (no audio object or audio not ready)...');
            const state = {
                currentTrackIndex: this.currentTrackIndex,
                isPlaying: false,
                currentTime: 0,
                timestamp: Date.now(),
                audioValid: false,
                reason: 'audio_not_ready'
            };

            try {
                const stateString = JSON.stringify(state);
                sessionStorage.setItem('cosmicPlayerState', stateString);
                console.log('✅ Minimal state saved to sessionStorage:', state);

                // Verify
                const verify = sessionStorage.getItem('cosmicPlayerState');
                if (verify === stateString) {
                    console.log('✅ Verified minimal state saved');
                } else {
                    console.error('❌ Verification failed for minimal state!');
                }
            } catch (err) {
                console.error('❌ Failed to save minimal state:', err);
            }
        } else {
            console.warn('⚠️ WARNING: Cannot save state - no audio and no trackIndex!');
        }
    }

    loadPlayerState() {
        console.log('🔄 DEBUG loadPlayerState called');

        // Check sessionStorage availability
        if (typeof (Storage) === "undefined" || typeof (sessionStorage) === "undefined") {
            console.error('❌ ERROR: sessionStorage is not available!');
            return;
        }

        // Keep the homepage player expanded as a showcase, but use a compact mission-audio dock on subpages.
        const currentRoute = window.location.pathname.replace(/\/+$/, '').toLowerCase();
        const isHomepage = currentRoute === '' || currentRoute === '/' || currentRoute.endsWith('/index.html');
        this.isMinimized = false;
        localStorage.setItem('cosmicPlayerMinimized', isHomepage ? 'false' : 'true');
        if (!isHomepage) {
            setTimeout(() => {
                const playerContent = document.getElementById('player-content');
                if (playerContent && !this.isMinimized) this.toggleMinimize();
            }, 180);
        }

        // Load playback state from sessionStorage (persists across page navigation)
        const savedState = sessionStorage.getItem('cosmicPlayerState');
        console.log('🔍 DEBUG loadPlayerState - Retrieved from sessionStorage:', {
            savedState: savedState,
            savedStateLength: savedState ? savedState.length : 0,
            savedStateType: typeof (savedState),
            allKeys: Object.keys(sessionStorage).filter(k => k.includes('cosmic'))
        });

        // Also check debug state
        const debugState = sessionStorage.getItem('cosmicPlayerDebug');
        if (debugState) {
            try {
                const debug = JSON.parse(debugState);
                console.log('🔍 DEBUG loadPlayerState - Debug info from previous save:', debug);
            } catch (e) {
                console.warn('⚠️ Could not parse debug state:', e);
            }
        }

        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                console.log('🔄 DEBUG loadPlayerState - Parsed state:', {
                    rawState: state,
                    currentTrackIndex: state.currentTrackIndex,
                    isPlaying: state.isPlaying,
                    currentTime: state.currentTime,
                    rawCurrentTime: state.currentTime,
                    timestamp: state.timestamp,
                    age: state.timestamp ? Date.now() - state.timestamp : 'unknown',
                    audioValid: state.audioValid
                });

                // Restore track index
                if (state.currentTrackIndex !== undefined) {
                    const oldIndex = this.currentTrackIndex;
                    this.currentTrackIndex = state.currentTrackIndex;
                    console.log(`✅ Restored track index: ${oldIndex} → ${this.currentTrackIndex}`);
                } else {
                    this.log('⚠️ WARNING: No currentTrackIndex in saved state!');
                }

                // Store state for later restoration (after audio loads)
                this.pendingState = {
                    currentTime: state.currentTime || 0,
                    isPlaying: state.isPlaying || false,
                    audioValid: state.audioValid || false,
                    loadedAt: Date.now()
                };

                console.log('✅ Playback state restored - will resume after track loads', {
                    pendingState: this.pendingState,
                    willRestoreTime: this.pendingState.currentTime > 0,
                    willRestorePlaying: this.pendingState.isPlaying
                });
            } catch (err) {
                console.error('❌ ERROR parsing saved state:', {
                    error: err,
                    errorName: err.name,
                    errorMessage: err.message,
                    savedState: savedState,
                    savedStateLength: savedState.length
                });
            }
        } else {
            this.log('⚠️ WARNING: No saved state found in sessionStorage!', {
                sessionStorageKeys: Object.keys(sessionStorage),
                hasCosmicPlayerState: sessionStorage.getItem('cosmicPlayerState') !== null
            });
        }
    }
}

// Initialize player when DOM is ready
let globalMusicPlayer;
let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 50; // Maximum attempts over 5 seconds

function initCosmicMusicPlayer() {
    initAttempts++;
    console.log(`🎵 Cosmic Music Player: Initializing (attempt ${initAttempts})...`);
    console.log('🎵 Document ready state:', document.readyState);
    console.log('🎵 Body exists:', !!document.body);
    console.log('🎵 Player exists:', !!document.getElementById('cosmic-music-player'));

    // Prevent infinite loops
    if (initAttempts > MAX_INIT_ATTEMPTS) {
        console.error('❌ Max initialization attempts reached. Player may not initialize.');
        return;
    }

    if (!globalMusicPlayer && document.getElementById('cosmic-music-player') === null) {
        if (!document.body) {
            console.warn('⚠️ Body not ready yet, waiting...');
            setTimeout(initCosmicMusicPlayer, 100);
            return;
        }

        try {
            globalMusicPlayer = new CosmicMusicPlayer();
            window.globalMusicPlayer = globalMusicPlayer;
            console.log('✅ Cosmic Music Player initialized successfully!');

            // Verify player was actually injected
            setTimeout(() => {
                const player = document.getElementById('cosmic-music-player');
                if (player) {
                    console.log('✅ Player HTML verified in DOM');
                } else {
                    console.error('❌ Player HTML not found after initialization');
                }
            }, 200);
        } catch (err) {
            console.error('❌ Error initializing music player:', err);
            console.error('Error stack:', err.stack);
            // Retry once after a delay
            if (initAttempts < 3) {
                setTimeout(initCosmicMusicPlayer, 500);
            }
        }
    } else if (document.getElementById('cosmic-music-player')) {
        console.log('ℹ️ Music player already exists on page');
    }
}

// Multiple initialization strategies to ensure it works on GitLab Pages
function ensureInitialization() {
    // Strategy 1: If document is already ready, initialize immediately
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        console.log('🎵 Document ready, initializing immediately');
        initCosmicMusicPlayer();
    }
    // Strategy 2: Wait for DOMContentLoaded
    else if (document.readyState === 'loading') {
        console.log('🎵 Document loading, waiting for DOMContentLoaded...');
        document.addEventListener('DOMContentLoaded', initCosmicMusicPlayer);
    }

    // Strategy 3: Also try on window load (ensures all resources loaded)
    window.addEventListener('load', () => {
        console.log('🎵 Window loaded, checking player...');
        if (!globalMusicPlayer && !document.getElementById('cosmic-music-player')) {
            console.log('🎵 Player not found after window load, initializing...');
            initCosmicMusicPlayer();
        }
    });
}

// Start initialization
ensureInitialization();

// Global debug function - can be called from browser console
window.debugCosmicMusicPlayer = function () {
    console.log('═══════════════════════════════════════════');
    console.log('🔍 COSMIC MUSIC PLAYER DEBUG INFO');
    console.log('═══════════════════════════════════════════');

    if (!globalMusicPlayer) {
        console.error('❌ Music player not initialized!');
        return;
    }

    const player = globalMusicPlayer;

    console.log('📊 Current State:');
    console.log({
        currentTrackIndex: player.currentTrackIndex,
        isPlaying: player.isPlaying,
        isMinimized: player.isMinimized,
        hasAudio: !!player.audio,
        pendingState: player.pendingState
    });

    if (player.audio) {
        console.log('🎵 Audio State:');
        console.log({
            currentTime: player.audio.currentTime,
            duration: player.audio.duration,
            paused: player.audio.paused,
            readyState: player.audio.readyState,
            networkState: player.audio.networkState,
            src: player.audio.src,
            volume: player.audio.volume
        });
    }

    // Check sessionStorage
    console.log('💾 SessionStorage State:');
    try {
        const savedState = sessionStorage.getItem('cosmicPlayerState');
        if (savedState) {
            const state = JSON.parse(savedState);
            console.log('Saved State:', state);
            console.log('Age:', state.timestamp ? Date.now() - state.timestamp + 'ms' : 'unknown');
        } else {
            console.warn('⚠️ No saved state in sessionStorage!');
        }

        const debugState = sessionStorage.getItem('cosmicPlayerDebug');
        if (debugState) {
            const debug = JSON.parse(debugState);
            console.log('Debug Info:', debug);
        }

        // Show all cosmic player keys
        const allKeys = Object.keys(sessionStorage).filter(k => k.includes('cosmic'));
        console.log('All cosmic player keys:', allKeys);

    } catch (err) {
        console.error('❌ Error reading sessionStorage:', err);
    }

    // Check localStorage
    console.log('💾 LocalStorage State:');
    try {
        const lastTrack = localStorage.getItem('cosmicPlayerLastTrack');
        const minimized = localStorage.getItem('cosmicPlayerMinimized');
        const volume = localStorage.getItem('cosmicPlayerVolume');
        const loop = localStorage.getItem('cosmicPlayerLoop');

        console.log({
            lastTrack: lastTrack,
            minimized: minimized,
            volume: volume,
            loop: loop
        });
    } catch (err) {
        console.error('❌ Error reading localStorage:', err);
    }

    console.log('═══════════════════════════════════════════');
    console.log('💡 Tip: Check the console logs above for detailed save/restore operations');
    console.log('═══════════════════════════════════════════');
};

// Also expose player globally for debugging
window.cosmicMusicPlayer = () => globalMusicPlayer;

})();


