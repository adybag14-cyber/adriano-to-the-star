/**
 * Help System with Contextual Tooltips and Guides
 * 
 * Adds comprehensive help system with contextual tooltips and guides.
 * 
 * @module HelpSystemContextual
 * @version 1.0.0
 * @author Adriano To The Star
 */

class HelpSystemContextual {
    constructor() {
        this.tooltips = new Map();
        this.guides = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize help system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('HelpSystemContextual already initialized');
            return;
        }

        this.setupTooltips();
        this.injectStyles();
        
        this.isInitialized = true;
        console.log('✅ Help System initialized');
    }

    /**
     * Set up tooltips
     * @private
     */
    setupTooltips() {
        // Process elements with data-help attribute
        document.addEventListener('DOMContentLoaded', () => {
            this.processHelpElements();
        });

        // Process dynamically added elements
        const observer = new MutationObserver(() => {
            this.processHelpElements();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Process help elements
     * @private
     */
    processHelpElements() {
        const elements = document.querySelectorAll('[data-help]');
        elements.forEach(element => {
            if (!element.dataset.helpProcessed) {
                this.addTooltip(element);
                element.dataset.helpProcessed = 'true';
            }
        });
    }

    /**
     * Add tooltip to element
     * @private
     * @param {HTMLElement} element - Element to add tooltip to
     */
    addTooltip(element) {
        const helpText = element.dataset.help;
        const helpIcon = document.createElement('span');
        helpIcon.className = 'help-icon';
        helpIcon.textContent = '?';
        helpIcon.title = helpText;
        
        helpIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showTooltip(element, helpText, helpIcon);
        });

        element.style.position = 'relative';
        element.appendChild(helpIcon);
    }

    /**
     * Show tooltip
     * @private
     * @param {HTMLElement} element - Target element
     * @param {string} text - Tooltip text
     * @param {HTMLElement} trigger - Trigger element
     */
    showTooltip(element, text, trigger) {
        // Remove existing tooltip
        const existing = document.querySelector('.contextual-tooltip');
        if (existing) {
            existing.remove();
        }

        const tooltip = document.createElement('div');
        tooltip.className = 'contextual-tooltip';
        tooltip.textContent = text;
        
        document.body.appendChild(tooltip);

        // Position tooltip
        const rect = element.getBoundingClientRect();
        tooltip.style.top = `${rect.bottom + 5}px`;
        tooltip.style.left = `${rect.left}px`;

        // Close on click outside
        setTimeout(() => {
            document.addEventListener('click', function closeTooltip(e) {
                if (!tooltip.contains(e.target) && e.target !== trigger) {
                    tooltip.remove();
                    document.removeEventListener('click', closeTooltip);
                }
            });
        }, 100);
    }

    /**
     * Register guide
     * @public
     * @param {string} id - Guide ID
     * @param {Object} guide - Guide configuration
     */
    registerGuide(id, guide) {
        this.guides.set(id, guide);
    }

    /**
     * Show guide
     * @public
     * @param {string} id - Guide ID
     */
    showGuide(id) {
        const guide = this.guides.get(id);
        if (!guide) {
            console.warn(`Guide '${id}' not found`);
            return;
        }

        this.createGuideOverlay(guide);
    }

    /**
     * Create guide overlay
     * @private
     * @param {Object} guide - Guide configuration
     */
    createGuideOverlay(guide) {
        const overlay = document.createElement('div');
        overlay.className = 'guide-overlay';
        overlay.innerHTML = `
            <div class="guide-content">
                <h2>${guide.title}</h2>
                <div class="guide-steps">
                    ${guide.steps.map((step, index) => `
                        <div class="guide-step ${index === 0 ? 'active' : ''}" data-step="${index}">
                            <h3>${step.title}</h3>
                            <p>${step.description}</p>
                            ${step.image ? `<img src="${step.image}" alt="${step.title}">` : ''}
                        </div>
                    `).join('')}
                </div>
                <div class="guide-navigation">
                    <button class="guide-prev" disabled>Previous</button>
                    <span class="guide-progress">1 / ${guide.steps.length}</span>
                    <button class="guide-next">Next</button>
                    <button class="guide-close">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        let currentStep = 0;
        const steps = overlay.querySelectorAll('.guide-step');
        const prevBtn = overlay.querySelector('.guide-prev');
        const nextBtn = overlay.querySelector('.guide-next');
        const closeBtn = overlay.querySelector('.guide-close');
        const progress = overlay.querySelector('.guide-progress');

        const updateStep = () => {
            steps.forEach((step, index) => {
                step.classList.toggle('active', index === currentStep);
            });

            prevBtn.disabled = currentStep === 0;
            nextBtn.disabled = currentStep === steps.length - 1;
            progress.textContent = `${currentStep + 1} / ${steps.length}`;
        };

        prevBtn.addEventListener('click', () => {
            if (currentStep > 0) {
                currentStep--;
                updateStep();
            }
        });

        nextBtn.addEventListener('click', () => {
            if (currentStep < steps.length - 1) {
                currentStep++;
                updateStep();
            } else {
                overlay.remove();
            }
        });

        closeBtn.addEventListener('click', () => {
            overlay.remove();
        });
    }

    /**
     * Inject required styles
     * @private
     */
    injectStyles() {
        if (document.getElementById('help-system-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'help-system-styles';
        style.textContent = `
            .help-icon {
                display: inline-block;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #ba944f;
                color: white;
                text-align: center;
                line-height: 18px;
                font-size: 12px;
                cursor: help;
                margin-left: 5px;
                vertical-align: middle;
            }

            .contextual-tooltip {
                position: absolute;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                max-width: 300px;
                z-index: 10000;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
                animation: fadeIn 0.2s ease;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-5px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .guide-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }

            .guide-content {
                background: rgba(0, 0, 0, 0.95);
                color: white;
                padding: 2rem;
                border-radius: 8px;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            }

            .guide-step {
                display: none;
            }

            .guide-step.active {
                display: block;
            }

            .guide-navigation {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 2rem;
                gap: 1rem;
            }

            .guide-navigation button {
                padding: 0.5rem 1.5rem;
                border-radius: 4px;
                border: none;
                cursor: pointer;
                background: #ba944f;
                color: white;
            }

            .guide-navigation button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
        `;
        document.head.appendChild(style);
    }
}

// Create global instance
window.HelpSystemContextual = HelpSystemContextual;
window.helpSystem = new HelpSystemContextual();
window.helpSystem.init();

