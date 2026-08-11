/**
 * Explanation Personalization
 * Personalizes explanations for users
 */

class ExplanationPersonalization {
    constructor() {
        this.personalizations = new Map();
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
        const containers = document.querySelectorAll('[data-explanation-personalization]');
        containers.forEach(container => {
            this.setupPersonalizationInterface(container);
        });
    }

    setupPersonalizationInterface(container) {
        if (container.querySelector('.personalization-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'personalization-interface';
        ui.innerHTML = `
            <div class="personalization-controls">
                <input type="text" data-explanation-id placeholder="Explanation ID">
                <input type="text" data-user-id placeholder="User ID">
                <button data-personalize>Personalize</button>
            </div>
            <div class="personalization-results" role="region"></div>
        `;
        container.appendChild(ui);

        const personalizeBtn = ui.querySelector('[data-personalize]');
        if (personalizeBtn) {
            personalizeBtn.addEventListener('click', () => {
                this.personalize(container);
            });
        }
    }

    personalize(container) {
        const ui = container.querySelector('.personalization-interface');
        if (!ui) return;
        
        const explanationId = ui.querySelector('[data-explanation-id]').value;
        const userId = ui.querySelector('[data-user-id]').value;
        const resultsDiv = ui.querySelector('.personalization-results');
        
        if (!explanationId || !userId || !resultsDiv) {
            if (!explanationId || !userId) alert('Please fill all fields');
            return;
        }

        resultsDiv.innerHTML = `
            <h3>Personalized</h3>
            <p>Explanation: ${explanationId}</p>
            <p>User: ${userId}</p>
        `;
    }
}

const explanationPersonalization = new ExplanationPersonalization();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExplanationPersonalization;
}

