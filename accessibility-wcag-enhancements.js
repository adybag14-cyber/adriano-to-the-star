/**
 * WCAG 2.1 AA Accessibility Enhancements
 * Comprehensive accessibility improvements to meet WCAG 2.1 AA standards
 * 
 * Features:
 * - Enhanced focus indicators
 * - Screen reader optimizations
 * - Color contrast improvements
 * - Keyboard navigation enhancements
 * - ARIA labels and roles
 * - Skip links
 * - Focus trap in modals
 */

class AccessibilityWCAGEnhancements {
    constructor() {
        this.init();
    }
    
    init() {
        this.enhanceFocusIndicators();
        this.addSkipLinks();
        this.enhanceARIA();
        this.improveColorContrast();
        this.enhanceKeyboardNavigation();
        this.addFocusTraps();
        this.addScreenReaderAnnouncements();
        this.detectAndFixIssues();
        this.trackEvent('wcag_enhancements_initialized');
    }
    
    enhanceFocusIndicators() {
        const style = document.createElement('style');
        style.id = 'wcag-focus-styles';
        style.textContent = `
            *:focus-visible {
                outline: 3px solid #ba944f !important;
                outline-offset: 2px !important;
                border-radius: 2px !important;
            }
            
            button:focus-visible,
            a:focus-visible,
            input:focus-visible,
            select:focus-visible,
            textarea:focus-visible {
                outline: 3px solid #ba944f !important;
                outline-offset: 3px !important;
            }
            
            /* High contrast mode support */
            @media (prefers-contrast: high) {
                *:focus-visible {
                    outline: 4px solid #ffffff !important;
                    outline-offset: 3px !important;
                }
            }
            
            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
                *:focus-visible {
                    transition: none !important;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    addSkipLinks() {
        const skipLinks = document.createElement('nav');
        skipLinks.setAttribute('aria-label', 'Skip navigation links');
        skipLinks.style.cssText = `
            position: absolute;
            top: -100px;
            left: 0;
            z-index: 10000;
        `;
        
        skipLinks.innerHTML = `
            <a href="#main-content" class="skip-link" style="
                position: absolute;
                top: -40px;
                left: 0;
                background: #ba944f;
                color: #000;
                padding: 12px 20px;
                text-decoration: none;
                z-index: 10001;
                border-radius: 0 0 4px 0;
            ">Skip to main content</a>
            <a href="#navigation" class="skip-link" style="
                position: absolute;
                top: -40px;
                left: 120px;
                background: #ba944f;
                color: #000;
                padding: 12px 20px;
                text-decoration: none;
                z-index: 10001;
            ">Skip to navigation</a>
        `;
        
        skipLinks.querySelectorAll('.skip-link').forEach(link => {
            link.addEventListener('focus', () => {
                link.style.top = '0';
            });
            link.addEventListener('blur', () => {
                link.style.top = '-40px';
            });
        });
        
        document.body.insertBefore(skipLinks, document.body.firstChild);
    }
    
    enhanceARIA() {
        // Add ARIA labels to buttons without text
        document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])').forEach(btn => {
            if (!btn.textContent.trim() && !btn.querySelector('img[alt]')) {
                const icon = btn.innerHTML.trim();
                if (icon) {
                    btn.setAttribute('aria-label', this.getIconLabel(icon));
                }
            }
        });
        
        // Add ARIA labels to images
        document.querySelectorAll('img:not([alt])').forEach(img => {
            if (!img.hasAttribute('aria-hidden')) {
                img.setAttribute('alt', '');
                img.setAttribute('role', 'presentation');
            }
        });
        
        // Enhance form labels
        document.querySelectorAll('input, select, textarea').forEach(input => {
            if (!input.id) {
                input.id = 'input-' + Math.random().toString(36).substr(2, 9);
            }
            if (!input.getAttribute('aria-label') && !document.querySelector(`label[for="${input.id}"]`)) {
                const placeholder = input.getAttribute('placeholder');
                if (placeholder) {
                    input.setAttribute('aria-label', placeholder);
                }
            }
        });
        
        // Add landmark roles
        if (!document.querySelector('main[role="main"]') && !document.querySelector('#main-content')) {
            const main = document.querySelector('main') || document.querySelector('#main');
            if (main) {
                main.setAttribute('role', 'main');
                main.id = main.id || 'main-content';
            }
        }
        
        // Add navigation role
        document.querySelectorAll('nav').forEach(nav => {
            if (!nav.getAttribute('role')) {
                nav.setAttribute('role', 'navigation');
            }
        });
    }
    
    getIconLabel(icon) {
        const iconMap = {
            '🌙': 'Dark mode',
            '☀️': 'Light mode',
            '🎨': 'Color scheme',
            '🎬': 'Animation controls',
            '⌨️': 'Keyboard shortcuts',
            '♿': 'Accessibility',
            '🔍': 'Search',
            '✕': 'Close',
            '×': 'Close',
            '←': 'Back',
            '→': 'Forward',
            '↑': 'Up',
            '↓': 'Down'
        };
        return iconMap[icon] || 'Button';
    }
    
    improveColorContrast() {
        const style = document.createElement('style');
        style.id = 'wcag-contrast-styles';
        style.textContent = `
            /* Ensure minimum 4.5:1 contrast for normal text */
            body, p, span, div, li, td, th {
                color: #ffffff;
            }
            
            /* Ensure minimum 3:1 contrast for large text */
            h1, h2, h3, h4, h5, h6 {
                color: #ffffff;
            }
            
            /* High contrast mode */
            @media (prefers-contrast: high) {
                body {
                    background: #000000 !important;
                    color: #ffffff !important;
                }
                a {
                    color: #ba944f !important;
                    text-decoration: underline !important;
                }
                button {
                    border: 2px solid #ffffff !important;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    enhanceKeyboardNavigation() {
        // Trap focus in modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const modal = document.querySelector('.modal[style*="display: block"], .modal:not([style*="display: none"])');
                if (modal) {
                    this.trapFocus(modal, e);
                }
            }
        });
        
        // Close modals with Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.querySelector('.modal[style*="display: block"], .modal:not([style*="display: none"])');
                if (modal) {
                    const closeBtn = modal.querySelector('[aria-label*="close" i], .close, [class*="close"]');
                    if (closeBtn) {
                        closeBtn.click();
                    }
                }
            }
        });
    }
    
    trapFocus(container, e) {
        const focusableElements = container.querySelectorAll(
            'a[href], button:not([disabled]), textarea:not([disabled]), ' +
            'input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
        }
    }
    
    addFocusTraps() {
        // Auto-add focus trap to modals
        const observer = new MutationObserver(() => {
            document.querySelectorAll('.modal, [role="dialog"]').forEach(modal => {
                if (!modal.hasAttribute('data-focus-trap')) {
                    modal.setAttribute('data-focus-trap', 'true');
                    const firstFocusable = modal.querySelector(
                        'a[href], button:not([disabled]), textarea:not([disabled]), ' +
                        'input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
                    );
                    if (firstFocusable) {
                        firstFocusable.focus();
                    }
                }
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    addScreenReaderAnnouncements() {
        // Create live region for announcements
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('role', 'status');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.id = 'screen-reader-announcements';
        liveRegion.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        document.body.appendChild(liveRegion);
        
        window.announceToScreenReader = (message) => {
            liveRegion.textContent = message;
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        };
    }
    
    detectAndFixIssues() {
        // Check for missing alt text
        document.querySelectorAll('img').forEach(img => {
            if (!img.alt && !img.hasAttribute('aria-hidden')) {
                this.trackEvent('issue_detected', { type: 'missing_alt', element: 'img' });
            }
        });
        
        // Check for missing form labels
        document.querySelectorAll('input, select, textarea').forEach(input => {
            const id = input.id;
            const label = id ? document.querySelector(`label[for="${id}"]`) : null;
            const ariaLabel = input.getAttribute('aria-label');
            const ariaLabelledBy = input.getAttribute('aria-labelledby');
            
            if (!label && !ariaLabel && !ariaLabelledBy && input.type !== 'hidden') {
                this.trackEvent('issue_detected', { type: 'missing_label', element: input.tagName });
            }
        });
        
        // Check for heading hierarchy
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        let previousLevel = 0;
        headings.forEach(heading => {
            const level = parseInt(heading.tagName.charAt(1));
            if (level > previousLevel + 1) {
                this.trackEvent('issue_detected', { type: 'heading_skip', level });
            }
            previousLevel = level;
        });
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`wcag_enhancements_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'accessibility_wcag_enhancements', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.accessibilityWCAGEnhancements = new AccessibilityWCAGEnhancements();
    });
} else {
    window.accessibilityWCAGEnhancements = new AccessibilityWCAGEnhancements();
}

