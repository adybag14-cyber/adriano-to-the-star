/**
 * Explanation Branching
 * Creates branches of explanations
 */

class ExplanationBranching {
    constructor() {
        this.branches = new Map();
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
        const containers = document.querySelectorAll('[data-explanation-branching]');
        containers.forEach(container => {
            this.setupBranchingInterface(container);
        });
    }

    setupBranchingInterface(container) {
        if (container.querySelector('.branching-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'branching-interface';
        ui.innerHTML = `
            <div class="branching-controls">
                <input type="text" data-explanation-id placeholder="Explanation ID">
                <input type="text" data-branch-name placeholder="Branch Name">
                <button data-create-branch>Create Branch</button>
            </div>
            <div class="branching-results" role="region"></div>
        `;
        container.appendChild(ui);

        const createBtn = ui.querySelector('[data-create-branch]');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.createBranch(container);
            });
        }
    }

    createBranch(container) {
        const ui = container.querySelector('.branching-interface');
        if (!ui) return;
        
        const explanationId = ui.querySelector('[data-explanation-id]').value;
        const branchName = ui.querySelector('[data-branch-name]').value;
        const resultsDiv = ui.querySelector('.branching-results');
        
        if (!explanationId || !branchName || !resultsDiv) {
            if (!explanationId || !branchName) alert('Please fill all fields');
            return;
        }

        resultsDiv.innerHTML = `
            <h3>Branch Created</h3>
            <p>Explanation: ${explanationId}</p>
            <p>Branch: ${branchName}</p>
        `;
    }
}

const explanationBranching = new ExplanationBranching();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExplanationBranching;
}

