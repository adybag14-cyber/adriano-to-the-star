/**
 * Skeleton Loading Screens
 * Creates skeleton loading placeholders for content
 * 
 * Features:
 * - Multiple skeleton types (text, image, card, list)
 * - Shimmer animation
 * - Automatic detection of content to replace
 * - Customizable appearance
 */

class SkeletonLoadingScreens {
    constructor() {
        this.skeletons = new Map();
        this.init();
    }

    init() {
        // Auto-initialize skeleton elements
        this.initializeDataSkeletons();
        console.log('✅ Skeleton Loading Screens initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_ke_le_to_nl_oa_di_ng_sc_re_en_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    initializeDataSkeletons() {
        document.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('[data-skeleton]').forEach(element => {
                const type = element.getAttribute('data-skeleton') || 'text';
                this.show(element, type);
            });
        });
    }

    /**
     * Show skeleton loading
     * @param {HTMLElement|string} container - Container element or selector
     * @param {string} type - Skeleton type (text, image, card, list, custom)
     * @param {Object} options - Options
     */
    show(container, type = 'text', options = {}) {
        const element = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;
        
        if (!element) {
            console.error('Skeleton container not found');
            return null;
        }

        const id = `skeleton-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const originalContent = element.innerHTML;
        
        // Store original content
        element.setAttribute('data-original-content', originalContent);
        element.setAttribute('data-skeleton-id', id);

        let skeletonHTML = '';
        
        switch (type) {
            case 'text':
                skeletonHTML = this.createTextSkeleton(options);
                break;
            case 'image':
                skeletonHTML = this.createImageSkeleton(options);
                break;
            case 'card':
                skeletonHTML = this.createCardSkeleton(options);
                break;
            case 'list':
                skeletonHTML = this.createListSkeleton(options);
                break;
            case 'custom':
                skeletonHTML = options.html || '';
                break;
            default:
                skeletonHTML = this.createTextSkeleton(options);
        }

        element.innerHTML = skeletonHTML;
        element.classList.add('skeleton-container');
        
        this.skeletons.set(id, { element, originalContent, type, options });
        
        // Add shimmer animation
        this.addShimmerAnimation();

        return id;
    }

    createTextSkeleton(options) {
        const lines = options.lines || 3;
        const width = options.width || '100%';
        const height = options.height || '1rem';
        
        let html = '';
        for (let i = 0; i < lines; i++) {
            const lineWidth = i === lines - 1 ? '60%' : '100%';
            html += `
                <div class="skeleton-line" style="
                    width: ${lineWidth};
                    height: ${height};
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                    margin-bottom: 0.75rem;
                    animation: skeleton-shimmer 1.5s ease-in-out infinite;
                "></div>
            `;
        }
        return html;
    }

    createImageSkeleton(options) {
        const width = options.width || '100%';
        const height = options.height || '200px';
        const aspectRatio = options.aspectRatio || '16/9';
        
        return `
            <div class="skeleton-image" style="
                width: ${width};
                height: ${height};
                aspect-ratio: ${aspectRatio};
                background: rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                animation: skeleton-shimmer 1.5s ease-in-out infinite;
            "></div>
        `;
    }

    createCardSkeleton(options) {
        return `
            <div class="skeleton-card" style="
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(186, 148, 79, 0.2);
                border-radius: 8px;
                padding: 1.5rem;
            ">
                ${this.createImageSkeleton({ width: '100%', height: '150px' })}
                <div style="margin-top: 1rem;">
                    ${this.createTextSkeleton({ lines: 2 })}
                </div>
            </div>
        `;
    }

    createListSkeleton(options) {
        const items = options.items || 5;
        let html = '';
        
        for (let i = 0; i < items; i++) {
            html += `
                <div class="skeleton-list-item" style="
                    display: flex;
                    gap: 1rem;
                    padding: 1rem;
                    border-bottom: 1px solid rgba(186, 148, 79, 0.1);
                ">
                    <div class="skeleton-avatar" style="
                        width: 48px;
                        height: 48px;
                        border-radius: 50%;
                        background: rgba(255, 255, 255, 0.1);
                        flex-shrink: 0;
                        animation: skeleton-shimmer 1.5s ease-in-out infinite;
                    "></div>
                    <div style="flex: 1;">
                        ${this.createTextSkeleton({ lines: 2 })}
                    </div>
                </div>
            `;
        }
        
        return html;
    }

    /**
     * Hide skeleton and restore original content
     * @param {string} id - Skeleton ID
     */
    hide(id) {
        const skeleton = this.skeletons.get(id);
        if (!skeleton) {
            // Try to find by element
            const element = typeof id === 'string' && id.startsWith('#') 
                ? document.querySelector(id)
                : document.querySelector(`[data-skeleton-id="${id}"]`);
            
            if (element) {
                const skeletonId = element.getAttribute('data-skeleton-id');
                const originalContent = element.getAttribute('data-original-content');
                if (originalContent) {
                    element.innerHTML = originalContent;
                    element.classList.remove('skeleton-container');
                    element.removeAttribute('data-skeleton-id');
                    element.removeAttribute('data-original-content');
                    if (skeletonId) {
                        this.skeletons.delete(skeletonId);
                    }
                }
                return;
            }
            return;
        }

        const { element, originalContent } = skeleton;
        element.innerHTML = originalContent;
        element.classList.remove('skeleton-container');
        element.removeAttribute('data-skeleton-id');
        element.removeAttribute('data-original-content');
        this.skeletons.delete(id);
    }

    addShimmerAnimation() {
        if (document.getElementById('skeleton-animations')) return;

        const style = document.createElement('style');
        style.id = 'skeleton-animations';
        style.textContent = `
            @keyframes skeleton-shimmer {
                0% {
                    background-position: -1000px 0;
                }
                100% {
                    background-position: 1000px 0;
                }
            }
            
            .skeleton-line,
            .skeleton-image,
            .skeleton-avatar {
                background: linear-gradient(
                    90deg,
                    rgba(255, 255, 255, 0.1) 0%,
                    rgba(255, 255, 255, 0.15) 50%,
                    rgba(255, 255, 255, 0.1) 100%
                );
                background-size: 1000px 100%;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Show skeleton for multiple elements
     * @param {string} selector - CSS selector
     * @param {string} type - Skeleton type
     */
    showAll(selector, type = 'text') {
        document.querySelectorAll(selector).forEach(element => {
            this.show(element, type);
        });
    }

    /**
     * Hide all skeletons
     */
    hideAll() {
        this.skeletons.forEach((skeleton, id) => {
            this.hide(id);
        });
    }
}

// Initialize global instance
if (typeof window !== 'undefined') {
    window.skeletonLoading = new SkeletonLoadingScreens();
}

