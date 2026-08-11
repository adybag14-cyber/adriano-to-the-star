/**
 * Skeleton Screens (Advanced)
 * Advanced skeleton screen implementation for better UX
 */

class SkeletonScreensAdvanced {
    constructor() {
        this.init();
    }
    
    init() {
        this.createSkeletonStyles();
        this.showSkeletons();
    }
    
    createSkeletonStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .skeleton {
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: loading 1.5s ease-in-out infinite;
            }
            @keyframes loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
            .skeleton-text {
                height: 1em;
                border-radius: 4px;
                margin: 0.5em 0;
            }
            .skeleton-image {
                width: 100%;
                aspect-ratio: 16/9;
                border-radius: 8px;
            }
        `;
        document.head.appendChild(style);
    }
    
    showSkeletons() {
        // Show skeletons for loading content
        document.querySelectorAll('[data-skeleton]').forEach(element => {
            element.classList.add('skeleton');
            
            if (element.tagName === 'IMG') {
                element.classList.add('skeleton-image');
            } else {
                element.classList.add('skeleton-text');
            }
        });
    }
    
    hideSkeleton(element) {
        element.classList.remove('skeleton', 'skeleton-image', 'skeleton-text');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.skeletonScreensAdvanced = new SkeletonScreensAdvanced(); });
} else {
    window.skeletonScreensAdvanced = new SkeletonScreensAdvanced();
}

