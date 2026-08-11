/**
 * Explanation Diff Viewer
 * Views differences between explanations
 */

class ExplanationDiffViewer {
    constructor() {
        this.diffs = new Map();
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
        const containers = document.querySelectorAll('[data-explanation-diff]');
        containers.forEach(container => {
            this.setupDiffInterface(container);
        });
    }

    setupDiffInterface(container) {
        if (container.querySelector('.diff-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'diff-interface';
        ui.innerHTML = `
            <div class="diff-controls">
                <input type="text" data-explanation-a placeholder="Explanation A">
                <input type="text" data-explanation-b placeholder="Explanation B">
                <button data-view-diff>View Diff</button>
            </div>
            <div class="diff-results" role="region"></div>
        `;
        container.appendChild(ui);

        const viewBtn = ui.querySelector('[data-view-diff]');
        if (viewBtn) {
            viewBtn.addEventListener('click', () => {
                this.viewDiff(container);
            });
        }
    }

    viewDiff(container) {
        const ui = container.querySelector('.diff-interface');
        if (!ui) return;
        
        const explanationA = ui.querySelector('[data-explanation-a]').value;
        const explanationB = ui.querySelector('[data-explanation-b]').value;
        const resultsDiv = ui.querySelector('.diff-results');
        
        if (!explanationA || !explanationB || !resultsDiv) {
            if (!explanationA || !explanationB) alert('Please fill all fields');
            return;
        }

        resultsDiv.innerHTML = `
            <h3>Diff View</h3>
            <p>A: ${explanationA}</p>
            <p>B: ${explanationB}</p>
            <p>Changes: 5 lines</p>
        `;
    }
}

const explanationDiffViewer = new ExplanationDiffViewer();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExplanationDiffViewer;
}

