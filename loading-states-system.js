/**
 * Comprehensive Loading States System
 * 
 * Provides loading states and skeleton screens for all async operations.
 * 
 * @module LoadingStatesSystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class LoadingStatesSystem {
    constructor() {
        this.loadingStates = new Map();
        this.skeletonTemplates = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize the loading states system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('LoadingStatesSystem already initialized');
            return;
        }

        this.setupSkeletonTemplates();
        this.injectStyles();
        
        this.isInitialized = true;
        console.log('✅ Loading States System initialized');
    }

    /**
     * Set up skeleton templates
     * @private
     */
    setupSkeletonTemplates() {
        // Table skeleton
        this.skeletonTemplates.set('table', (rows = 5) => {
            return `
                <div class="skeleton-table">
                    ${Array(rows).fill(0).map(() => `
                        <div class="skeleton-row">
                            <div class="skeleton-cell"></div>
                            <div class="skeleton-cell"></div>
                            <div class="skeleton-cell"></div>
                        </div>
                    `).join('')}
                </div>
            `;
        });

        // Card skeleton
        this.skeletonTemplates.set('card', () => {
            return `
                <div class="skeleton-card">
                    <div class="skeleton-image"></div>
                    <div class="skeleton-content">
                        <div class="skeleton-title"></div>
                        <div class="skeleton-text"></div>
                        <div class="skeleton-text short"></div>
                    </div>
                </div>
            `;
        });

        // List skeleton
        this.skeletonTemplates.set('list', (items = 5) => {
            return `
                <div class="skeleton-list">
                    ${Array(items).fill(0).map(() => `
                        <div class="skeleton-list-item">
                            <div class="skeleton-avatar"></div>
                            <div class="skeleton-content">
                                <div class="skeleton-line"></div>
                                <div class="skeleton-line short"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        });

        // Text skeleton
        this.skeletonTemplates.set('text', (lines = 3) => {
            return `
                <div class="skeleton-text-container">
                    ${Array(lines).fill(0).map((_, i) => `
                        <div class="skeleton-line ${i === lines - 1 ? 'short' : ''}"></div>
                    `).join('')}
                </div>
            `;
        });
    }

    /**
     * Inject skeleton styles
     * @private
     */
    injectStyles() {
        if (document.getElementById('skeleton-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'skeleton-styles';
        style.textContent = `
            .skeleton-loading {
                position: relative;
                overflow: hidden;
            }

            .skeleton-loading::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(
                    90deg,
                    transparent,
                    rgba(255, 255, 255, 0.1),
                    transparent
                );
                animation: skeleton-shimmer 1.5s infinite;
            }

            @keyframes skeleton-shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }

            .skeleton-table {
                width: 100%;
            }

            .skeleton-row {
                display: flex;
                gap: 1rem;
                padding: 0.75rem 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .skeleton-cell {
                flex: 1;
                height: 1rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
            }

            .skeleton-card {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                padding: 1rem;
                margin-bottom: 1rem;
            }

            .skeleton-image {
                width: 100%;
                height: 200px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                margin-bottom: 1rem;
            }

            .skeleton-title {
                height: 1.5rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                margin-bottom: 0.75rem;
                width: 60%;
            }

            .skeleton-text {
                height: 1rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                margin-bottom: 0.5rem;
            }

            .skeleton-text.short {
                width: 40%;
            }

            .skeleton-list {
                width: 100%;
            }

            .skeleton-list-item {
                display: flex;
                gap: 1rem;
                padding: 1rem 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .skeleton-avatar {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.1);
                flex-shrink: 0;
            }

            .skeleton-content {
                flex: 1;
            }

            .skeleton-line {
                height: 1rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                margin-bottom: 0.5rem;
            }

            .skeleton-line.short {
                width: 60%;
            }

            .skeleton-text-container {
                width: 100%;
            }

            .loading-spinner {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 3px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top-color: #ba944f;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            .loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            }

            .loading-overlay-content {
                background: rgba(0, 0, 0, 0.9);
                padding: 2rem;
                border-radius: 8px;
                text-align: center;
                color: white;
            }

            .loading-overlay-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top-color: #ba944f;
                animation: spin 1s linear infinite;
                margin: 0 auto 1rem;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Show loading state
     * @public
     * @param {string} id - Loading state ID
     * @param {HTMLElement} container - Container element
     * @param {string} type - Skeleton type
     * @param {Object} options - Options
     */
    showLoading(id, container, type = 'text', options = {}) {
        const template = this.skeletonTemplates.get(type);
        if (!template) {
            console.warn(`Skeleton template '${type}' not found`);
            return;
        }

        const skeletonHTML = template(options.rows || options.items || 5);
        const skeletonElement = document.createElement('div');
        skeletonElement.className = 'skeleton-loading';
        skeletonElement.innerHTML = skeletonHTML;
        skeletonElement.dataset.loadingId = id;

        // Store original content
        if (!this.loadingStates.has(id)) {
            this.loadingStates.set(id, {
                container,
                originalContent: container.innerHTML,
                skeletonElement
            });
        }

        container.innerHTML = '';
        container.appendChild(skeletonElement);
    }

    /**
     * Hide loading state
     * @public
     * @param {string} id - Loading state ID
     */
    hideLoading(id) {
        const state = this.loadingStates.get(id);
        if (!state) {
            console.warn(`Loading state '${id}' not found`);
            return;
        }

        state.container.innerHTML = state.originalContent;
        this.loadingStates.delete(id);
    }

    /**
     * Show loading spinner
     * @public
     * @param {HTMLElement} element - Element to show spinner in
     */
    showSpinner(element) {
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        element.appendChild(spinner);
        return spinner;
    }

    /**
     * Hide loading spinner
     * @public
     * @param {HTMLElement} element - Element containing spinner
     */
    hideSpinner(element) {
        const spinner = element.querySelector('.loading-spinner');
        if (spinner) {
            spinner.remove();
        }
    }

    /**
     * Show loading overlay
     * @public
     * @param {string} message - Loading message
     * @returns {HTMLElement} Overlay element
     */
    showOverlay(message = 'Loading...') {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-overlay-content">
                <div class="loading-overlay-spinner"></div>
                <div>${message}</div>
            </div>
        `;
        document.body.appendChild(overlay);
        return overlay;
    }

    /**
     * Hide loading overlay
     * @public
     * @param {HTMLElement} overlay - Overlay element
     */
    hideOverlay(overlay) {
        if (overlay && overlay.parentElement) {
            overlay.remove();
        }
    }

    /**
     * Wrap async function with loading state
     * @public
     * @param {Function} asyncFn - Async function
     * @param {string} loadingId - Loading state ID
     * @param {HTMLElement} container - Container element
     * @param {string} skeletonType - Skeleton type
     * @returns {Function} Wrapped function
     */
    wrapAsyncFunction(asyncFn, loadingId, container, skeletonType = 'text') {
        return async (...args) => {
            this.showLoading(loadingId, container, skeletonType);
            try {
                const result = await asyncFn(...args);
                this.hideLoading(loadingId);
                return result;
            } catch (error) {
                this.hideLoading(loadingId);
                throw error;
            }
        };
    }
}

// Create global instance
window.LoadingStatesSystem = LoadingStatesSystem;

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.loadingStates = new LoadingStatesSystem();
        window.loadingStates.init();
    });
} else {
    window.loadingStates = new LoadingStatesSystem();
    window.loadingStates.init();
}

