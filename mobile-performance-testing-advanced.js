/**
 * Mobile Performance Testing (Advanced)
 * Advanced mobile performance testing
 */

class MobilePerformanceTestingAdvanced {
    constructor() {
        this.init();
    }
    
    init() {
        this.runMobileTests();
    }
    
    runMobileTests() {
        // Run mobile-specific performance tests
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.testMobilePerformance();
            }, 3000);
        });
    }
    
    testMobilePerformance() {
        return {
            loadTime: this.testLoadTime(),
            interactionDelay: this.testInteractionDelay(),
            scrollPerformance: this.testScrollPerformance()
        };
    }
    
    testLoadTime() {
        const navigation = performance.getEntriesByType('navigation')[0];
        return navigation ? navigation.loadEventEnd - navigation.navigationStart : null;
    }
    
    testInteractionDelay() {
        // Test first input delay
        return new Promise((resolve) => {
            const startTime = performance.now();
            document.addEventListener('click', () => {
                const delay = performance.now() - startTime;
                resolve(delay);
            }, { once: true });
        });
    }
    
    testScrollPerformance() {
        // Test scroll performance
        let frameCount = 0;
        let lastTime = performance.now();
        
        const measureScroll = () => {
            frameCount++;
            const currentTime = performance.now();
            if (currentTime - lastTime >= 1000) {
                const fps = frameCount;
                frameCount = 0;
                lastTime = currentTime;
                return fps;
            }
        };
        
        return measureScroll();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.mobilePerformanceTestingAdvanced = new MobilePerformanceTestingAdvanced(); });
} else {
    window.mobilePerformanceTestingAdvanced = new MobilePerformanceTestingAdvanced();
}

