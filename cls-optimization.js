/**
 * CLS (Cumulative Layout Shift) Optimization
 * Prevents layout shifts for better visual stability
 */

class CLSOptimization {
    constructor() {
        this.init();
    }
    
    init() {
        this.setImageDimensions();
        this.setVideoDimensions();
        this.reserveSpaceForAds();
        this.avoidInsertingContentAbove();
        this.optimizeFonts();
        this.trackEvent('cls_opt_initialized');
    }
    
    setImageDimensions() {
        // Set width and height attributes on images
        document.querySelectorAll('img:not([width]):not([height])').forEach(img => {
            img.addEventListener('load', () => {
                img.setAttribute('width', img.naturalWidth);
                img.setAttribute('height', img.naturalHeight);
            });
        });
    }
    
    setVideoDimensions() {
        // Set dimensions for video elements
        document.querySelectorAll('video:not([width]):not([height])').forEach(video => {
            video.addEventListener('loadedmetadata', () => {
                video.setAttribute('width', video.videoWidth);
                video.setAttribute('height', video.videoHeight);
            });
        });
    }
    
    reserveSpaceForAds() {
        // Reserve space for dynamic content like ads
        const adContainers = document.querySelectorAll('[data-ad]');
        adContainers.forEach(container => {
            const height = container.getAttribute('data-ad-height') || '250';
            container.style.minHeight = height + 'px';
        });
    }
    
    avoidInsertingContentAbove() {
        // Avoid inserting content above existing content
        // Use transform animations instead of position changes
        const style = document.createElement('style');
        style.textContent = `
            .animated {
                will-change: transform;
            }
        `;
        document.head.appendChild(style);
    }
    
    optimizeFonts() {
        // Use font-display: swap to prevent FOIT
        const style = document.createElement('style');
        style.textContent = `
            @font-face {
                font-display: swap;
            }
        `;
        document.head.appendChild(style);
        
        // Preload critical fonts
        document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            if (link.href.includes('font')) {
                const preload = document.createElement('link');
                preload.rel = 'preload';
                preload.as = 'style';
                preload.href = link.href;
                document.head.insertBefore(preload, link);
            }
        });
    }
    
    async measureCLS() {
        if ('PerformanceObserver' in window) {
            let clsValue = 0;
            return new Promise((resolve) => {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    });
                    resolve({ value: clsValue });
                });
                observer.observe({ entryTypes: ['layout-shift'] });
            });
        }
        return null;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`cls_opt_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.clsOptimization = new CLSOptimization(); });
} else {
    window.clsOptimization = new CLSOptimization();
}

