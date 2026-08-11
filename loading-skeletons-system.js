/**
 * Animated Loading Skeletons for All Major Components
 * Provides skeleton screens for better perceived performance
 */

class LoadingSkeletonsSystem {
    constructor() {
        this.skeletons = new Map();
        this.init();
    }
    
    init() {
        this.createSkeletonStyles();
        this.observeComponents();
    }
    
    createSkeletonStyles() {
        const style = document.createElement('style');
        style.id = 'skeleton-styles';
        style.textContent = `
            .skeleton { background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%); background-size: 200% 100%; animation: skeleton-loading 1.5s ease-in-out infinite; border-radius: 4px; }
            @keyframes skeleton-loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
            .skeleton-text { height: 1em; margin: 0.5em 0; }
            .skeleton-title { height: 1.5em; width: 60%; margin-bottom: 1em; }
            .skeleton-avatar { width: 50px; height: 50px; border-radius: 50%; }
            .skeleton-card { padding: 20px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 15px; }
        `;
        document.head.appendChild(style);
    }
    
    createSkeleton(type, count = 1) {
        const skeletons = [];
        for (let i = 0; i < count; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = `skeleton skeleton-${type}`;
            skeletons.push(skeleton);
        }
        return skeletons;
    }
    
    showSkeleton(container, type = 'card', count = 1) {
        if (!container) return;
        const skeletons = this.createSkeleton(type, count);
        container.innerHTML = '';
        skeletons.forEach(s => container.appendChild(s));
    }
    
    hideSkeleton(container) {
        if (!container) return;
        const skeletons = container.querySelectorAll('.skeleton');
        skeletons.forEach(s => s.remove());
    }
    
    observeComponents() {
        const observer = new MutationObserver(() => {
            document.querySelectorAll('[data-skeleton]').forEach(el => {
                if (!el.hasAttribute('data-skeleton-processed')) {
                    el.setAttribute('data-skeleton-processed', 'true');
                    this.showSkeleton(el, el.getAttribute('data-skeleton-type') || 'card');
                }
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.loadingSkeletonsSystem = new LoadingSkeletonsSystem(); });
} else {
    window.loadingSkeletonsSystem = new LoadingSkeletonsSystem();
}


