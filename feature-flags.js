window.FeatureFlags = {
    TRADING: false,        // Experimental: Marketplace
    NFT: false,            // Experimental: Blockchain/NFTs
    MULTIPLAYER: true,     // Stable: Galaxy View
    CINEMATIC: true,       // Stable: Cinematic UI
    ARCHAEOLOGY: true,     // Stable: Ruins
    VICTORY: true          // Stable: Win Conditions
};

// Helper
window.isFeatureEnabled = function (featureName) {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
    if (isLocal && window.location.search.includes('enable_all_features=true')) return true;
    return window.FeatureFlags[featureName] || false;
};
