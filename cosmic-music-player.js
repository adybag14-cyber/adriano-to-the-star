/**
 * Cosmic Playlist
 *
 * A small, dependency-free audio controller shared by the static GitLab Pages
 * site. It intentionally exposes the legacy `window.cosmicMusicPlayer()` API so
 * existing landing, database, Android WebView, and keyboard integrations keep
 * working while using one race-free source of player state.
 */
(function () {
  'use strict';

  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__cosmicMusicPlayerJsLoaded) return;
  window.__cosmicMusicPlayerJsLoaded = true;

  const STORAGE = {
    volume: 'cosmicPlayerVolume',
    loop: 'cosmicPlayerLoop',
    minimized: 'cosmicPlayerMinimized',
    session: 'cosmicPlayerState'
  };

  const FALLBACK_TRACKS = [
    ['Track 1: Cosmic Journey', 'cosmic-journey.mp3', 'Deep space ambience'],
    ['Track 2: Stellar Voyage', 'stellar-voyage.mp3', 'Gliding across the stars'],
    ['Track 3: Galactic Odyssey', 'galactic-odyssey.mp3', 'Epic sci-fi score'],
    ['Track 4: Celestial Harmony', 'track-4.mp3', 'Soft harmonic waves'],
    ['Track 5: Stellar Dreams', 'track-5.mp3', 'Dreamy synth pads'],
    ['Track 6: Cosmic Resonance', 'track-6.mp3', 'Vibrant cosmic pulses'],
    ['Track 7: Nebula Waves', 'track-7.mp3', 'Slow-moving nebula swells'],
    ['Track 8: Interstellar Echo', 'track-8.mp3', 'Echoes from distant systems'],
    ['Track 9: Galactic Pulse', 'track-9.mp3', 'Energetic pulse progression'],
    ['Track 10: Cosmic Drift', 'track-10.mp3', 'Floating through quiet space'],
    ['Track 11: Stellar Winds', 'track-11.mp3', 'Gentle winds over synth fields'],
    ['Track 12: Nebula Dreams', 'track-12.mp3', 'Dreaming inside a nebula'],
    ['Track 13: Galactic Currents', 'track-13.mp3', 'Flowing arpeggiated lines'],
    ['Track 14: Cosmic Tides', 'track-14.mp3', 'Oceanic cosmic ambience'],
    ['Track 15: Stellar Flow', 'track-15.mp3', 'Flowing melodic textures'],
    ['Track 16: Nebula Stream', 'track-16.mp3', 'Gentle electronic stream'],
    ['Track 17: Galactic Waves', 'track-17.mp3', 'Layered waveforms and pads'],
    ['Track 18: Cosmic Horizon', 'track-18.mp3', 'Closing credits among the stars'],
    ['Track 19: Was Ist Dein Lieblingsfach', 'was-ist-dein-lieblingsfach.mp3', 'German educational track']
  ];

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const escapeHtml = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  class CosmicMusicPlayer {
    constructor() {
      this.scriptUrl = document.currentScript?.src || new URL('cosmic-music-player.js', location.href).href;
      this.assetBase = new URL('.', this.scriptUrl);
      this.audioBase = new URL('audio/', this.assetBase);
      this.manifestUrl = new URL('audio/manifest.json', this.assetBase);
      this.tracks = FALLBACK_TRACKS.map(track => this.createTrack(...track));
      this.currentTrackIndex = 0;
      this.audio = new Audio();
      this.audio.preload = 'metadata';
      this.isPlaying = false;
      this.loop = localStorage.getItem(STORAGE.loop) === 'true';
      this.restoreTime = 0;
      this.pendingAutoplay = false;
      this.lastSavedSecond = -1;

      const route = location.pathname.replace(/\/+$/, '').toLowerCase();
      const homepage = route === '' || route === '/' || route.endsWith('/index.html');
      const compactViewport = matchMedia('(max-width: 760px)').matches;
      const savedMinimized = localStorage.getItem(STORAGE.minimized);
      this.isMinimized = savedMinimized == null ? (!homepage || compactViewport) : savedMinimized === 'true';

      this.restoreSession();
      this.ensureStylesheet();
      this.injectPlayer();
      this.bindControls();
      this.bindAudio();
      this.renderPlaylist();
      this.updateTrackUi();
      this.updateMinimizedUi();
      this.loadManifest();

      addEventListener('pagehide', () => this.saveSession());
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.saveSession();
      });
    }

    createTrack(name, filename, description = '') {
      return {
        name: String(name || 'Untitled track'),
        filename: String(filename || ''),
        description: String(description || ''),
        url: new URL(String(filename || ''), this.audioBase).href
      };
    }

    ensureStylesheet() {
      if (document.querySelector('link[href*="ita-music-player.css"]')) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = new URL('ita-music-player.css', this.assetBase).href;
      document.head.appendChild(link);
    }

    restoreSession() {
      try {
        const state = JSON.parse(sessionStorage.getItem(STORAGE.session) || 'null');
        if (!state || typeof state !== 'object') return;
        if (Number.isInteger(state.trackIndex)) this.currentTrackIndex = Math.max(0, state.trackIndex);
        if (Number.isFinite(state.currentTime)) this.restoreTime = Math.max(0, state.currentTime);
        this.pendingAutoplay = Boolean(state.playing);
      } catch {
        sessionStorage.removeItem(STORAGE.session);
      }

      const volume = Number(localStorage.getItem(STORAGE.volume));
      this.audio.volume = Number.isFinite(volume) ? clamp(volume / 100, 0, 1) : 0.7;
    }

    saveSession() {
      try {
        sessionStorage.setItem(STORAGE.session, JSON.stringify({
          trackIndex: this.currentTrackIndex,
          currentTime: Number.isFinite(this.audio.currentTime) ? this.audio.currentTime : 0,
          playing: !this.audio.paused && !this.audio.ended
        }));
      } catch {
        // Storage can be disabled in strict/privacy browsing modes. Playback
        // remains fully functional for the current document in that case.
      }
    }

    injectPlayer() {
      document.getElementById('cosmic-music-player')?.remove();
      const player = document.createElement('aside');
      player.id = 'cosmic-music-player';
      player.setAttribute('aria-label', 'Cosmic Playlist audio player');
      player.style.width = this.isMinimized ? '180px' : '320px';
      player.innerHTML = `
        <div class="ita-player-header">
          <div class="ita-player-brand"><span aria-hidden="true">🎵</span><span class="ita-player-title">Cosmic Playlist</span></div>
          <button id="minimize-player" type="button" aria-controls="player-content"></button>
        </div>
        <div id="player-content">
          <div id="current-track" aria-live="polite"></div>
          <div id="track-info"></div>
          <div id="playback-status" role="status" aria-live="polite">Ready</div>
          <div class="ita-player-progress-row">
            <span id="current-time">0:00</span>
            <input id="track-progress" type="range" min="0" max="1000" value="0" aria-label="Track position">
            <span id="duration">0:00</span>
          </div>
          <div class="ita-player-transport">
            <button id="prev-track" type="button" aria-label="Previous track">⏮</button>
            <button id="play-pause" type="button" aria-label="Play">▶</button>
            <button id="next-track" type="button" aria-label="Next track">⏭</button>
          </div>
          <div class="ita-player-volume-row">
            <span aria-hidden="true">🔊</span>
            <label class="sr-only" for="volume-control">Playlist volume</label>
            <input id="volume-control" type="range" min="0" max="100" value="${Math.round(this.audio.volume * 100)}" aria-label="Playlist volume">
            <span id="volume-display">${Math.round(this.audio.volume * 100)}%</span>
          </div>
          <label class="ita-player-loop"><input type="checkbox" id="loop-toggle" ${this.loop ? 'checked' : ''}> Loop playlist</label>
          <button id="download-track" type="button" aria-label="Download current track">⬇️ <span>Download track</span></button>
          <div id="playlist-container" role="group" aria-label="Cosmic Playlist tracks"></div>
        </div>`;
      // Apply the initial compact state before insertion so a mobile visitor
      // never sees (or has Lighthouse measure) an expanded player collapsing
      // after its first paint.
      const initialContent = player.querySelector('#player-content');
      const initialToggle = player.querySelector('#minimize-player');
      if (initialContent) {
        initialContent.hidden = this.isMinimized;
        initialContent.style.display = this.isMinimized ? 'none' : 'block';
      }
      if (initialToggle) {
        initialToggle.textContent = this.isMinimized ? '+' : '−';
        initialToggle.setAttribute('aria-expanded', String(!this.isMinimized));
        initialToggle.setAttribute('aria-label', this.isMinimized ? 'Expand Cosmic Playlist' : 'Collapse Cosmic Playlist');
      }
      document.body.appendChild(player);
    }

    bindControls() {
      this.$('play-pause')?.addEventListener('click', () => this.togglePlay());
      this.$('prev-track')?.addEventListener('click', () => this.previousTrack());
      this.$('next-track')?.addEventListener('click', () => this.nextTrack());
      this.$('minimize-player')?.addEventListener('click', () => this.toggleMinimize());
      this.$('volume-control')?.addEventListener('input', event => this.setVolume(event.target.value));
      this.$('track-progress')?.addEventListener('input', event => this.seekTo(Number(event.target.value) / 1000));
      this.$('loop-toggle')?.addEventListener('change', event => {
        this.loop = event.target.checked;
        localStorage.setItem(STORAGE.loop, String(this.loop));
      });
      this.$('download-track')?.addEventListener('click', () => this.downloadTrack());
    }

    bindAudio() {
      this.audio.addEventListener('loadstart', () => this.setStatus('Loading audio…'));
      this.audio.addEventListener('loadedmetadata', () => {
        if (this.restoreTime > 0 && Number.isFinite(this.audio.duration)) {
          this.audio.currentTime = clamp(this.restoreTime, 0, Math.max(0, this.audio.duration - 0.25));
          this.restoreTime = 0;
        }
        this.updateDuration();
      });
      this.audio.addEventListener('canplay', async () => {
        this.setStatus('Ready');
        if (!this.pendingAutoplay) return;
        this.pendingAutoplay = false;
        try { await this.play(); } catch { /* play() already presents status */ }
      });
      this.audio.addEventListener('waiting', () => this.setStatus('Buffering…'));
      this.audio.addEventListener('stalled', () => this.setStatus('Network stalled; retrying…'));
      this.audio.addEventListener('play', () => {
        this.isPlaying = true;
        this.updatePlayButton();
        this.emitState();
      });
      this.audio.addEventListener('pause', () => {
        this.isPlaying = false;
        this.updatePlayButton();
        this.emitState();
      });
      this.audio.addEventListener('ended', () => {
        if (this.loop || this.currentTrackIndex < this.tracks.length - 1) this.nextTrack(true);
        else this.pause();
      });
      this.audio.addEventListener('timeupdate', () => {
        this.updateProgress();
        const second = Math.floor(this.audio.currentTime || 0);
        if (second !== this.lastSavedSecond && second % 2 === 0) {
          this.lastSavedSecond = second;
          this.saveSession();
        }
      });
      this.audio.addEventListener('durationchange', () => this.updateDuration());
      this.audio.addEventListener('error', () => {
        const message = this.audio.error?.message || 'This track could not be decoded.';
        this.pendingAutoplay = false;
        this.setStatus(`Audio unavailable: ${message}`, true);
        this.updatePlayButton();
      });
    }

    async loadManifest() {
      try {
        const response = await fetch(this.manifestUrl, { cache: 'no-cache' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        if (!Array.isArray(payload.tracks) || !payload.tracks.length) throw new Error('No tracks in manifest');
        this.tracks = payload.tracks
          .filter(track => track && track.filename)
          .map(track => this.createTrack(track.name, track.filename, track.description));
        this.currentTrackIndex = clamp(this.currentTrackIndex, 0, this.tracks.length - 1);
        this.renderPlaylist();
        this.updateTrackUi();
        if (this.restoreTime > 0 || this.pendingAutoplay) this.loadTrack({ autoplay: this.pendingAutoplay, restoreTime: this.restoreTime });
      } catch {
        this.setStatus('Using the built-in playlist');
      }
    }

    renderPlaylist() {
      const container = this.$('playlist-container');
      if (!container) return;
      container.innerHTML = this.tracks.map((track, index) => `
        <button class="playlist-item" type="button" data-index="${index}"
                aria-pressed="${index === this.currentTrackIndex}"
                aria-label="Play ${escapeHtml(track.name)}. ${escapeHtml(track.description)}">
          <span class="playlist-item__title">${escapeHtml(track.name)}</span>
          <span class="playlist-item__meta">${escapeHtml(track.description || 'Audio track')}</span>
        </button>`).join('');
      container.querySelectorAll('.playlist-item').forEach(button => {
        button.addEventListener('click', () => this.selectTrack(Number(button.dataset.index), true));
      });
      this.highlightActiveTrack();
    }

    selectTrack(index, autoplay = false) {
      if (!Number.isInteger(index) || index < 0 || index >= this.tracks.length) return;
      this.currentTrackIndex = index;
      this.restoreTime = 0;
      this.loadTrack({ autoplay });
    }

    loadTrack({ autoplay = false, restoreTime = 0 } = {}) {
      const track = this.tracks[this.currentTrackIndex];
      if (!track) return;
      this.pendingAutoplay = Boolean(autoplay);
      this.restoreTime = Number.isFinite(restoreTime) ? Math.max(0, restoreTime) : 0;
      this.audio.pause();
      this.audio.src = track.url;
      this.audio.load();
      this.updateTrackUi();
      this.setStatus('Loading audio…');
      this.saveSession();
    }

    async play() {
      if (!this.audio.src) this.loadTrack({ autoplay: false, restoreTime: this.restoreTime });
      try {
        await this.audio.play();
        this.setStatus('Playing');
      } catch (error) {
        if (error?.name === 'AbortError') return;
        if (error?.name === 'NotAllowedError') this.setStatus('Press Play to start audio');
        else this.setStatus('Audio could not start', true);
        throw error;
      }
    }

    pause() {
      this.pendingAutoplay = false;
      this.audio.pause();
      this.setStatus('Paused');
      this.saveSession();
    }

    togglePlay() {
      return this.audio.paused ? this.play() : this.pause();
    }

    previousTrack() {
      const autoplay = !this.audio.paused;
      this.selectTrack((this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length, autoplay);
    }

    nextTrack(forcePlay = false) {
      const autoplay = forcePlay || !this.audio.paused;
      this.selectTrack((this.currentTrackIndex + 1) % this.tracks.length, autoplay);
    }

    setVolume(value) {
      const volume = clamp(Number(value) || 0, 0, 100);
      this.audio.volume = volume / 100;
      if (this.$('volume-display')) this.$('volume-display').textContent = `${Math.round(volume)}%`;
      localStorage.setItem(STORAGE.volume, String(Math.round(volume)));
    }

    seekTo(ratio) {
      if (!Number.isFinite(this.audio.duration)) return;
      this.audio.currentTime = clamp(ratio, 0, 1) * this.audio.duration;
    }

    toggleMinimize() {
      this.isMinimized = !this.isMinimized;
      localStorage.setItem(STORAGE.minimized, String(this.isMinimized));
      this.updateMinimizedUi();
    }

    updateMinimizedUi() {
      const content = this.$('player-content');
      const button = this.$('minimize-player');
      const player = this.$('cosmic-music-player');
      if (!content || !button || !player) return;
      content.hidden = this.isMinimized;
      content.style.display = this.isMinimized ? 'none' : 'block';
      button.textContent = this.isMinimized ? '+' : '−';
      button.setAttribute('aria-expanded', String(!this.isMinimized));
      button.setAttribute('aria-label', this.isMinimized ? 'Expand Cosmic Playlist' : 'Collapse Cosmic Playlist');
      player.style.width = this.isMinimized ? '180px' : '320px';
    }

    updateTrackUi() {
      const track = this.tracks[this.currentTrackIndex];
      if (!track) return;
      if (this.$('current-track')) this.$('current-track').textContent = track.name;
      if (this.$('track-info')) this.$('track-info').textContent = `Track ${this.currentTrackIndex + 1} of ${this.tracks.length} • ${track.description || 'Audio track'}`;
      const download = this.$('download-track');
      if (download) download.setAttribute('aria-label', `Download ${track.name}`);
      this.highlightActiveTrack();
    }

    highlightActiveTrack() {
      this.$('playlist-container')?.querySelectorAll('.playlist-item').forEach(button => {
        const active = Number(button.dataset.index) === this.currentTrackIndex;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    }

    updatePlayButton() {
      const button = this.$('play-pause');
      if (!button) return;
      const playing = !this.audio.paused && !this.audio.ended;
      button.textContent = playing ? '⏸' : '▶';
      button.setAttribute('aria-label', playing ? 'Pause' : 'Play');
      button.setAttribute('aria-pressed', String(playing));
    }

    updateProgress() {
      const duration = Number.isFinite(this.audio.duration) ? this.audio.duration : 0;
      const current = Number.isFinite(this.audio.currentTime) ? this.audio.currentTime : 0;
      const slider = this.$('track-progress');
      if (slider) slider.value = duration > 0 ? String(Math.round(current / duration * 1000)) : '0';
      if (this.$('current-time')) this.$('current-time').textContent = this.formatTime(current);
    }

    updateDuration() {
      if (this.$('duration')) this.$('duration').textContent = this.formatTime(this.audio.duration);
      this.updateProgress();
    }

    setStatus(message, error = false) {
      const status = this.$('playback-status');
      if (!status) return;
      status.textContent = message;
      status.classList.toggle('is-error', error);
    }

    emitState() {
      window.dispatchEvent(new CustomEvent('ita:musicstate', {
        detail: { playing: !this.audio.paused, trackIndex: this.currentTrackIndex }
      }));
    }

    formatTime(seconds) {
      if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
      const minutes = Math.floor(seconds / 60);
      const remainder = Math.floor(seconds % 60);
      return `${minutes}:${String(remainder).padStart(2, '0')}`;
    }

    downloadTrack() {
      const track = this.tracks[this.currentTrackIndex];
      if (!track) return;
      const anchor = document.createElement('a');
      anchor.href = track.url;
      anchor.download = track.filename;
      anchor.rel = 'noopener';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    }

    show() {
      this.$('cosmic-music-player')?.removeAttribute('hidden');
    }

    $(id) {
      return document.getElementById(id);
    }
  }

  let globalMusicPlayer = null;
  const init = () => {
    if (globalMusicPlayer || !document.body) return globalMusicPlayer;
    globalMusicPlayer = new CosmicMusicPlayer();
    window.globalMusicPlayer = globalMusicPlayer;
    return globalMusicPlayer;
  };

  window.CosmicMusicPlayer = CosmicMusicPlayer;
  window.cosmicMusicPlayer = () => globalMusicPlayer || init();
  window.debugCosmicMusicPlayer = () => {
    const player = globalMusicPlayer || init();
    return player ? {
      ready: true,
      trackIndex: player.currentTrackIndex,
      track: player.tracks[player.currentTrackIndex]?.name,
      playing: !player.audio.paused,
      minimized: player.isMinimized,
      volume: player.audio.volume
    } : { ready: false };
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
