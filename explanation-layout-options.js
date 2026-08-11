/**
 * Explanation Layout Options
 * Provides layout options for explanations
 */

class ExplanationLayoutOptions {
    constructor() {
        this.layouts = new Map();
        this.init();
    }

    init() {
        this.registerLayouts();
        this.setupEventListeners();
    }

    registerLayouts() {
        this.layouts.set('list', { name: 'List' });
        this.layouts.set('grid', { name: 'Grid' });
        this.layouts.set('card', { name: 'Card' });
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeInterfaces();
        });
    }

    initializeInterfaces() {
        const containers = document.querySelectorAll('[data-layout-options]');
        containers.forEach(container => {
            this.setupLayoutInterface(container);
        });
    }

    setupLayoutInterface(container) {
        if (container.querySelector('.layout-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'layout-interface';
        ui.innerHTML = `
            <div class="layout-controls">
                <select data-layout>
                    ${Array.from(this.layouts.entries()).map(([code, layout]) => 
                        `<option value="${code}">${layout.name}</option>`
                    ).join('')}
                </select>
                <button data-apply-layout>Apply Layout</button>
            </div>
            <div class="layout-results" role="region"></div>
        `;
        container.appendChild(ui);

        const applyBtn = ui.querySelector('[data-apply-layout]');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                this.applyLayout(container);
            });
        }
    }

    applyLayout(container) {
        const ui = container.querySelector('.layout-interface');
        if (!ui) return;
        
        const layout = ui.querySelector('[data-layout]').value;
        const resultsDiv = ui.querySelector('.layout-results');
        
        if (!resultsDiv) return;

        resultsDiv.innerHTML = `
            <h3>Layout Applied</h3>
            <p>Layout: ${this.layouts.get(layout).name}</p>
        `;
    }
}

const explanationLayoutOptions = new ExplanationLayoutOptions();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExplanationLayoutOptions;
}

