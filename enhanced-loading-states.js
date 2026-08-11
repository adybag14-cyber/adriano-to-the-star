/**
 * Enhanced Loading States
 * Improved loading indicators across all pages
 */

class EnhancedLoadingStates {
    constructor() {
        this.loadingOverlays = new Map();
        this.loadingBars = new Map();
        this.progressTrackers = new Map();
        this.init();
    }

    init() {
        // Enhance existing loader
        this.enhanceExistingLoader();
        
        // Setup global loading handlers
        this.setupGlobalHandlers();
        
        console.log('✅ Enhanced Loading States initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("e_nh_an_ce_dl_oa_di_ng_st_at_es_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Enhance existing loader
     */
    enhanceExistingLoader() {
        // Wait for existing loader to be ready
        setTimeout(() => {
            const existingLoader = document.getElementById('loader');
            if (existingLoader) {
                // Add progress bar if not exists
                if (!existingLoader.querySelector('.loader-progress-bar')) {
                    const progressBar = document.createElement('div');
                    progressBar.className = 'loader-progress-bar';
                    progressBar.innerHTML = '<div class="loader-progress-fill"></div>';
                    existingLoader.appendChild(progressBar);
                }
            }
        }, 100);
    }

    /**
     * Setup global loading handlers
     */
    setupGlobalHandlers() {
        // Intercept fetch requests to show loading
        const originalFetch = window.fetch;
        const self = this;
        
        window.fetch = async function(...args) {
            const url = args[0];
            const isImportantRequest = self.isImportantRequest(url);
            
            if (isImportantRequest) {
                const loadingId = self.showLoading(`Loading ${self.getRequestName(url)}...`);
                try {
                    const response = await originalFetch.apply(this, args);
                    self.hideLoading(loadingId);
                    return response;
                } catch (error) {
                    self.hideLoading(loadingId);
                    throw error;
                }
            }
            
            return originalFetch.apply(this, args);
        };
    }

    /**
     * Check if request is important enough to show loading
     */
    isImportantRequest(url) {
        const importantPatterns = [
            '/api/',
            'nasa.gov',
            'exoplanetarchive',
            'supabase',
            'database',
            'stellar-ai'
        ];
        
        return importantPatterns.some(pattern => 
            typeof url === 'string' && url.includes(pattern)
        );
    }

    /**
     * Get request name for display
     */
    getRequestName(url) {
        if (typeof url !== 'string') return 'data';
        
        if (url.includes('nasa.gov') || url.includes('exoplanetarchive')) {
            return 'NASA data';
        }
        if (url.includes('supabase')) {
            return 'database';
        }
        if (url.includes('stellar-ai')) {
            return 'AI response';
        }
        if (url.includes('/api/')) {
            return 'API data';
        }
        
        return 'content';
    }

    /**
     * Show loading overlay
     */
    showLoading(message = 'Loading...', options = {}) {
        const id = `loading-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const {
            showProgress = false,
            progress = 0,
            canCancel = false,
            onCancel = null
        } = options;

        const overlay = document.createElement('div');
        overlay.className = 'enhanced-loading-overlay';
        overlay.id = id;
        overlay.innerHTML = `
            <div class="enhanced-loading-content">
                <div class="enhanced-loading-spinner">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <div class="enhanced-loading-message">${this.escapeHtml(message)}</div>
                ${showProgress ? `
                    <div class="enhanced-loading-progress">
                        <div class="enhanced-loading-progress-bar">
                            <div class="enhanced-loading-progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div class="enhanced-loading-progress-text">${progress}%</div>
                    </div>
                ` : ''}
                ${canCancel ? `
                    <button class="enhanced-loading-cancel" onclick="window.enhancedLoading.cancelLoading('${id}')">
                        Cancel
                    </button>
                ` : ''}
            </div>
        `;

        document.body.appendChild(overlay);
        this.loadingOverlays.set(id, { overlay, onCancel });

        // Animate in
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });

        return id;
    }

    /**
     * Hide loading overlay
     */
    hideLoading(id) {
        const loading = this.loadingOverlays.get(id);
        if (!loading) return;

        const { overlay } = loading;
        overlay.style.opacity = '0';
        
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.remove();
            }
            this.loadingOverlays.delete(id);
        }, 300);
    }

    /**
     * Cancel loading
     */
    cancelLoading(id) {
        const loading = this.loadingOverlays.get(id);
        if (!loading) return;

        const { overlay, onCancel } = loading;
        
        if (onCancel) {
            onCancel();
        }
        
        this.hideLoading(id);
    }

    /**
     * Update loading progress
     */
    updateProgress(id, progress, message = null) {
        const loading = this.loadingOverlays.get(id);
        if (!loading) return;

        const { overlay } = loading;
        const progressFill = overlay.querySelector('.enhanced-loading-progress-fill');
        const progressText = overlay.querySelector('.enhanced-loading-progress-text');
        
        if (progressFill) {
            progressFill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${Math.round(progress)}%`;
        }
        
        if (message) {
            const messageEl = overlay.querySelector('.enhanced-loading-message');
            if (messageEl) {
                messageEl.textContent = message;
            }
        }
    }

    /**
     * Show inline loading bar
     */
    showLoadingBar(containerId, message = 'Loading...') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn('Container not found:', containerId);
            return null;
        }

        const id = `loading-bar-${Date.now()}`;
        const loadingBar = document.createElement('div');
        loadingBar.className = 'enhanced-loading-bar';
        loadingBar.id = id;
        loadingBar.innerHTML = `
            <div class="loading-bar-content">
                <div class="loading-bar-spinner"></div>
                <span class="loading-bar-message">${this.escapeHtml(message)}</span>
            </div>
        `;

        container.appendChild(loadingBar);
        this.loadingBars.set(id, { bar: loadingBar, container });

        return id;
    }

    /**
     * Hide inline loading bar
     */
    hideLoadingBar(id) {
        const loading = this.loadingBars.get(id);
        if (!loading) return;

        const { bar } = loading;
        bar.style.opacity = '0';
        
        setTimeout(() => {
            if (bar.parentNode) {
                bar.remove();
            }
            this.loadingBars.delete(id);
        }, 300);
    }

    /**
     * Show skeleton loader
     */
    showSkeletonLoader(containerId, count = 3) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        const id = `skeleton-${Date.now()}`;
        const skeleton = document.createElement('div');
        skeleton.className = 'enhanced-skeleton-loader';
        skeleton.id = id;
        
        skeleton.innerHTML = Array(count).fill(0).map(() => `
            <div class="skeleton-item">
                <div class="skeleton-avatar"></div>
                <div class="skeleton-content">
                    <div class="skeleton-line skeleton-line-title"></div>
                    <div class="skeleton-line skeleton-line-text"></div>
                    <div class="skeleton-line skeleton-line-text"></div>
                </div>
            </div>
        `).join('');

        container.appendChild(skeleton);
        return id;
    }

    /**
     * Hide skeleton loader
     */
    hideSkeletonLoader(id) {
        const skeleton = document.getElementById(id);
        if (skeleton && skeleton.parentNode) {
            skeleton.style.opacity = '0';
            setTimeout(() => {
                if (skeleton.parentNode) {
                    skeleton.remove();
                }
            }, 300);
        }
    }

    /**
     * Track progress for async operations
     */
    trackProgress(operationName, totalSteps) {
        const id = `progress-${Date.now()}`;
        const tracker = {
            id,
            name: operationName,
            total: totalSteps,
            current: 0,
            loadingId: this.showLoading(`${operationName}...`, { showProgress: true, progress: 0 })
        };

        this.progressTrackers.set(id, tracker);
        return id;
    }

    /**
     * Update progress tracker
     */
    updateProgressTracker(trackerId, step, message = null) {
        const tracker = this.progressTrackers.get(trackerId);
        if (!tracker) return;

        tracker.current = step;
        const progress = (step / tracker.total) * 100;
        const displayMessage = message || `${tracker.name} (${step}/${tracker.total})`;
        
        this.updateProgress(tracker.loadingId, progress, displayMessage);
    }

    /**
     * Complete progress tracker
     */
    completeProgressTracker(trackerId) {
        const tracker = this.progressTrackers.get(trackerId);
        if (!tracker) return;

        this.updateProgress(tracker.loadingId, 100, `${tracker.name} complete!`);
        setTimeout(() => {
            this.hideLoading(tracker.loadingId);
            this.progressTrackers.delete(trackerId);
        }, 500);
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Inject CSS styles
     */
    injectStyles() {
        if (document.getElementById('enhanced-loading-styles')) return;

        const style = document.createElement('style');
        style.id = 'enhanced-loading-styles';
        style.textContent = `
            .enhanced-loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .enhanced-loading-content {
                text-align: center;
                color: white;
            }

            .enhanced-loading-spinner {
                display: inline-block;
                position: relative;
                width: 80px;
                height: 80px;
                margin-bottom: 1.5rem;
            }

            .spinner-ring {
                position: absolute;
                width: 100%;
                height: 100%;
                border: 4px solid transparent;
                border-top-color: #ba944f;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            .spinner-ring:nth-child(2) {
                width: 70%;
                height: 70%;
                top: 15%;
                left: 15%;
                border-top-color: #ffd700;
                animation-duration: 1.5s;
                animation-direction: reverse;
            }

            .spinner-ring:nth-child(3) {
                width: 50%;
                height: 50%;
                top: 25%;
                left: 25%;
                border-top-color: #44ff44;
                animation-duration: 2s;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .enhanced-loading-message {
                font-size: 1.2rem;
                margin-bottom: 1rem;
                color: #ba944f;
                font-weight: 600;
            }

            .enhanced-loading-progress {
                width: 300px;
                margin: 1rem auto;
            }

            .enhanced-loading-progress-bar {
                width: 100%;
                height: 8px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 0.5rem;
            }

            .enhanced-loading-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #ba944f, #ffd700);
                transition: width 0.3s ease;
            }

            .enhanced-loading-progress-text {
                font-size: 0.9rem;
                color: rgba(255, 255, 255, 0.7);
            }

            .enhanced-loading-cancel {
                margin-top: 1rem;
                padding: 0.5rem 1rem;
                background: rgba(220, 53, 69, 0.2);
                border: 1px solid rgba(220, 53, 69, 0.5);
                color: #ff4444;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s;
            }

            .enhanced-loading-cancel:hover {
                background: rgba(220, 53, 69, 0.4);
            }

            .enhanced-loading-bar {
                padding: 1rem;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 8px;
                margin: 1rem 0;
                opacity: 1;
                transition: opacity 0.3s ease;
            }

            .loading-bar-content {
                display: flex;
                align-items: center;
                gap: 1rem;
            }

            .loading-bar-spinner {
                width: 20px;
                height: 20px;
                border: 3px solid rgba(186, 148, 79, 0.3);
                border-top-color: #ba944f;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
            }

            .loading-bar-message {
                color: #ba944f;
                font-weight: 600;
            }

            .enhanced-skeleton-loader {
                opacity: 1;
                transition: opacity 0.3s ease;
            }

            .skeleton-item {
                display: flex;
                gap: 1rem;
                padding: 1rem;
                margin-bottom: 1rem;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 8px;
            }

            .skeleton-avatar {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: linear-gradient(90deg, rgba(186, 148, 79, 0.2), rgba(186, 148, 79, 0.4), rgba(186, 148, 79, 0.2));
                background-size: 200% 100%;
                animation: skeleton-shimmer 1.5s infinite;
            }

            .skeleton-content {
                flex: 1;
            }

            .skeleton-line {
                height: 12px;
                background: linear-gradient(90deg, rgba(186, 148, 79, 0.2), rgba(186, 148, 79, 0.4), rgba(186, 148, 79, 0.2));
                background-size: 200% 100%;
                animation: skeleton-shimmer 1.5s infinite;
                border-radius: 4px;
                margin-bottom: 0.5rem;
            }

            .skeleton-line-title {
                width: 60%;
                height: 16px;
            }

            .skeleton-line-text {
                width: 100%;
            }

            .skeleton-line-text:last-child {
                width: 80%;
            }

            @keyframes skeleton-shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
        `;

        document.head.appendChild(style);
    }
}

// Initialize globally
let enhancedLoadingInstance = null;

function initEnhancedLoading() {
    if (!enhancedLoadingInstance) {
        enhancedLoadingInstance = new EnhancedLoadingStates();
        enhancedLoadingInstance.injectStyles();
    }
    return enhancedLoadingInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEnhancedLoading);
} else {
    initEnhancedLoading();
}

// Export globally
window.EnhancedLoadingStates = EnhancedLoadingStates;
window.enhancedLoading = () => enhancedLoadingInstance;

