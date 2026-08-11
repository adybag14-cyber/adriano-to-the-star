/**
 * Progressive Loading
 * Implements progressive loading for better perceived performance
 */

class ProgressiveLoading {
    constructor() {
        this.init();
    }
    
    init() {
        this.enableProgressiveImages();
        this.enableProgressiveContent();
    }
    
    enableProgressiveImages() {
        // Use progressive JPEGs or low-quality image placeholders
        document.querySelectorAll('img').forEach(img => {
            if (!img.src.includes('data:image')) {
                // Add low-quality placeholder
                const placeholder = this.generatePlaceholder(img);
                img.style.backgroundImage = `url(${placeholder})`;
                img.style.backgroundSize = 'cover';
            }
        });
    }
    
    generatePlaceholder(img) {
        // Generate or use low-quality placeholder
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg==';
    }
    
    enableProgressiveContent() {
        // Load content progressively
        this.loadAboveFoldFirst();
        this.loadBelowFoldLazy();
    }
    
    loadAboveFoldFirst() {
        // Prioritize above-fold content
        const viewportHeight = window.innerHeight;
        document.querySelectorAll('*').forEach(element => {
            const rect = element.getBoundingClientRect();
            if (rect.top < viewportHeight) {
                element.classList.add('above-fold');
            }
        });
    }
    
    loadBelowFoldLazy() {
        // Lazy load below-fold content
        if (window.lazyLoadingAllResources) {
            document.querySelectorAll('*:not(.above-fold)').forEach(element => {
                if (element.tagName === 'IMG' && !element.src) {
                    element.setAttribute('data-src', element.getAttribute('data-original-src') || '');
                }
            });
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.progressiveLoading = new ProgressiveLoading(); });
} else {
    window.progressiveLoading = new ProgressiveLoading();
}

