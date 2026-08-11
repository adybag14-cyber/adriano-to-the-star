/**
 * Mobile Touch Optimization
 * Optimize touch interactions, swipe gestures, mobile-specific UI
 */

class MobileTouchOptimizer {
    constructor() {
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.swipeThreshold = 50;
        this.isMobile = this.detectMobile();
        this.isInitialized = false;

        this.init();
    }

    /**
     * Initialize mobile touch optimization
     */
    init() {
        if (!this.isMobile) {
            console.log('📱 Not a mobile device, skipping touch optimizations');
            return;
        }

        this.trackEvent('m_ob_il_et_ou_ch_op_ti_mi_ze_r_initialized');
        // Setup swipe gestures
        this.setupSwipeGestures();

        // Optimize touch targets
        this.optimizeTouchTargets();

        // Setup pull-to-refresh
        this.setupPullToRefresh();

        // Optimize scrolling
        this.optimizeScrolling();

        // Setup mobile-specific UI
        this.setupMobileUI();

        this.isInitialized = true;
        console.log('📱 Mobile Touch Optimizer initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("m_ob_il_et_ou_ch_op_ti_mi_ze_r_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    /**
     * Detect mobile device
     */
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
    }

    /**
     * Setup swipe gestures
     */
    setupSwipeGestures() {
        document.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
            this.touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.touchEndY = e.changedTouches[0].screenY;
            this.handleSwipe();
        }, { passive: true });
    }

    /**
     * Handle swipe gesture
     */
    handleSwipe() {
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;

        // Horizontal swipe
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.swipeThreshold) {
            if (deltaX > 0) {
                this.onSwipeRight();
            } else {
                this.onSwipeLeft();
            }
        }

        // Vertical swipe
        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > this.swipeThreshold) {
            if (deltaY > 0) {
                this.onSwipeDown();
            } else {
                this.onSwipeUp();
            }
        }
    }

    /**
     * Swipe right handler
     */
    onSwipeRight() {
        // Close modals, go back, etc.
        const openModal = document.querySelector('.modal:not([style*="display: none"])');
        if (openModal) {
            const closeBtn = openModal.querySelector('.close-btn, [aria-label*="close" i]');
            if (closeBtn) {
                closeBtn.click();
            }
        }
    }

    /**
     * Swipe left handler
     */
    onSwipeLeft() {
        // Open menus, next page, etc.
        console.log('Swipe left detected');
    }

    /**
     * Swipe up handler
     */
    onSwipeUp() {
        // Scroll to top, show navigation, etc.
        console.log('Swipe up detected');
    }

    /**
     * Swipe down handler
     */
    onSwipeDown() {
        // Pull to refresh, scroll to bottom, etc.
        console.log('Swipe down detected');
    }

    /**
     * Optimize touch targets
     */
    optimizeTouchTargets() {
        // Ensure buttons and interactive elements are at least 44x44px (iOS/Android guidelines)
        const style = document.createElement('style');
        style.id = 'mobile-touch-targets';
        style.textContent = `
            @media (max-width: 768px) {
                button, a, [role="button"], input[type="button"], input[type="submit"] {
                    min-height: 44px;
                    min-width: 44px;
                    padding: 0.75rem 1rem;
                }

                .planet-card {
                    touch-action: pan-y;
                }

                .modal {
                    touch-action: pan-y;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Setup pull-to-refresh
     */
    setupPullToRefresh() {
        let pullDistance = 0;
        let isPulling = false;

        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                isPulling = true;
                pullDistance = e.touches[0].clientY;
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (isPulling && window.scrollY === 0) {
                const currentY = e.touches[0].clientY;
                const pull = currentY - pullDistance;

                if (pull > 0 && pull < 100) {
                    // Show pull indicator
                    this.showPullIndicator(pull);
                }
            }
        }, { passive: true });

        document.addEventListener('touchend', () => {
            if (isPulling && pullDistance > 80) {
                this.refreshPage();
            }
            isPulling = false;
            this.hidePullIndicator();
        }, { passive: true });
    }

    /**
     * Show pull indicator
     */
    showPullIndicator(pullDistance) {
        let indicator = document.getElementById('pull-to-refresh-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'pull-to-refresh-indicator';
            indicator.style.cssText = `
                position: fixed;
                top: 0;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(186, 148, 79, 0.9);
                color: #000;
                padding: 1rem 2rem;
                border-radius: 0 0 12px 12px;
                z-index: 10000;
                font-weight: 600;
                text-align: center;
            `;
            document.body.appendChild(indicator);
        }

        indicator.textContent = pullDistance > 80 ? 'Release to refresh' : 'Pull to refresh';
        indicator.style.display = 'block';
    }

    /**
     * Hide pull indicator
     */
    hidePullIndicator() {
        const indicator = document.getElementById('pull-to-refresh-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    /**
     * Refresh page
     */
    refreshPage() {
        window.location.reload();
    }

    /**
     * Optimize scrolling
     */
    optimizeScrolling() {
        // Add smooth scrolling for mobile
        const style = document.createElement('style');
        style.id = 'mobile-scrolling';
        style.textContent = `
            @media (max-width: 768px) {
                * {
                    -webkit-overflow-scrolling: touch;
                }

                .planets-grid, .listings-grid, .courses-grid {
                    scroll-behavior: smooth;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Setup mobile-specific UI
     */
    setupMobileUI() {
        // Add mobile menu toggle
        this.setupMobileMenu();

        // Optimize modals for mobile
        this.optimizeModalsForMobile();

        // Add bottom navigation for mobile
        this.setupBottomNavigation();
    }

    /**
     * Setup mobile menu
     */
    setupMobileMenu() {
        // Mobile menu is already handled by navigation.js
        // This is a placeholder for additional mobile menu enhancements
    }

    /**
     * Optimize modals for mobile
     */
    optimizeModalsForMobile() {
        const style = document.createElement('style');
        style.id = 'mobile-modals';
        style.textContent = `
            @media (max-width: 768px) {
                .modal, [class*="modal"] {
                    width: 100% !important;
                    height: 100% !important;
                    max-width: 100% !important;
                    border-radius: 0 !important;
                    margin: 0 !important;
                }

                .modal-content {
                    padding: 1rem !important;
                    max-height: 100vh;
                    overflow-y: auto;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Setup bottom navigation
     */
    setupBottomNavigation() {
        // Check if bottom nav already exists
        if (document.getElementById('mobile-bottom-nav')) return;

        const nav = document.createElement('nav');
        nav.id = 'mobile-bottom-nav';
        nav.className = 'mobile-bottom-nav';
        nav.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.95);
            border-top: 2px solid rgba(186, 148, 79, 0.5);
            display: none;
            z-index: 9999;
            padding: 0.5rem 0;
        `;

        nav.innerHTML = `
            <div style="display: flex; justify-content: space-around; align-items: center;">
                <a href="index.html" style="display: flex; flex-direction: column; align-items: center; text-decoration: none; color: rgba(255,255,255,0.7); padding: 0.5rem;">
                    <span style="font-size: 1.5rem;">🏠</span>
                    <span style="font-size: 0.75rem; margin-top: 0.25rem;">Home</span>
                </a>
                <a href="database.html" style="display: flex; flex-direction: column; align-items: center; text-decoration: none; color: rgba(255,255,255,0.7); padding: 0.5rem;">
                    <span style="font-size: 1.5rem;">🪐</span>
                    <span style="font-size: 0.75rem; margin-top: 0.25rem;">Database</span>
                </a>
                <a href="stellar-ai.html" style="display: flex; flex-direction: column; align-items: center; text-decoration: none; color: rgba(255,255,255,0.7); padding: 0.5rem;">
                    <span style="font-size: 1.5rem;">🤖</span>
                    <span style="font-size: 0.75rem; margin-top: 0.25rem;">AI</span>
                </a>
                <a href="dashboard.html" style="display: flex; flex-direction: column; align-items: center; text-decoration: none; color: rgba(255,255,255,0.7); padding: 0.5rem;">
                    <span style="font-size: 1.5rem;">📊</span>
                    <span style="font-size: 0.75rem; margin-top: 0.25rem;">Dashboard</span>
                </a>
            </div>
        `;

        // Show on mobile only
        if (this.isMobile) {
            nav.style.display = 'block';
        }

        document.body.appendChild(nav);

        // Highlight current page
        const currentPath = window.location.pathname;
        nav.querySelectorAll('a').forEach(link => {
            if (link.getAttribute('href') === currentPath.split('/').pop()) {
                link.style.color = '#ba944f';
            }
        });
    }
}

// Initialize globally
if (typeof window !== 'undefined') {
    window.mobileTouchOptimizer = new MobileTouchOptimizer();

    // Make available globally
    window.getMobileTouchOptimizer = () => window.mobileTouchOptimizer;
}