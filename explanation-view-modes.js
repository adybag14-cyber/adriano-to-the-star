/**
 * Explanation View Modes
 * Provides different view modes for explanations
 */

class ExplanationViewModes {
    constructor() {
        this.viewModes = new Map();
        this.init();
    }

    init() {
        this.registerViewModes();
        this.setupEventListeners();
    }

    registerViewModes() {
        this.viewModes.set('compact', { name: 'Compact' });
        this.viewModes.set('detailed', { name: 'Detailed' });
        this.viewModes.set('minimal', { name: 'Minimal' });
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeInterfaces();
        });
    }

    initializeInterfaces() {
        const containers = document.querySelectorAll('[data-view-modes]');
        containers.forEach(container => {
            this.setupViewModeInterface(container);
        });
    }

    setupViewModeInterface(container) {
        if (container.querySelector('.view-mode-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'view-mode-interface';
        ui.innerHTML = `
            <div class="view-mode-controls">
                <select data-view-mode>
                    ${Array.from(this.viewModes.entries()).map(([code, mode]) => 
                        `<option value="${code}">${mode.name}</option>`
                    ).join('')}
                </select>
                <button data-apply-view-mode>Apply View Mode</button>
            </div>
            <div class="view-mode-results" role="region"></div>
        `;
        container.appendChild(ui);

        const applyBtn = ui.querySelector('[data-apply-view-mode]');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                this.applyViewMode(container);
            });
        }
    }

    applyViewMode(container) {
        const ui = container.querySelector('.view-mode-interface');
        if (!ui) return;
        
        const viewMode = ui.querySelector('[data-view-mode]').value;
        const resultsDiv = ui.querySelector('.view-mode-results');
        
        if (!resultsDiv) return;

        resultsDiv.innerHTML = `
            <h3>View Mode Applied</h3>
            <p>Mode: ${this.viewModes.get(viewMode).name}</p>
        `;
    }
}

const explanationViewModes = new ExplanationViewModes();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExplanationViewModes;
}

