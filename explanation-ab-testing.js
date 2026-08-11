/**
 * Explanation A/B Testing
 * A/B tests explanations
 */

class ExplanationABTesting {
    constructor() {
        this.tests = new Map();
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
        const containers = document.querySelectorAll('[data-explanation-ab-test]');
        containers.forEach(container => {
            this.setupABTestInterface(container);
        });
    }

    setupABTestInterface(container) {
        if (container.querySelector('.ab-test-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'ab-test-interface';
        ui.innerHTML = `
            <div class="ab-controls">
                <input type="text" data-explanation-a placeholder="Explanation A">
                <input type="text" data-explanation-b placeholder="Explanation B">
                <button data-run-test>Run A/B Test</button>
            </div>
            <div class="ab-results" role="region"></div>
        `;
        container.appendChild(ui);

        const runBtn = ui.querySelector('[data-run-test]');
        if (runBtn) {
            runBtn.addEventListener('click', () => {
                this.runTest(container);
            });
        }
    }

    runTest(container) {
        const ui = container.querySelector('.ab-test-interface');
        if (!ui) return;
        
        const explanationA = ui.querySelector('[data-explanation-a]').value;
        const explanationB = ui.querySelector('[data-explanation-b]').value;
        const resultsDiv = ui.querySelector('.ab-results');
        
        if (!explanationA || !explanationB || !resultsDiv) {
            if (!explanationA || !explanationB) alert('Please fill all fields');
            return;
        }

        resultsDiv.innerHTML = `
            <h3>A/B Test Results</h3>
            <p>A: ${explanationA} - 52%</p>
            <p>B: ${explanationB} - 48%</p>
        `;
    }
}

const explanationABTesting = new ExplanationABTesting();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExplanationABTesting;
}

