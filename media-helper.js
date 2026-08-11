/* global MEDIA_PATHS, module */

/**
 * Media Helper Utilities
 * Provides helper functions for getting media file paths
 * Works with both external media project and local files
 */

// Helper function to get media path
function getMediaPath(type, filename) {
    if (typeof MEDIA_PATHS === 'undefined') {
        // Fallback to local paths if media-config.js not loaded
        const localPaths = {
            games: 'games',
            videos: 'gta-6-videos',
            totalWar: 'total-war-2',
            images: 'images',
            audio: 'audio',
            data: 'data'
        };
        return `${localPaths[type] || type}/${filename}`;
    }
    
    const basePath = MEDIA_PATHS[type] || type;
    return `${basePath}/${filename}`;
}

// Helper function to get image path
function getImagePath(filename) {
    return getMediaPath('images', filename);
}

// Helper function to get audio path
function getAudioPath(filename) {
    return getMediaPath('audio', filename);
}

// Helper function to get game path
function getGamePath(filename) {
    return getMediaPath('games', filename);
}

// Helper function to get video path
function getVideoPath(filename) {
    return getMediaPath('videos', filename);
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.getMediaPath = getMediaPath;
    window.getImagePath = getImagePath;
    window.getAudioPath = getAudioPath;
    window.getGamePath = getGamePath;
    window.getVideoPath = getVideoPath;
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getMediaPath,
        getImagePath,
        getAudioPath,
        getGamePath,
        getVideoPath
    };
}

