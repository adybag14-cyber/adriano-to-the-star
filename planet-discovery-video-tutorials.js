/**
 * Planet Discovery Video Tutorials System
 * Provides video tutorials for learning about exoplanet discovery
 */

class PlanetDiscoveryVideoTutorials {
    constructor() {
        this.tutorials = [];
        this.currentTutorial = null;
        this.playbackSpeed = 1.0;
        this.subtitlesEnabled = true;
        this.init();
    }

    init() {
        this.loadTutorials();
        this.setupEventListeners();
    }

    loadTutorials() {
        // Tutorial data structure
        this.tutorials = [
            {
                id: 'intro-exoplanets',
                title: 'Introduction to Exoplanets',
                description: 'Learn the basics of exoplanet discovery and classification',
                duration: '15:30',
                thumbnail: 'https://via.placeholder.com/640x360/1a1a2e/ba944f?text=Introduction+to+Exoplanets',
                videoUrl: 'https://www.youtube.com/embed/0ZOhJe_7GrE',
                category: 'beginner',
                tags: ['basics', 'introduction', 'exoplanets'],
                transcript: 'Welcome to the world of exoplanets...'
            },
            {
                id: 'kepler-mission',
                title: 'Understanding the Kepler Mission',
                description: 'Discover how the Kepler Space Telescope revolutionized exoplanet discovery',
                duration: '22:45',
                thumbnail: 'https://via.placeholder.com/640x360/1a1a2e/ba944f?text=Kepler+Mission',
                videoUrl: 'https://www.youtube.com/embed/cwDkPKPi1mY',
                category: 'intermediate',
                tags: ['kepler', 'telescope', 'mission'],
                transcript: 'The Kepler Mission was launched in 2009...'
            },
            {
                id: 'discovery-methods',
                title: 'Exoplanet Discovery Methods',
                description: 'Explore different techniques used to discover exoplanets',
                duration: '28:15',
                thumbnail: 'https://via.placeholder.com/640x360/1a1a2e/ba944f?text=Discovery+Methods',
                videoUrl: 'https://www.youtube.com/embed/xNeRqbw18Jk',
                category: 'intermediate',
                tags: ['methods', 'transit', 'radial-velocity'],
                transcript: 'There are several methods to discover exoplanets...'
            },
            {
                id: 'habitable-zones',
                title: 'Habitable Zones and Life',
                description: 'Learn about the Goldilocks zone and potential for life',
                duration: '19:20',
                thumbnail: 'https://via.placeholder.com/640x360/1a1a2e/ba944f?text=Habitable+Zones',
                videoUrl: 'https://www.youtube.com/embed/M3hNjV-qEG8',
                category: 'advanced',
                tags: ['habitable', 'life', 'goldilocks'],
                transcript: 'The habitable zone, also known as the Goldilocks zone...'
            },
            {
                id: 'using-database',
                title: 'Using the Exoplanet Database',
                description: 'A guide to navigating and using our exoplanet database',
                duration: '12:10',
                thumbnail: 'https://via.placeholder.com/640x360/1a1a2e/ba944f?text=Database+Guide',
                videoUrl: 'https://www.youtube.com/embed/RHbvnodAX3g',
                category: 'beginner',
                tags: ['database', 'tutorial', 'guide'],
                transcript: 'Welcome to the exoplanet database tutorial...'
            }
        ];

        // Try to load from Supabase if available
        this.loadTutorialsFromSupabase();
    }

    async loadTutorialsFromSupabase() {
        if (typeof window !== 'undefined' && window.SUPABASE_ENABLE_OPTIONAL_TABLES !== true) {
            return;
        }

        if (typeof supabase === 'undefined' || !supabase) {
            console.log('Supabase not available, using default tutorials');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('video_tutorials')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.warn('Error loading tutorials from Supabase:', error);
                return;
            }

            if (data && data.length > 0) {
                this.tutorials = data.map(t => ({
                    id: t.id,
                    title: t.title,
                    description: t.description,
                    duration: t.duration,
                    thumbnail: t.thumbnail_url,
                    videoUrl: t.video_url,
                    category: t.category,
                    tags: t.tags || [],
                    transcript: t.transcript || ''
                }));
            }
        } catch (error) {
            console.error('Error loading tutorials:', error);
        }
    }

    setupEventListeners() {
        // Listen for tutorial requests
        document.addEventListener('click', (e) => {
            const playButton = e.target.closest && e.target.closest('.play-tutorial');
            if (playButton) {
                const tutorialId = playButton.dataset.tutorialId;
                if (tutorialId) {
                    this.playTutorial(tutorialId);
                }
                return;
            }

            const tutorialCard = e.target.closest && e.target.closest('.tutorial-card');
            if (tutorialCard && tutorialCard.dataset && tutorialCard.dataset.tutorialId) {
                this.playTutorial(tutorialCard.dataset.tutorialId);
            }
        });
    }

    renderTutorials(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        const categories = ['beginner', 'intermediate', 'advanced'];
        let html = '<div class="video-tutorials-container">';

        categories.forEach(category => {
            const categoryTutorials = this.tutorials.filter(t => t.category === category);
            if (categoryTutorials.length === 0) return;

            html += `
                <div class="tutorial-category" style="margin-bottom: 3rem;">
                    <h2 style="color: #ba944f; margin-bottom: 1.5rem; text-transform: capitalize;">${category} Tutorials</h2>
                    <div class="tutorials-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem;">
            `;

            categoryTutorials.forEach(tutorial => {
                html += this.createTutorialCard(tutorial);
            });

            html += `
                    </div>
                </div>
            `;
        });

        html += '</div>';

        container.innerHTML = html;
    }

    createTutorialCard(tutorial) {
        return `
            <div class="tutorial-card" data-tutorial-id="${tutorial.id}" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; overflow: hidden; transition: all 0.3s ease; cursor: pointer;">
                <div class="tutorial-thumbnail" style="position: relative; width: 100%; padding-top: 56.25%; background: rgba(0, 0, 0, 0.5);">
                    <img src="${tutorial.thumbnail}" alt="${tutorial.title}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
                    <div class="play-overlay" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 60px; height: 60px; background: rgba(186, 148, 79, 0.9); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; transition: all 0.3s ease;">
                        ▶
                    </div>
                    <div class="duration-badge" style="position: absolute; bottom: 10px; right: 10px; background: rgba(0, 0, 0, 0.8); color: white; padding: 0.25rem 0.75rem; border-radius: 5px; font-size: 0.85rem;">
                        ${tutorial.duration}
                    </div>
                </div>
                <div class="tutorial-info" style="padding: 1.5rem;">
                    <h3 style="color: #ba944f; margin-bottom: 0.5rem; font-size: 1.1rem;">${tutorial.title}</h3>
                    <p style="opacity: 0.8; font-size: 0.9rem; margin-bottom: 1rem;">${tutorial.description}</p>
                    <div class="tutorial-tags" style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        ${tutorial.tags.map(tag => `<span style="background: rgba(186, 148, 79, 0.2); padding: 0.25rem 0.5rem; border-radius: 5px; font-size: 0.75rem; color: #ba944f;">${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    playTutorial(tutorialId) {
        const tutorial = this.tutorials.find(t => t.id === tutorialId);
        if (!tutorial) {
            console.error(`Tutorial ${tutorialId} not found`);
            return;
        }

        this.currentTutorial = tutorial;
        this.showVideoPlayer(tutorial);
    }

    showVideoPlayer(tutorial) {
        const existingModal = document.getElementById('tutorial-video-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const rawVideoUrl = tutorial.videoUrl;
        let videoContentHtml = `
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: #ba944f;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">📹</div>
                <p>Video coming soon!</p>
                <p style="font-size: 0.9rem; opacity: 0.7; margin-top: 0.5rem;">${tutorial.description}</p>
            </div>
        `;

        if (rawVideoUrl) {
            const url = String(rawVideoUrl);
            const isYouTube = /youtube\.com|youtu\.be/.test(url);

            if (isYouTube) {
                let embedUrl = url;
                if (embedUrl.includes('watch?v=')) {
                    embedUrl = embedUrl.replace('watch?v=', 'embed/');
                }
                if (embedUrl.includes('youtu.be/')) {
                    embedUrl = embedUrl.replace('youtu.be/', 'www.youtube.com/embed/');
                }

                videoContentHtml = `
                    <iframe src="${embedUrl}" title="${tutorial.title}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 10px;" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                `;
            } else {
                videoContentHtml = `
                    <video id="tutorial-video" controls style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 10px;">
                        <source src="${url}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                `;
            }
        }

        // Create modal for video player
        const modal = document.createElement('div');
        modal.id = 'tutorial-video-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        `;

        modal.innerHTML = `
            <div style="max-width: 1200px; width: 100%; position: relative;">
                <button id="close-tutorial-modal" style="position: absolute; top: -3rem; right: 0; background: transparent; border: 2px solid #ba944f; color: #ba944f; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-weight: 600; z-index: 10001;">
                    ✕ Close
                </button>
                
                <div style="background: rgba(0, 0, 0, 0.8); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 15px; padding: 2rem;">
                    <h2 style="color: #ba944f; margin-bottom: 1rem;">${tutorial.title}</h2>
                    
                    <div class="video-player-container" style="position: relative; width: 100%; padding-top: 56.25%; background: #000; border-radius: 10px; margin-bottom: 1rem;">
                        ${videoContentHtml}
                    </div>
                    
                    <div class="video-controls" style="display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
                        <button id="speed-control" class="control-btn" style="background: rgba(186, 148, 79, 0.2); border: 1px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer;">
                            Speed: ${this.playbackSpeed}x
                        </button>
                        <button id="subtitles-toggle" class="control-btn" style="background: rgba(186, 148, 79, 0.2); border: 1px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer;">
                            ${this.subtitlesEnabled ? 'Subtitles: ON' : 'Subtitles: OFF'}
                        </button>
                        <button id="download-transcript" class="control-btn" style="background: rgba(186, 148, 79, 0.2); border: 1px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer;">
                            📄 Download Transcript
                        </button>
                    </div>
                    
                    <div class="video-description" style="color: rgba(255, 255, 255, 0.8); line-height: 1.6;">
                        <p>${tutorial.description}</p>
                        ${tutorial.transcript ? `
                            <details style="margin-top: 1rem;">
                                <summary style="color: #ba944f; cursor: pointer; font-weight: 600;">View Transcript</summary>
                                <div style="margin-top: 1rem; padding: 1rem; background: rgba(0, 0, 0, 0.3); border-radius: 8px; max-height: 300px; overflow-y: auto;">
                                    ${tutorial.transcript}
                                </div>
                            </details>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup event listeners
        document.getElementById('close-tutorial-modal').addEventListener('click', () => {
            this.closeVideoPlayer();
        });

        document.getElementById('speed-control').addEventListener('click', () => {
            this.togglePlaybackSpeed();
        });

        document.getElementById('subtitles-toggle').addEventListener('click', () => {
            this.toggleSubtitles();
        });

        document.getElementById('download-transcript').addEventListener('click', () => {
            this.downloadTranscript(tutorial);
        });

        // Close on escape key
        if (!this._escapeHandler) {
            this._escapeHandler = (e) => {
                if (e.key === 'Escape' && document.getElementById('tutorial-video-modal')) {
                    this.closeVideoPlayer();
                }
            };
            document.addEventListener('keydown', this._escapeHandler);
        }

        // Setup video player if video URL exists
        if (tutorial.videoUrl) {
            const video = document.getElementById('tutorial-video');
            if (video) {
                video.playbackRate = this.playbackSpeed;
            }
        }
    }

    togglePlaybackSpeed() {
        const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
        const currentIndex = speeds.indexOf(this.playbackSpeed);
        this.playbackSpeed = speeds[(currentIndex + 1) % speeds.length];

        const video = document.getElementById('tutorial-video');
        if (video) {
            video.playbackRate = this.playbackSpeed;
        }

        const btn = document.getElementById('speed-control');
        if (btn) {
            btn.textContent = `Speed: ${this.playbackSpeed}x`;
        }
    }

    toggleSubtitles() {
        this.subtitlesEnabled = !this.subtitlesEnabled;
        const btn = document.getElementById('subtitles-toggle');
        if (btn) {
            btn.textContent = `Subtitles: ${this.subtitlesEnabled ? 'ON' : 'OFF'}`;
        }

        // TODO: Implement subtitle track toggle
        const video = document.getElementById('tutorial-video');
        if (video) {
            // Enable/disable subtitle tracks
        }
    }

    downloadTranscript(tutorial) {
        if (!tutorial.transcript) {
            alert('Transcript not available for this tutorial');
            return;
        }

        const blob = new Blob([tutorial.transcript], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tutorial.id}-transcript.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    closeVideoPlayer() {
        const modal = document.getElementById('tutorial-video-modal');
        if (modal) {
            const video = document.getElementById('tutorial-video');
            if (video) {
                video.pause();
                video.src = '';
            }
            modal.remove();
        }
        this.currentTutorial = null;
    }

    // Search tutorials
    searchTutorials(query) {
        const lowerQuery = query.toLowerCase();
        return this.tutorials.filter(tutorial => 
            tutorial.title.toLowerCase().includes(lowerQuery) ||
            tutorial.description.toLowerCase().includes(lowerQuery) ||
            tutorial.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
    }

    // Get tutorials by category
    getTutorialsByCategory(category) {
        return this.tutorials.filter(t => t.category === category);
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryVideoTutorials = new PlanetDiscoveryVideoTutorials();
}

