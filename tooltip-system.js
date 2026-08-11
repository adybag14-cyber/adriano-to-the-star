/**
 * Tooltip System
 * Universal tooltip system for UI elements
 * 
 * Features:
 * - Automatic positioning (top, bottom, left, right)
 * - Smart positioning to avoid viewport edges
 * - Multiple trigger types (hover, click, focus)
 * - Rich content support (HTML, icons)
 * - Accessibility support
 */

class TooltipSystem {
    constructor() {
        this.tooltips = new Map();
        this.activeTooltip = null;
        this.init();
    }

    init() {
        // Auto-initialize tooltips with data-tooltip attribute
        this.initializeDataTooltips();
        console.log('✅ Tooltip System initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("t_oo_lt_ip_sy_st_em_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    initializeDataTooltips() {
        document.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('[data-tooltip]').forEach(element => {
                this.attach(element, {
                    content: element.getAttribute('data-tooltip'),
                    position: element.getAttribute('data-tooltip-position') || 'top',
                    trigger: element.getAttribute('data-tooltip-trigger') || 'hover'
                });
            });
        });
    }

    /**
     * Attach a tooltip to an element
     * @param {HTMLElement} element - Element to attach tooltip to
     * @param {Object} options - Tooltip options
     */
    attach(element, options = {}) {
        const tooltipId = `tooltip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const tooltip = {
            id: tooltipId,
            element,
            content: options.content || '',
            position: options.position || 'top',
            trigger: options.trigger || 'hover',
            delay: options.delay || 200,
            html: options.html || false,
            className: options.className || ''
        };

        this.tooltips.set(element, tooltip);

        // Attach event listeners based on trigger
        if (tooltip.trigger === 'hover') {
            let showTimeout;
            element.addEventListener('mouseenter', () => {
                showTimeout = setTimeout(() => {
                    this.show(tooltipId);
                }, tooltip.delay);
            });
            element.addEventListener('mouseleave', () => {
                clearTimeout(showTimeout);
                this.hide();
            });
        } else if (tooltip.trigger === 'click') {
            element.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.activeTooltip?.id === tooltipId) {
                    this.hide();
                } else {
                    this.show(tooltipId);
                }
            });
        } else if (tooltip.trigger === 'focus') {
            element.addEventListener('focus', () => {
                this.show(tooltipId);
            });
            element.addEventListener('blur', () => {
                this.hide();
            });
        }

        // Close on outside click for click trigger
        if (tooltip.trigger === 'click') {
            document.addEventListener('click', (e) => {
                if (!element.contains(e.target) && this.activeTooltip?.id === tooltipId) {
                    this.hide();
                }
            });
        }
    }

    show(tooltipId) {
        // Hide existing tooltip
        if (this.activeTooltip) {
            this.hide();
        }

        const tooltip = Array.from(this.tooltips.values()).find(t => t.id === tooltipId);
        if (!tooltip) return;

        const tooltipElement = this.createTooltipElement(tooltip);
        document.body.appendChild(tooltipElement);
        this.activeTooltip = { ...tooltip, element: tooltipElement };

        // Position tooltip
        this.positionTooltip(tooltipElement, tooltip.element, tooltip.position);

        // Trigger animation
        requestAnimationFrame(() => {
            tooltipElement.classList.add('tooltip-visible');
        });
    }

    createTooltipElement(tooltip) {
        const tooltipEl = document.createElement('div');
        tooltipEl.id = tooltip.id;
        tooltipEl.className = `tooltip ${tooltip.className}`;
        tooltipEl.setAttribute('role', 'tooltip');
        
        tooltipEl.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.95);
            color: white;
            padding: 0.5rem 0.75rem;
            border-radius: 6px;
            font-size: 0.85rem;
            font-family: 'Raleway', sans-serif;
            z-index: 10001;
            pointer-events: none;
            opacity: 0;
            transform: scale(0.9);
            transition: opacity 0.2s ease, transform 0.2s ease;
            max-width: 300px;
            word-wrap: break-word;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(186, 148, 79, 0.3);
        `;

        if (tooltip.html) {
            tooltipEl.innerHTML = tooltip.content;
        } else {
            tooltipEl.textContent = tooltip.content;
        }

        // Add arrow
        const arrow = document.createElement('div');
        arrow.className = 'tooltip-arrow';
        arrow.style.cssText = `
            position: absolute;
            width: 0;
            height: 0;
            border: 6px solid transparent;
        `;
        tooltipEl.appendChild(arrow);

        // Add CSS for visible state
        if (!document.getElementById('tooltip-styles')) {
            const style = document.createElement('style');
            style.id = 'tooltip-styles';
            style.textContent = `
                .tooltip-visible {
                    opacity: 1 !important;
                    transform: scale(1) !important;
                }
            `;
            document.head.appendChild(style);
        }

        return tooltipEl;
    }

    positionTooltip(tooltipEl, targetElement, preferredPosition) {
        const rect = targetElement.getBoundingClientRect();
        const tooltipRect = tooltipEl.getBoundingClientRect();
        const arrow = tooltipEl.querySelector('.tooltip-arrow');
        
        let position = preferredPosition;
        const top = 0;
        const left = 0;

        // Calculate positions
        const positions = {
            top: {
                top: rect.top - tooltipRect.height - 10,
                left: rect.left + (rect.width / 2) - (tooltipRect.width / 2),
                arrow: { bottom: '-6px', left: '50%', transform: 'translateX(-50%)', borderTopColor: 'rgba(0, 0, 0, 0.95)' }
            },
            bottom: {
                top: rect.bottom + 10,
                left: rect.left + (rect.width / 2) - (tooltipRect.width / 2),
                arrow: { top: '-6px', left: '50%', transform: 'translateX(-50%)', borderBottomColor: 'rgba(0, 0, 0, 0.95)' }
            },
            left: {
                top: rect.top + (rect.height / 2) - (tooltipRect.height / 2),
                left: rect.left - tooltipRect.width - 10,
                arrow: { right: '-6px', top: '50%', transform: 'translateY(-50%)', borderLeftColor: 'rgba(0, 0, 0, 0.95)' }
            },
            right: {
                top: rect.top + (rect.height / 2) - (tooltipRect.height / 2),
                left: rect.right + 10,
                arrow: { left: '-6px', top: '50%', transform: 'translateY(-50%)', borderRightColor: 'rgba(0, 0, 0, 0.95)' }
            }
        };

        let pos = positions[position];

        // Check if tooltip goes outside viewport and adjust
        if (pos.left < 10) {
            position = 'right';
            pos = positions.right;
        } else if (pos.left + tooltipRect.width > window.innerWidth - 10) {
            position = 'left';
            pos = positions.left;
        }

        if (pos.top < 10) {
            position = 'bottom';
            pos = positions.bottom;
        } else if (pos.top + tooltipRect.height > window.innerHeight - 10) {
            position = 'top';
            pos = positions.top;
        }

        tooltipEl.style.top = `${pos.top}px`;
        tooltipEl.style.left = `${pos.left}px`;

        // Position arrow
        if (arrow && pos.arrow) {
            Object.assign(arrow.style, pos.arrow);
        }
    }

    hide() {
        if (!this.activeTooltip) return;

        const tooltipEl = this.activeTooltip.element;
        tooltipEl.classList.remove('tooltip-visible');
        
        setTimeout(() => {
            if (tooltipEl.parentNode) {
                tooltipEl.parentNode.removeChild(tooltipEl);
            }
        }, 200);

        this.activeTooltip = null;
    }

    // Convenience method
    static attachToElement(element, content, options = {}) {
        if (!window.tooltipSystem) {
            window.tooltipSystem = new TooltipSystem();
        }
        window.tooltipSystem.attach(element, { content, ...options });
    }
}

// Initialize global instance
if (typeof window !== 'undefined') {
    window.tooltipSystem = new TooltipSystem();
}

