/**
 * Explanation Merge Functionality
 * Merges explanations
 */

class ExplanationMergeFunctionality {
    constructor() {
        this.merges = new Map();
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeInterfaces();
        });
    }

    initializeInterfaces() {
        const containers = document.querySelectorAll('[data-explanation-merge]');
        containers.forEach(container => {
            this.setupMergeInterface(container);
        });
    }

    setupMergeInterface(container) {
        if (container.querySelector('.merge-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'merge-interface';
        ui.innerHTML = `
            <div class="merge-controls">
                <input type="text" data-explanation-a placeholder="Explanation A">
                <input type="text" data-explanation-b placeholder="Explanation B">
                <button data-merge>Merge</button>
            </div>
            <div class="merge-results" role="region"></div>
        `;
        container.appendChild(ui);

        const mergeBtn = ui.querySelector('[data-merge]');
        if (mergeBtn) {
            mergeBtn.addEventListener('click', () => {
                this.merge(container);
            });
        }
    }

    merge(container) {
        const ui = container.querySelector('.merge-interface');
        if (!ui) return;
        
        const explanationA = ui.querySelector('[data-explanation-a]').value;
        const explanationB = ui.querySelector('[data-explanation-b]').value;
        const resultsDiv = ui.querySelector('.merge-results');
        
        if (!explanationA || !explanationB || !resultsDiv) {
            if (!explanationA || !explanationB) alert('Please fill all fields');
            return;
        }

        resultsDiv.innerHTML = `
            <h3>Merged</h3>
            <p>Combined explanations: ${explanationA} + ${explanationB}</p>
        `;
    }
}

const explanationMergeFunctionality = new ExplanationMergeFunctionality();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExplanationMergeFunctionality;
}

