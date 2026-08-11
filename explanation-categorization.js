/**
 * Explanation Categorization
 * Categorizes explanations
 */

class ExplanationCategorization {
    constructor() {
        this.categories = new Map();
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
        const containers = document.querySelectorAll('[data-explanation-categorization]');
        containers.forEach(container => {
            this.setupCategorizationInterface(container);
        });
    }

    setupCategorizationInterface(container) {
        if (container.querySelector('.categorization-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'categorization-interface';
        ui.innerHTML = `
            <div class="categorization-controls">
                <input type="text" data-explanation-id placeholder="Explanation ID">
                <select data-category>
                    <option value="technical">Technical</option>
                    <option value="business">Business</option>
                    <option value="user">User</option>
                </select>
                <button data-categorize>Categorize</button>
            </div>
            <div class="categorization-results" role="region"></div>
        `;
        container.appendChild(ui);

        const categorizeBtn = ui.querySelector('[data-categorize]');
        if (categorizeBtn) {
            categorizeBtn.addEventListener('click', () => {
                this.categorize(container);
            });
        }
    }

    categorize(container) {
        const ui = container.querySelector('.categorization-interface');
        if (!ui) return;
        
        const explanationId = ui.querySelector('[data-explanation-id]').value;
        const category = ui.querySelector('[data-category]').value;
        const resultsDiv = ui.querySelector('.categorization-results');
        
        if (!explanationId || !resultsDiv) {
            if (!explanationId) alert('Please enter explanation ID');
            return;
        }

        resultsDiv.innerHTML = `
            <h3>Categorized</h3>
            <p>Explanation: ${explanationId}</p>
            <p>Category: ${category}</p>
        `;
    }
}

const explanationCategorization = new ExplanationCategorization();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExplanationCategorization;
}

