/**
 * Accessibility Enhancements (WCAG 2.1 AA Compliance)
 * Comprehensive accessibility improvements for better user experience
 * 
 * Features:
 * - ARIA labels and roles
 * - Focus management
 * - Screen reader announcements
 * - High contrast mode
 * - Skip links
 * - Keyboard navigation improvements
 */

class AccessibilityEnhancements {
    constructor() {
        this.highContrastEnabled = false;
        this.fontSize = 1.0;
        this.init();
    }
    
    init() {
        // Load saved preferences
        this.loadPreferences();
        
        // Add skip links
        this.addSkipLinks();
        
        // Enhance ARIA labels
        this.enhanceARIALabels();
        
        // Improve focus management
        this.improveFocusManagement();
        
        // Add accessibility controls
        this.createAccessibilityControls();
        
        // Monitor and fix accessibility issues
        this.monitorAccessibility();
        
        console.log('♿ Accessibility enhancements initialized');
    }
    
    loadPreferences() {
        try {
            const saved = localStorage.getItem('accessibilityPreferences');
            if (saved) {
                const prefs = JSON.parse(saved);
                this.highContrastEnabled = prefs.highContrast || false;
                this.fontSize = prefs.fontSize || 1.0;
                this.applyPreferences();
            }
        } catch (e) {
            console.warn('Failed to load accessibility preferences:', e);
        }
    }
    
    savePreferences() {
        try {
            localStorage.setItem('accessibilityPreferences', JSON.stringify({
                highContrast: this.highContrastEnabled,
                fontSize: this.fontSize
            }));
        } catch (e) {
            console.warn('Failed to save accessibility preferences:', e);
        }
    }
    
    addSkipLinks() {
        // Add skip to main content link
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        skipLink.setAttribute('aria-label', 'Skip to main content');
        document.body.insertBefore(skipLink, document.body.firstChild);
        
        // Ensure main content has ID
        const mainContent = document.querySelector('main, #main-content, .main-content, [role="main"]');
        if (mainContent && !mainContent.id) {
            mainContent.id = 'main-content';
        }
    }
    
    enhanceARIALabels() {
        // Add ARIA labels to buttons without text
        const iconButtons = document.querySelectorAll('button:not([aria-label]):not(:has(span)):not(:has(text))');
        iconButtons.forEach(btn => {
            const icon = btn.querySelector('svg, i, [class*="icon"]');
            if (icon && !btn.getAttribute('aria-label')) {
                const title = btn.title || icon.getAttribute('aria-label') || 'Button';
                btn.setAttribute('aria-label', title);
            }
        });
        
        // Add ARIA labels to images
        const images = document.querySelectorAll('img:not([alt])');
        images.forEach(img => {
            if (!img.alt) {
                img.alt = img.title || 'Image';
                img.setAttribute('aria-label', img.alt);
            }
        });
        
        // Add role attributes where needed
        const nav = document.querySelector('nav');
        if (nav && !nav.getAttribute('role')) {
            nav.setAttribute('role', 'navigation');
            nav.setAttribute('aria-label', 'Main navigation');
        }
        
        // Add landmark roles
        const header = document.querySelector('header');
        if (header && !header.getAttribute('role')) {
            header.setAttribute('role', 'banner');
        }
        
        const footer = document.querySelector('footer');
        if (footer && !footer.getAttribute('role')) {
            footer.setAttribute('role', 'contentinfo');
        }
    }
    
    improveFocusManagement() {
        // Trap focus in modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const modal = document.querySelector('.modal:not([style*="display: none"]), [role="dialog"]:not([aria-hidden="true"])');
                if (modal) {
                    this.trapFocus(modal, e);
                }
            }
        });
        
        // Improve focus visibility
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });
        
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    }
    
    trapFocus(container, event) {
        const focusableElements = container.querySelectorAll(
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (event.shiftKey) {
            if (document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        }
    }
    
    createAccessibilityControls() {
        const controls = document.createElement('div');
        controls.className = 'accessibility-controls';
        controls.setAttribute('role', 'region');
        controls.setAttribute('aria-label', 'Accessibility controls');
        controls.innerHTML = `
            <button id="high-contrast-toggle" class="accessibility-toggle" aria-label="Toggle high contrast mode" title="High Contrast">
                🔍
            </button>
            <button id="font-size-increase" class="accessibility-toggle" aria-label="Increase font size" title="Larger Text">
                A+
            </button>
            <button id="font-size-decrease" class="accessibility-toggle" aria-label="Decrease font size" title="Smaller Text">
                A-
            </button>
            <button id="font-size-reset" class="accessibility-toggle" aria-label="Reset font size" title="Reset Text Size">
                A
            </button>
        `;
        
        // Position controls
        controls.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            z-index: 9999;
        `;
        
        // Style buttons
        const style = document.createElement('style');
        style.textContent = `
            .accessibility-controls button {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: rgba(186, 148, 79, 0.9);
                border: 2px solid rgba(186, 148, 79, 1);
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            }
            
            .accessibility-controls button:hover {
                transform: scale(1.1);
                background: rgba(186, 148, 79, 1);
            }
            
            .accessibility-controls button:focus {
                outline: 3px solid #ba944f;
                outline-offset: 2px;
            }
            
            .keyboard-navigation *:focus {
                outline: 3px solid #ba944f !important;
                outline-offset: 2px !important;
            }
        `;
        document.head.appendChild(style);
        
        // Add event listeners
        const highContrastBtn = controls.querySelector('#high-contrast-toggle');
        highContrastBtn.addEventListener('click', () => this.toggleHighContrast());
        
        const fontSizeIncrease = controls.querySelector('#font-size-increase');
        fontSizeIncrease.addEventListener('click', () => this.increaseFontSize());
        
        const fontSizeDecrease = controls.querySelector('#font-size-decrease');
        fontSizeDecrease.addEventListener('click', () => this.decreaseFontSize());
        
        const fontSizeReset = controls.querySelector('#font-size-reset');
        fontSizeReset.addEventListener('click', () => this.resetFontSize());
        
        document.body.appendChild(controls);
    }
    
    toggleHighContrast() {
        this.highContrastEnabled = !this.highContrastEnabled;
        document.body.classList.toggle('high-contrast', this.highContrastEnabled);
        this.savePreferences();
        this.announce(this.highContrastEnabled ? 'High contrast mode enabled' : 'High contrast mode disabled');
        this.trackEvent('high_contrast_toggled', { enabled: this.highContrastEnabled });
    }
    
    increaseFontSize() {
        this.fontSize = Math.min(this.fontSize + 0.1, 2.0);
        this.applyFontSize();
        this.savePreferences();
        this.trackEvent('font_size_changed', { size: this.fontSize });
    }
    
    decreaseFontSize() {
        this.fontSize = Math.max(this.fontSize - 0.1, 0.8);
        this.applyFontSize();
        this.savePreferences();
        this.trackEvent('font_size_changed', { size: this.fontSize });
    }
    
    resetFontSize() {
        this.fontSize = 1.0;
        this.applyFontSize();
        this.savePreferences();
        this.announce('Font size reset');
        this.trackEvent('font_size_reset');
    }

    trackEvent(eventName, data = {}) {
        if (window.performanceMonitoring && typeof window.performanceMonitoring.recordMetric === 'function') {
            try {
                window.performanceMonitoring.recordMetric(`accessibility:${eventName}`, 1, {
                    source: 'accessibility-enhancements',
                    ...data
                });
            } catch (e) {
                console.warn('Failed to record accessibility event:', e);
            }
        }
        if (window.analytics && window.analytics.track) {
            window.analytics.track('Accessibility Event', { event: eventName, ...data });
        }
    }
    
    applyFontSize() {
        document.documentElement.style.fontSize = `${this.fontSize * 100}%`;
    }
    
    applyPreferences() {
        if (this.highContrastEnabled) {
            document.body.classList.add('high-contrast');
        }
        this.applyFontSize();
    }
    
    monitorAccessibility() {
        // Check for missing alt text periodically
        setInterval(() => {
            const images = document.querySelectorAll('img:not([alt])');
            if (images.length > 0) {
                console.warn(`Found ${images.length} images without alt text`);
            }
        }, 30000);
        
        // Check for buttons without labels
        setInterval(() => {
            const buttons = document.querySelectorAll('button:not([aria-label]):not(:has(text))');
            if (buttons.length > 0) {
                console.warn(`Found ${buttons.length} buttons without labels`);
            }
        }, 30000);
    }
    
    announce(message) {
        const liveRegion = this.getOrCreateLiveRegion();
        liveRegion.textContent = message;
        setTimeout(() => {
            liveRegion.textContent = '';
        }, 1000);
    }
    
    getOrCreateLiveRegion() {
        let liveRegion = document.getElementById('aria-live-region');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'aria-live-region';
            liveRegion.setAttribute('role', 'status');
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.className = 'sr-only';
            document.body.appendChild(liveRegion);
        }
        return liveRegion;
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.accessibilityEnhancements = new AccessibilityEnhancements();
    });
} else {
    window.accessibilityEnhancements = new AccessibilityEnhancements();
}
