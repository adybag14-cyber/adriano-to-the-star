/**
 * Comprehensive Keyboard Navigation System
 * 
 * Adds keyboard navigation support for all interactive elements.
 * 
 * @module KeyboardNavigationSystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class KeyboardNavigationSystem {
    constructor() {
        this.focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            '[contenteditable="true"]'
        ];
        this.isInitialized = false;
        this.currentFocusIndex = -1;
        this.focusableElements = [];
    }

    /**
     * Initialize keyboard navigation system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('KeyboardNavigationSystem already initialized');
            return;
        }

        this.setupKeyboardShortcuts();
        this.setupFocusTrapping();
        this.setupArrowKeyNavigation();
        this.injectStyles();
        
        this.isInitialized = true;
        console.log('✅ Keyboard Navigation System initialized');
    }

    /**
     * Set up keyboard shortcuts
     * @private
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Skip if user is typing in input
            if (e.target.tagName === 'INPUT' || 
                e.target.tagName === 'TEXTAREA' || 
                e.target.isContentEditable) {
                return;
            }

            // Escape key - close modals, clear focus
            if (e.key === 'Escape') {
                this.handleEscape();
            }

            // Tab key - enhanced tab navigation
            if (e.key === 'Tab') {
                this.handleTab(e);
            }

            // Enter/Space - activate focused element
            if (e.key === 'Enter' || e.key === ' ') {
                this.handleActivation(e);
            }

            // Arrow keys - navigate between elements
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                this.handleArrowKeys(e);
            }
        });
    }

    /**
     * Handle Escape key
     * @private
     */
    handleEscape() {
        // Close any open modals
        const modals = document.querySelectorAll('.modal:not([style*="display: none"])');
        modals.forEach(modal => {
            const closeBtn = modal.querySelector('.modal-close, [data-close]');
            if (closeBtn) {
                closeBtn.click();
            }
        });

        // Clear focus
        if (document.activeElement && document.activeElement.blur) {
            document.activeElement.blur();
        }
    }

    /**
     * Handle Tab key
     * @private
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleTab(e) {
        // Get all focusable elements
        this.updateFocusableElements();
        
        if (this.focusableElements.length === 0) {
            return;
        }

        // Find current focus index
        const currentIndex = this.focusableElements.indexOf(document.activeElement);
        
        if (e.shiftKey) {
            // Shift+Tab - move backward
            const prevIndex = currentIndex <= 0 
                ? this.focusableElements.length - 1 
                : currentIndex - 1;
            e.preventDefault();
            this.focusableElements[prevIndex].focus();
        } else {
            // Tab - move forward
            const nextIndex = currentIndex >= this.focusableElements.length - 1 
                ? 0 
                : currentIndex + 1;
            e.preventDefault();
            this.focusableElements[nextIndex].focus();
        }
    }

    /**
     * Handle activation (Enter/Space)
     * @private
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleActivation(e) {
        const target = document.activeElement;
        
        if (target.tagName === 'BUTTON' || 
            target.tagName === 'A' || 
            target.hasAttribute('role') && ['button', 'link'].includes(target.getAttribute('role'))) {
            // Prevent default space scroll
            if (e.key === ' ') {
                e.preventDefault();
            }
            target.click();
        }
    }

    /**
     * Handle arrow keys
     * @private
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleArrowKeys(e) {
        this.updateFocusableElements();
        
        if (this.focusableElements.length === 0) {
            return;
        }

        const currentIndex = this.focusableElements.indexOf(document.activeElement);
        let nextIndex = currentIndex;

        switch (e.key) {
            case 'ArrowDown':
                nextIndex = (currentIndex + 1) % this.focusableElements.length;
                break;
            case 'ArrowUp':
                nextIndex = currentIndex <= 0 
                    ? this.focusableElements.length - 1 
                    : currentIndex - 1;
                break;
            case 'ArrowRight':
                nextIndex = (currentIndex + 1) % this.focusableElements.length;
                break;
            case 'ArrowLeft':
                nextIndex = currentIndex <= 0 
                    ? this.focusableElements.length - 1 
                    : currentIndex - 1;
                break;
        }

        e.preventDefault();
        this.focusableElements[nextIndex].focus();
    }

    /**
     * Update focusable elements list
     * @private
     */
    updateFocusableElements() {
        const allElements = document.querySelectorAll(this.focusableSelectors.join(', '));
        this.focusableElements = Array.from(allElements).filter(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && 
                   style.visibility !== 'hidden' && 
                   style.opacity !== '0';
        });
    }

    /**
     * Set up focus trapping for modals
     * @private
     */
    setupFocusTrapping() {
        // Observe modal openings
        const observer = new MutationObserver(() => {
            const modals = document.querySelectorAll('.modal:not([style*="display: none"])');
            modals.forEach(modal => {
                this.trapFocus(modal);
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
    }

    /**
     * Trap focus within element
     * @public
     * @param {HTMLElement} container - Container element
     */
    trapFocus(container) {
        const focusableElements = container.querySelectorAll(this.focusableSelectors.join(', '));
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (!firstElement) return;

        container.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        });
    }

    /**
     * Inject required styles
     * @private
     */
    injectStyles() {
        if (document.getElementById('keyboard-navigation-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'keyboard-navigation-styles';
        style.textContent = `
            *:focus-visible {
                outline: 2px solid #ba944f;
                outline-offset: 2px;
            }

            .keyboard-navigation-active {
                outline: 2px solid #ba944f !important;
                outline-offset: 2px !important;
            }

            .skip-link {
                position: absolute;
                top: -40px;
                left: 0;
                background: #ba944f;
                color: white;
                padding: 8px;
                text-decoration: none;
                z-index: 10000;
            }

            .skip-link:focus {
                top: 0;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Add skip link
     * @public
     * @param {string} href - Link target
     * @param {string} text - Link text
     */
    addSkipLink(href, text = 'Skip to main content') {
        const skipLink = document.createElement('a');
        skipLink.href = href;
        skipLink.className = 'skip-link';
        skipLink.textContent = text;
        document.body.insertBefore(skipLink, document.body.firstChild);
    }
}

// Create global instance
window.KeyboardNavigationSystem = KeyboardNavigationSystem;

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.keyboardNavigation = new KeyboardNavigationSystem();
        window.keyboardNavigation.init();
    });
} else {
    window.keyboardNavigation = new KeyboardNavigationSystem();
    window.keyboardNavigation.init();
}

