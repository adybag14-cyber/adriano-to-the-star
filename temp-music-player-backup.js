// Universal Cosmic Music Player - Available across all pages
// Auto-initializes and persists across the website

class CosmicMusicPlayer {
    constructor() {
        console.log('🎵 CosmicMusicPlayer: Constructor called');
        
        // Stream directly from GitLab-hosted files (no backend needed!)
        // When deployed to GitLab Pages, files are served from your repository
        const BASE_URL = window.location.origin;
        const BASE_PATH = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
        
        // Log environment info for debugging
        console.log('🎵 Music Player Environment:', {
            origin: BASE_URL,
            pathname: window.location.pathname,
            basePath: BASE_PATH,
            protocol: window.location.protocol,
            host: window.location.host
        });
        
        // Try multiple URL formats for GitLab Pages compatibility
        const getTrackURL = (filename) => {
            // Primary: root-relative path (works for GitLab Pages)
            const primary = `${BASE_URL}/audio/${filename}`;
            // Fallback: relative to current page
            const fallback = `${BASE_URL}${BASE_PATH}/audio/${filename}`;
            
            return {
                primary: primary,
                fallback: fallback,
                filename: filename
            };
        };
        
        this.tracks = [
            { 
                name: 'Track 1: Cosmic Journey',
                url: getTrackURL('cosmic-journey.mp3').primary,
                fallbackUrl: getTrackURL('cosmic-journey.mp3').fallback,
                filename: 'cosmic-journey.mp3'
            },
            { 
                name: 'Track 2: Stellar Voyage',
                url: getTrackURL('stellar-voyage.mp3').primary,
                fallbackUrl: getTrackURL('stellar-voyage.mp3').fallback,
                filename: 'stellar-voyage.mp3'
            },
            { 
                name: 'Track 3: Galactic Odyssey',
                url: getTrackURL('galactic-odyssey.mp3').primary,
                fallbackUrl: getTrackURL('galactic-odyssey.mp3').fallback,
                filename: 'galactic-odyssey.mp3'
            },
            { 
                name: 'Track 4: Celestial Harmony',
                url: getTrackURL('track-4.mp3').primary,
                fallbackUrl: getTrackURL('track-4.mp3').fallback,
                filename: 'track-4.mp3'
            },
            { 
                name: 'Track 5: Stellar Dreams',
                url: getTrackURL('track-5.mp3').primary,
                fallbackUrl: getTrackURL('track-5.mp3').fallback,
                filename: 'track-5.mp3'
            },
            { 
                name: 'Track 6: Cosmic Resonance',
                url: getTrackURL('track-6.mp3').primary,
                fallbackUrl: getTrackURL('track-6.mp3').fallback,
                filename: 'track-6.mp3'
            },
            { 
                name: 'Track 7: Nebula Waves',
                url: getTrackURL('track-7.mp3').primary,
                fallbackUrl: getTrackURL('track-7.mp3').fallback,
                filename: 'track-7.mp3'
            },
            { 
                name: 'Track 8: Interstellar Echo',
                url: getTrackURL('track-8.mp3').primary,
                fallbackUrl: getTrackURL('track-8.mp3').fallback,
                filename: 'track-8.mp3'
            },
            { 
                name: 'Track 9: Galactic Pulse',
                url: getTrackURL('track-9.mp3').primary,
                fallbackUrl: getTrackURL('track-9.mp3').fallback,
                filename: 'track-9.mp3'
            },
            { 
                name: 'Track 10: Cosmic Drift',
                url: getTrackURL('track-10.mp3').primary,
                fallbackUrl: getTrackURL('track-10.mp3').fallback,
                filename: 'track-10.mp3'
            },
            { 
                name: 'Track 11: Stellar Winds',
                url: getTrackURL('track-11.mp3').primary,
                fallbackUrl: getTrackURL('track-11.mp3').fallback,
                filename: 'track-11.mp3'
            },
            { 
                name: 'Track 12: Nebula Dreams',
                url: getTrackURL('track-12.mp3').primary,
                fallbackUrl: getTrackURL('track-12.mp3').fallback,
                filename: 'track-12.mp3'
            },
            { 
                name: 'Track 13: Galactic Currents',
                url: getTrackURL('track-13.mp3').primary,
                fallbackUrl: getTrackURL('track-13.mp3').fallback,
                filename: 'track-13.mp3'
            },
            { 
                name: 'Track 14: Cosmic Tides',
                url: getTrackURL('track-14.mp3').primary,
                fallbackUrl: getTrackURL('track-14.mp3').fallback,
                filename: 'track-14.mp3'
            },
            { 
                name: 'Track 15: Stellar Flow',
                url: getTrackURL('track-15.mp3').primary,
                fallbackUrl: getTrackURL('track-15.mp3').fallback,
                filename: 'track-15.mp3'
            },
            { 
                name: 'Track 16: Nebula Stream',
                url: getTrackURL('track-16.mp3').primary,
                fallbackUrl: getTrackURL('track-16.mp3').fallback,
                filename: 'track-16.mp3'
            },
            { 
                name: 'Track 17: Galactic Waves',
                url: getTrackURL('track-17.mp3').primary,
                fallbackUrl: getTrackURL('track-17.mp3').fallback,
                filename: 'track-17.mp3'
            },
            { 
                name: 'Track 18: Cosmic Horizon',
                url: getTrackURL('track-18.mp3').primary,
                fallbackUrl: getTrackURL('track-18.mp3').fallback,
                filename: 'track-18.mp3'
            }
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
        
        // Update track display immediately after HTML injection
        setTimeout(() => {
            this.updateTrackDisplay();
            console.log(`✅ Initial track display: ${this.tracks.length} tracks available`);
        }, 100);
        
        console.log('🎵 Initializing audio player...');
        this.initPlayer();
        
        console.log('🎵 Setting up event listeners...');
        this.setupEventListeners();
        
        // Setup page navigation persistence
        this.setupNavigationPersistence();
        
        console.log('🎵 CosmicMusicPlayer: Constructor complete!');
    }
    
    setupNavigationPersistence() {
        // Save state when navigating away
        window.addEventListener('beforeunload', () => {
            this.saveStateBeforeUnload();
        });
        
        // Save state when page becomes hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveStateBeforeUnload();
            }
        });
        
        // Save state periodically while playing
        this.saveStateInterval = setInterval(() => {
            if (this.isPlaying && this.audio && !this.audio.paused) {
                this.savePlayerState();
            }
        }, 5000); // Save every 5 seconds while playing
        
        console.log('✅ Navigation persistence enabled');
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
            <div id="cosmic-music-player" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999; background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 20, 30, 0.98)); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 15px; padding: 1rem; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(186, 148, 79, 0.2); backdrop-filter: blur(10px); width: 320px; transition: all 0.3s ease;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 1.5rem; animation: pulse-glow 2s infinite;">🎵</span>
                        <h4 style="margin: 0; color: #ba944f; font-size: 0.9rem; font-family: 'Raleway', sans-serif; font-weight: 600;">Cosmic Playlist</h4>
                    </div>
                    <button id="minimize-player" style="background: none; border: none; color: #ba944f; cursor: pointer; font-size: 1.2rem; padding: 0.25rem; transition: transform 0.2s;">−</button>
                </div>
                
                <div id="player-content">
                    <div id="current-track" style="color: rgba(255, 255, 255, 0.9); font-size: 0.85rem; margin-bottom: 0.5rem; font-weight: 500; text-align: center;">Track 1: Cosmic Journey</div>
                    <div id="track-info" style="color: rgba(255, 255, 255, 0.5); font-size: 0.7rem; margin-bottom: 0.75rem; text-align: center;">Track 1 of 18</div>
                    
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                        <span id="current-time" style="font-size: 0.75rem; color: rgba(255, 255, 255, 0.6); font-family: monospace;">0:00</span>
                        <div id="progress-bar" style="flex: 1; height: 6px; background: rgba(255, 255, 255, 0.2); border-radius: 3px; cursor: pointer; position: relative; overflow: hidden;">
                            <div id="progress-fill" style="height: 100%; width: 0%; background: linear-gradient(90deg, #ba944f, #ffd700); border-radius: 3px; transition: width 0.1s linear; box-shadow: 0 0 10px rgba(186, 148, 79, 0.5);"></div>
                        </div>
                        <span id="duration" style="font-size: 0.75rem; color: rgba(255, 255, 255, 0.6); font-family: monospace;">0:00</span>
                    </div>
                    
                    <div style="display: flex; justify-content: center; align-items: center; gap: 1rem; margin-bottom: 0.75rem;">
                        <button id="prev-track" style="background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 50%; width: 35px; height: 35px; cursor: pointer; color: #ba944f; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;">⏮</button>
                        <button id="play-pause" style="background: rgba(186, 148, 79, 0.3); border: 2px solid #ba944f; border-radius: 50%; width: 45px; height: 45px; cursor: pointer; color: #ba944f; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; box-shadow: 0 0 15px rgba(186, 148, 79, 0.3);">▶</button>
                        <button id="next-track" style="background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 50%; width: 35px; height: 35px; cursor: pointer; color: #ba944f; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;">⏭</button>
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
                
                @media (max-width: 768px) {
                    #cosmic-music-player {
                        width: 280px !important;
                        bottom: 10px !important;
                        right: 10px !important;
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
    
    async initPlayer() {
        const currentTrack = this.tracks[this.currentTrackIndex];
        console.log('🎵 Initializing player for:', currentTrack.name);
        console.log('🎵 Base URL:', window.location.origin);
        console.log('🎵 Full URL:', currentTrack.url);
        
        // Test URL accessibility first
        await this.testTrackURL(currentTrack.url, currentTrack.name);
        
        this.audio.src = currentTrack.url;
        this.audio.volume = 0.7;
        this.audio.preload = 'metadata';
        
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
                        
                        // Restore playback position
                        if (currentTime > 0 && currentTime < this.audio.duration) {
                            this.audio.currentTime = currentTime;
                            console.log(`⏩ Restored playback position: ${this.formatTime(currentTime)}`);
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
                            }, 100);
                        }
                        
                        // Clear pending state
                        this.pendingState = null;
                    }
                },
                canplaythrough: () => {
                    console.log('✅ Track fully buffered and ready:', currentTrack.name);
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
        this.audio.addEventListener('timeupdate', () => {
            const now = Date.now();
            if (now - lastSaveTime > 2000) { // Save every 2 seconds
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
        const playPromise = this.audio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                // Playback started successfully
                this.isPlaying = true;
                document.getElementById('play-pause').innerHTML = '⏸';
                this.savePlayerState();
                console.log('🎵 Playing:', this.tracks[this.currentTrackIndex].name);
            }).catch(err => {
                console.warn('⚠️ Playback prevented:', err.name, err.message);
                this.isPlaying = false;
                document.getElementById('play-pause').innerHTML = '▶';
                
                // Show user-friendly message
                if (err.name === 'NotAllowedError') {
                    document.getElementById('current-track').innerHTML = '<span style="color: #ffa500;">Click ▶ to start music</span>';
                } else {
                    document.getElementById('current-track').innerHTML = '<span style="color: #ff4444;">Error loading track</span>';
                }
            });
        }
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
            trackInfo.textContent = `Track ${this.currentTrackIndex + 1} of ${this.tracks.length}`;
            console.log(`📊 Track display updated: Track ${this.currentTrackIndex + 1} of ${this.tracks.length}`);
        }
        const currentTrackEl = document.getElementById('current-track');
        if (currentTrackEl && track && !currentTrackEl.innerHTML.includes('⏳') && !currentTrackEl.innerHTML.includes('Buffering')) {
            currentTrackEl.textContent = track.name;
        }
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
        console.log('🔄 Primary URL:', track.url);
        console.log('🔄 Fallback URL:', track.fallbackUrl);
        
        // Clear pending state when manually switching tracks
        this.pendingState = null;
        
        // Try primary URL first
        try {
            this.audio.src = track.url;
            document.getElementById('current-track').textContent = track.name;
            
            // Test if URL is accessible
            await this.testTrackURL(track.url, track.name);
        } catch (error) {
            console.warn('⚠️ Primary URL failed, trying fallback:', error);
            
            // Try fallback URL
            if (track.fallbackUrl) {
                this.audio.src = track.fallbackUrl;
                console.log('🔄 Using fallback URL:', track.fallbackUrl);
            }
        }
        
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
        const state = {
            currentTrackIndex: this.currentTrackIndex,
            isPlaying: this.isPlaying,
            currentTime: this.audio.currentTime || 0,
            timestamp: Date.now()
        };
        
        // Save to sessionStorage for cross-page persistence
        sessionStorage.setItem('cosmicPlayerState', JSON.stringify(state));
        
        // Also save track index to localStorage for preference
        localStorage.setItem('cosmicPlayerLastTrack', this.currentTrackIndex);
    }
    
    // Save state before page unload
    saveStateBeforeUnload() {
        if (this.audio && !this.audio.paused) {
            // Save current state
            this.savePlayerState();
            console.log('💾 Saved playback state before page navigation');
        }
    }
    
    loadPlayerState() {
        // Load persistent settings from localStorage
        const savedMinimized = localStorage.getItem('cosmicPlayerMinimized');
        if (savedMinimized === 'true') {
            this.isMinimized = true;
            // Will be applied after HTML injection
            setTimeout(() => {
                if (document.getElementById('player-content')) {
                    this.toggleMinimize();
                }
            }, 100);
        }
        
        // Load playback state from sessionStorage (persists across page navigation)
        const savedState = sessionStorage.getItem('cosmicPlayerState');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                console.log('🔄 Restoring playback state:', state);
                
                // Restore track index
                if (state.currentTrackIndex !== undefined) {
                    this.currentTrackIndex = state.currentTrackIndex;
                }
                
                // Store state for later restoration (after audio loads)
                this.pendingState = {
                    currentTime: state.currentTime || 0,
                    isPlaying: state.isPlaying || false
                };
                
                console.log('✅ Playback state restored - will resume after track loads');
            } catch (err) {
                console.warn('⚠️ Error parsing saved state:', err);
            }
        }
    }
}

// Initialize player when DOM is ready
let globalMusicPlayer;

function initCosmicMusicPlayer() {
    console.log('🎵 Cosmic Music Player: Initializing...');
    console.log('🎵 Document ready state:', document.readyState);
    console.log('🎵 Body exists:', !!document.body);
    console.log('🎵 Player exists:', !!document.getElementById('cosmic-music-player'));
    
    if (!globalMusicPlayer && document.getElementById('cosmic-music-player') === null) {
        if (!document.body) {
            console.warn('⚠️ Body not ready yet, waiting...');
            setTimeout(initCosmicMusicPlayer, 100);
            return;
        }
        
        try {
            globalMusicPlayer = new CosmicMusicPlayer();
            console.log('✅ Cosmic Music Player initialized successfully!');
        } catch (err) {
            console.error('❌ Error initializing music player:', err);
        }
    } else if (document.getElementById('cosmic-music-player')) {
        console.log('ℹ️ Music player already exists on page');
    }
}

// Auto-initialize
if (document.readyState === 'loading') {
    console.log('🎵 Document still loading, waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', initCosmicMusicPlayer);
} else {
    console.log('🎵 Document already loaded, initializing immediately');
    initCosmicMusicPlayer();
}

