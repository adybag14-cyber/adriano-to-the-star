/**
 * Explanation Sharing System
 * Shares explanations with users
 */

class ExplanationSharingSystem {
    constructor() {
        this.shares = new Map();
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
        const containers = document.querySelectorAll('[data-explanation-sharing]');
        containers.forEach(container => {
            this.setupSharingInterface(container);
        });
    }

    setupSharingInterface(container) {
        if (container.querySelector('.sharing-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'sharing-interface';
        ui.innerHTML = `
            <div class="sharing-controls">
                <input type="text" data-explanation-id placeholder="Explanation ID">
                <input type="text" data-user-id placeholder="User ID">
                <button data-share>Share</button>
            </div>
            <div class="sharing-results" role="region"></div>
        `;
        container.appendChild(ui);

        const shareBtn = ui.querySelector('[data-share]');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.share(container);
            });
        }
    }

    share(container) {
        const ui = container.querySelector('.sharing-interface');
        if (!ui) return;
        
        const explanationId = ui.querySelector('[data-explanation-id]').value;
        const userId = ui.querySelector('[data-user-id]').value;
        const resultsDiv = ui.querySelector('.sharing-results');
        
        if (!explanationId || !userId || !resultsDiv) {
            if (!explanationId || !userId) alert('Please fill all fields');
            return;
        }

        resultsDiv.innerHTML = `
            <h3>Shared</h3>
            <p>Explanation: ${explanationId}</p>
            <p>User: ${userId}</p>
        `;
    }
}

const explanationSharingSystem = new ExplanationSharingSystem();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExplanationSharingSystem;
}

