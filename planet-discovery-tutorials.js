/**
 * Planet Discovery Tutorials
 * Step-by-step tutorials for planet discovery
 * 
 * Features:
 * - Interactive tutorials
 * - Progress tracking
 * - Hands-on exercises
 */

class PlanetDiscoveryTutorials {
    constructor() {
        this.tutorials = [];
        this.init();
    }
    
    init() {
        this.loadTutorials();
        console.log('🎓 Planet Discovery Tutorials initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_tu_to_ri_al_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    
    loadTutorials() {
        this.tutorials = [
            {
                id: 'transit-method',
                title: 'Transit Method',
                steps: ['Introduction', 'How it works', 'Practice']
            },
            {
                id: 'radial-velocity',
                title: 'Radial Velocity Method',
                steps: ['Introduction', 'How it works', 'Practice']
            }
        ];
    }
    
    startTutorial(tutorialId) {
        const tutorial = this.tutorials.find(t => t.id === tutorialId);
        if (tutorial) {
            // Show tutorial interface
            console.log(`Starting tutorial: ${tutorial.title}`);
        }
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.planetDiscoveryTutorials = new PlanetDiscoveryTutorials();
    });
} else {
    window.planetDiscoveryTutorials = new PlanetDiscoveryTutorials();
}
