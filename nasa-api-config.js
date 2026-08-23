// NASA API Configuration
// This key enables access to NASA APIs including:
// - Astronomy Picture of the Day (APOD)
// - Near Earth Objects (NEO)
// - Exoplanet Archive
// - And more NASA data feeds

// Set NASA API key globally for use across the application
if (typeof window !== 'undefined') {
    window.NASA_API_KEY = window.NASA_API_KEY || 'DEMO_KEY';
    console.log('✅ NASA API key configured');
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        NASA_API_KEY: (typeof process !== 'undefined' && process.env && process.env.NASA_API_KEY) ? process.env.NASA_API_KEY : 'DEMO_KEY'
    };
}


