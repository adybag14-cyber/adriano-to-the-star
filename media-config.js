/* global module */

/**
 * Media Files Configuration
 * Points to external GitLab project for large media files
 * 
 * Update MEDIA_PROJECT_URL with your new project's GitLab Pages URL
 * Format: https://[project-name].gitlab.io
 */

const MEDIA_CONFIG = {
    // Your new GitLab project's Pages URL
    // Update this after creating the new project and deploying to Pages
    url: 'https://starisdons-d53656.gitlab.io', // ⬅️ UPDATE THIS!

    // Enable/disable external media (set to false to use local files for testing)
    enabled: true
};

// Base paths for different media types
// Note: Media repo uses 'public/' directory structure
const MEDIA_PATHS = {
    games: MEDIA_CONFIG.enabled ? `${MEDIA_CONFIG.url}/public/games` : 'games',
    videos: MEDIA_CONFIG.enabled ? `${MEDIA_CONFIG.url}/public/gta-6-videos` : 'gta-6-videos',
    totalWar: MEDIA_CONFIG.enabled ? `${MEDIA_CONFIG.url}/public/total-war-2` : 'total-war-2'
};

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.MEDIA_CONFIG = MEDIA_CONFIG;
    window.MEDIA_PATHS = MEDIA_PATHS;
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MEDIA_CONFIG, MEDIA_PATHS };
}

