/**
 * Tooltip System with Rich Content
 * Advanced tooltips with HTML content support
 */

class TooltipRichContentSystem {
    constructor() {
        this.activeTooltip = null;
        this.init();
    }
    
    init() {
        this.createTooltipContainer();
        this.observeTooltips();
    }
    
    createTooltipContainer() {
        const container = document.createElement('div');
        container.id = 'tooltip-container';
        container.style.cssText = `
            position: absolute;
            z-index: 10001;
            pointer-events: none;
            display: none;
        `;
        document.body.appendChild(container);
    }
    
    observeTooltips() {
        document.addEventListener('mouseenter', (e) => {
            const target = e.target.closest('[data-tooltip]');
            if (target) {
                this.showTooltip(target, e);
            }
        }, true);
        
        document.addEventListener('mouseleave', (e) => {
            const target = e.target.closest('[data-tooltip]');
            if (target) {
                this.hideTooltip();
            }
        }, true);
    }
    
    showTooltip(element, event) {
        const content = element.getAttribute('data-tooltip');
        const position = element.getAttribute('data-tooltip-position') || 'top';
        const container = document.getElementById('tooltip-container');
        
        container.innerHTML = content;
        container.style.display = 'block';
        
        const rect = element.getBoundingClientRect();
        const tooltipRect = container.getBoundingClientRect();
        
        let top, left;
        switch (position) {
            case 'top':
                top = rect.top - tooltipRect.height - 10;
                left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                break;
            case 'bottom':
                top = rect.bottom + 10;
                left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                break;
            case 'left':
                top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                left = rect.left - tooltipRect.width - 10;
                break;
            case 'right':
                top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                left = rect.right + 10;
                break;
        }
        
        container.style.top = `${top}px`;
        container.style.left = `${left}px`;
        container.style.background = 'rgba(0, 0, 0, 0.95)';
        container.style.border = '2px solid #ba944f';
        container.style.borderRadius = '8px';
        container.style.padding = '10px 15px';
        container.style.color = 'white';
        container.style.maxWidth = '300px';
    }
    
    hideTooltip() {
        const container = document.getElementById('tooltip-container');
        if (container) container.style.display = 'none';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.tooltipRichContentSystem = new TooltipRichContentSystem(); });
} else {
    window.tooltipRichContentSystem = new TooltipRichContentSystem();
}


