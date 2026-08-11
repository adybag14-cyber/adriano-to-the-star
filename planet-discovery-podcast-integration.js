/**
 * Planet Discovery Podcast Integration
 * Integrates podcast feeds and episodes related to exoplanet discovery
 */

class PlanetDiscoveryPodcastIntegration {
    constructor() {
        this.podcasts = [];
        this.currentEpisode = null;
        this.playbackPosition = 0;
        this.init();
    }

    init() {
        this.loadPodcasts();
        this.setupAudioPlayer();
    }

    loadPodcasts() {
        // Default podcast feeds
        this.podcasts = [
            {
                id: 'nasa-exoplanet-radio',
                title: 'NASA Exoplanet Radio',
                description: 'Official NASA podcast about exoplanet discoveries',
                feedUrl: 'https://www.nasa.gov/rss/dyn/exoplanet_radio.xml',
                episodes: [],
                image: 'https://via.placeholder.com/300x300/1a1a2e/ba944f?text=NASA+Radio'
            },
            {
                id: 'astronomy-cast',
                title: 'Astronomy Cast',
                description: 'Weekly podcast about astronomy and space science',
                feedUrl: 'https://www.astronomycast.com/feed/',
                episodes: [],
                image: 'https://via.placeholder.com/300x300/1a1a2e/ba944f?text=Astronomy+Cast'
            },
            {
                id: 'planetary-radio',
                title: 'Planetary Radio',
                description: 'The Planetary Society\'s weekly podcast',
                feedUrl: 'https://www.planetary.org/planetary-radio/rss.xml',
                episodes: [],
                image: 'https://via.placeholder.com/300x300/1a1a2e/ba944f?text=Planetary+Radio'
            }
        ];

        // Try to load from Supabase
        this.loadPodcastsFromSupabase();
    }

    async loadPodcastsFromSupabase() {
        if (typeof window !== 'undefined' && window.SUPABASE_ENABLE_OPTIONAL_TABLES !== true) {
            return;
        }

        if (typeof supabase === 'undefined' || !supabase) {
            console.log('Supabase not available, using default podcasts');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('podcasts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.warn('Error loading podcasts from Supabase:', error);
                return;
            }

            if (data && data.length > 0) {
                this.podcasts = data.map(p => ({
                    id: p.id,
                    title: p.title,
                    description: p.description,
                    feedUrl: p.feed_url,
                    episodes: [],
                    image: p.image_url
                }));
            }
        } catch (error) {
            console.error('Error loading podcasts:', error);
        }
    }

    async fetchJSON(url, options = {}) {
        try {
            const res = await fetch(url, options);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.warn(`[podcast-integration] Direct fetch failed for ${url}, attempting proxy...`, e.message);
            try {
                // Use AllOrigins proxy for CORS bypass
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl);
                if (!proxyRes.ok) throw new Error(`Proxy HTTP ${proxyRes.status}`);
                const data = await proxyRes.json();
                if (data && data.contents) {
                    return JSON.parse(data.contents);
                }
                throw new Error('Proxy returned empty or invalid data');
            } catch (proxyError) {
                console.error('[podcast-integration] Proxy fetch also failed:', proxyError.message);
                throw e; // Re-throw original error
            }
        }
    }

    async fetchPodcastEpisodes(podcastId) {
        const podcast = this.podcasts.find(p => p.id === podcastId);
        if (!podcast) {
            console.error(`Podcast ${podcastId} not found`);
            return;
        }

        if (podcast.episodes.length > 0) {
            return podcast.episodes; // Already loaded
        }

        try {
            // Fetch RSS feed
            const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(podcast.feedUrl)}`;
            const data = await this.fetchJSON(url);

            if (data.items) {
                podcast.episodes = data.items.map(item => ({
                    id: item.guid || item.link,
                    title: item.title,
                    description: item.description,
                    audioUrl: item.enclosure?.link || item.link,
                    pubDate: item.pubDate,
                    duration: item.itunes?.duration || 'Unknown',
                    image: item.thumbnail || podcast.image
                }));
            }
        } catch (error) {
            console.error('Error fetching podcast episodes:', error);
            // Use fallback episodes
            podcast.episodes = this.getFallbackEpisodes(podcastId);
        }

        return podcast.episodes;
    }

    getFallbackEpisodes(podcastId) {
        // Fallback episodes if RSS feed fails
        return [
            {
                id: `${podcastId}-ep1`,
                title: 'Introduction to Exoplanets',
                description: 'Learn about the basics of exoplanet discovery',
                audioUrl: null,
                pubDate: new Date().toISOString(),
                duration: '45:30',
                image: 'https://via.placeholder.com/300x300/1a1a2e/ba944f?text=Episode+1'
            }
        ];
    }

    setupAudioPlayer() {
        // Create global audio player element
        if (!document.getElementById('podcast-audio-player')) {
            const audio = document.createElement('audio');
            audio.id = 'podcast-audio-player';
            audio.style.display = 'none';
            document.body.appendChild(audio);

            // Track playback position
            audio.addEventListener('timeupdate', () => {
                this.playbackPosition = audio.currentTime;
                this.savePlaybackPosition();
            });

            audio.addEventListener('ended', () => {
                this.onEpisodeEnd();
            });
        }
    }

    renderPodcasts(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        let html = `
            <div class="podcasts-container" style="margin-top: 2rem;">
                <div class="podcasts-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem;">
        `;

        this.podcasts.forEach(podcast => {
            html += this.createPodcastCard(podcast);
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Add click handlers
        this.podcasts.forEach(podcast => {
            const card = document.querySelector(`[data-podcast-id="${podcast.id}"]`);
            if (card) {
                card.addEventListener('click', () => {
                    this.showPodcastEpisodes(podcast.id);
                });
            }
        });
    }

    createPodcastCard(podcast) {
        return `
            <div class="podcast-card" data-podcast-id="${podcast.id}" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 1.5rem; cursor: pointer; transition: all 0.3s ease;">
                <div style="text-align: center; margin-bottom: 1rem;">
                    <img src="${podcast.image}" alt="${podcast.title}" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(186, 148, 79, 0.5);">
                </div>
                <h3 style="color: #ba944f; text-align: center; margin-bottom: 0.5rem;">${podcast.title}</h3>
                <p style="opacity: 0.8; text-align: center; font-size: 0.9rem;">${podcast.description}</p>
                <div style="text-align: center; margin-top: 1rem;">
                    <button class="view-episodes-btn" style="background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-weight: 600;">
                        View Episodes
                    </button>
                </div>
            </div>
        `;
    }

    async showPodcastEpisodes(podcastId) {
        const episodes = await this.fetchPodcastEpisodes(podcastId);
        const podcast = this.podcasts.find(p => p.id === podcastId);

        // Create modal for episodes
        const modal = document.createElement('div');
        modal.id = 'podcast-episodes-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            overflow-y: auto;
            padding: 2rem;
        `;

        const episodesHTML = episodes.map(episode => `
            <div class="episode-item" data-episode-id="${episode.id}" style="background: rgba(0, 0, 0, 0.5); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 10px; padding: 1.5rem; margin-bottom: 1rem; cursor: pointer; transition: all 0.3s ease;">
                <div style="display: flex; gap: 1rem; align-items: start;">
                    <img src="${episode.image}" alt="${episode.title}" style="width: 100px; height: 100px; border-radius: 10px; object-fit: cover;">
                    <div style="flex: 1;">
                        <h4 style="color: #ba944f; margin-bottom: 0.5rem;">${episode.title}</h4>
                        <p style="opacity: 0.8; font-size: 0.9rem; margin-bottom: 0.5rem;">${episode.description.substring(0, 150)}...</p>
                        <div style="display: flex; gap: 1rem; font-size: 0.85rem; opacity: 0.7;">
                            <span>📅 ${new Date(episode.pubDate).toLocaleDateString()}</span>
                            <span>⏱️ ${episode.duration}</span>
                        </div>
                    </div>
                    <button class="play-episode-btn" style="background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-weight: 600;">
                        ▶ Play
                    </button>
                </div>
            </div>
        `).join('');

        modal.innerHTML = `
            <div style="max-width: 1000px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h2 style="color: #ba944f;">${podcast.title} - Episodes</h2>
                    <button id="close-podcast-modal" style="background: transparent; border: 2px solid #ba944f; color: #ba944f; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-weight: 600;">
                        ✕ Close
                    </button>
                </div>
                <div class="episodes-list">
                    ${episodesHTML}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup event listeners
        document.getElementById('close-podcast-modal').addEventListener('click', () => {
            modal.remove();
        });

        document.querySelectorAll('.play-episode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const episodeItem = btn.closest('.episode-item');
                const episodeId = episodeItem.dataset.episodeId;
                const episode = episodes.find(e => e.id === episodeId);
                if (episode) {
                    this.playEpisode(episode);
                }
            });
        });
    }

    playEpisode(episode) {
        const audio = document.getElementById('podcast-audio-player');
        if (!audio) {
            console.error('Audio player not found');
            return;
        }

        this.currentEpisode = episode;

        if (episode.audioUrl) {
            audio.src = episode.audioUrl;
            audio.play().catch(e => {
                console.error('Error playing episode:', e);
                alert('Unable to play episode. Please check if the audio URL is accessible.');
            });
        } else {
            alert('Audio URL not available for this episode');
        }

        // Show audio player UI
        this.showAudioPlayerUI(episode);
    }

    showAudioPlayerUI(episode) {
        // Remove existing player if any
        const existing = document.getElementById('podcast-player-ui');
        if (existing) {
            existing.remove();
        }

        const player = document.createElement('div');
        player.id = 'podcast-player-ui';
        player.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.95);
            border-top: 2px solid rgba(186, 148, 79, 0.5);
            padding: 1rem 2rem;
            z-index: 10001;
            display: flex;
            align-items: center;
            gap: 2rem;
        `;

        const audio = document.getElementById('podcast-audio-player');

        player.innerHTML = `
            <img src="${episode.image}" alt="${episode.title}" style="width: 60px; height: 60px; border-radius: 10px; object-fit: cover;">
            <div style="flex: 1;">
                <h4 style="color: #ba944f; margin-bottom: 0.25rem; font-size: 1rem;">${episode.title}</h4>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <button id="podcast-play-pause" style="background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer;">
                        ⏸
                    </button>
                    <input type="range" id="podcast-seek" min="0" max="100" value="0" style="flex: 1; cursor: pointer;">
                    <span id="podcast-time" style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">0:00 / ${episode.duration}</span>
                </div>
            </div>
            <button id="close-podcast-player" style="background: transparent; border: 2px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer;">
                ✕
            </button>
        `;

        document.body.appendChild(player);

        // Setup controls
        const playPauseBtn = document.getElementById('podcast-play-pause');
        const seekBar = document.getElementById('podcast-seek');
        const timeDisplay = document.getElementById('podcast-time');
        const closeBtn = document.getElementById('close-podcast-player');

        playPauseBtn.addEventListener('click', () => {
            if (audio.paused) {
                audio.play();
                playPauseBtn.textContent = '⏸';
            } else {
                audio.pause();
                playPauseBtn.textContent = '▶';
            }
        });

        seekBar.addEventListener('input', (e) => {
            const seekTime = (e.target.value / 100) * audio.duration;
            audio.currentTime = seekTime;
        });

        audio.addEventListener('timeupdate', () => {
            const progress = (audio.currentTime / audio.duration) * 100;
            seekBar.value = progress || 0;
            timeDisplay.textContent = `${this.formatTime(audio.currentTime)} / ${episode.duration}`;
        });

        closeBtn.addEventListener('click', () => {
            audio.pause();
            player.remove();
        });
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    savePlaybackPosition() {
        if (this.currentEpisode) {
            localStorage.setItem(`podcast-${this.currentEpisode.id}-position`, this.playbackPosition.toString());
        }
    }

    loadPlaybackPosition(episodeId) {
        const saved = localStorage.getItem(`podcast-${episodeId}-position`);
        return saved ? parseFloat(saved) : 0;
    }

    onEpisodeEnd() {
        if (this.currentEpisode) {
            localStorage.removeItem(`podcast-${this.currentEpisode.id}-position`);
            this.currentEpisode = null;
        }
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryPodcastIntegration = new PlanetDiscoveryPodcastIntegration();
}

