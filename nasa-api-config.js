// NASA API Configuration
// This key enables access to NASA APIs including:
// - Astronomy Picture of the Day (APOD)
// - Near Earth Objects (NEO)
// - Exoplanet Archive
// - And more NASA data feeds

// Set NASA API key globally for use across the application
if (typeof window !== 'undefined') {
    window.NASA_API_KEY = 'SLlv60158lAX77nc2wy64WkI8S4mqG1lQvbw3g2Y';
    console.log('✅ NASA API key configured');
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        NASA_API_KEY: 'SLlv60158lAX77nc2wy64WkI8S4mqG1lQvbw3g2Y'
    };
}


