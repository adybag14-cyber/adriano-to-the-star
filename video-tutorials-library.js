/**
 * Video Tutorials Library
 * @class VideoTutorialsLibrary
 * @description Manages video tutorials with playback, progress tracking, and organization.
 */
class VideoTutorialsLibrary {
    constructor() {
        this.tutorials = new Map();
        this.playlists = new Map();
        this.progress = new Map();
        this.init();
    }

    init() {
        this.trackEvent('v_id_eo_tu_to_ri_al_sl_ib_ra_ry_initialized');
        this.loadProgress();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("v_id_eo_tu_to_ri_al_sl_ib_ra_ry_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Add a video tutorial.
     * @param {string} tutorialId - Tutorial identifier.
     * @param {object} tutorialData - Tutorial data.
     */
    addTutorial(tutorialId, tutorialData) {
        this.tutorials.set(tutorialId, {
            ...tutorialData,
            duration: tutorialData.duration || 0,
            views: 0,
            createdAt: new Date()
        });
        console.log(`Video tutorial added: ${tutorialId}`);
    }

    /**
     * Create a playlist.
     * @param {string} playlistId - Playlist identifier.
     * @param {object} playlistData - Playlist data.
     */
    createPlaylist(playlistId, playlistData) {
        this.playlists.set(playlistId, {
            ...playlistData,
            tutorials: [],
            createdAt: new Date()
        });
        console.log(`Playlist created: ${playlistId}`);
    }

    /**
     * Add tutorial to playlist.
     * @param {string} playlistId - Playlist identifier.
     * @param {string} tutorialId - Tutorial identifier.
     */
    addToPlaylist(playlistId, tutorialId) {
        const playlist = this.playlists.get(playlistId);
        if (playlist) {
            playlist.tutorials.push(tutorialId);
            console.log(`Tutorial ${tutorialId} added to playlist ${playlistId}`);
        }
    }

    /**
     * Track video progress.
     * @param {string} tutorialId - Tutorial identifier.
     * @param {number} currentTime - Current playback time in seconds.
     * @param {number} totalTime - Total video duration in seconds.
     */
    trackProgress(tutorialId, currentTime, totalTime) {
        const progress = {
            tutorialId,
            currentTime,
            totalTime,
            percentage: (currentTime / totalTime) * 100,
            lastWatched: new Date()
        };

        this.progress.set(tutorialId, progress);
        this.saveProgress();
    }

    /**
     * Get progress for a tutorial.
     * @param {string} tutorialId - Tutorial identifier.
     * @returns {object} Progress data.
     */
    getProgress(tutorialId) {
        return this.progress.get(tutorialId) || {
            tutorialId,
            currentTime: 0,
            totalTime: 0,
            percentage: 0
        };
    }

    saveProgress() {
        try {
            localStorage.setItem('videoTutorialProgress', JSON.stringify(
                Object.fromEntries(this.progress)
            ));
        } catch (error) {
            console.error('Failed to save progress:', error);
        }
    }

    loadProgress() {
        try {
            const stored = localStorage.getItem('videoTutorialProgress');
            if (stored) {
                this.progress = new Map(Object.entries(JSON.parse(stored)));
            }
        } catch (error) {
            console.error('Failed to load progress:', error);
        }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.videoTutorialsLibrary = new VideoTutorialsLibrary();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VideoTutorialsLibrary;
}
