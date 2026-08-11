/**
 * Explanation Feedback System
 * Collects feedback on explanations
 */

class ExplanationFeedbackSystem {
    constructor() {
        this.feedback = new Map();
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
        const containers = document.querySelectorAll('[data-explanation-feedback]');
        containers.forEach(container => {
            this.setupFeedbackInterface(container);
        });
    }

    setupFeedbackInterface(container) {
        if (container.querySelector('.feedback-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'feedback-interface';
        ui.innerHTML = `
            <div class="feedback-controls">
                <input type="text" data-explanation-id placeholder="Explanation ID">
                <textarea data-feedback placeholder="Feedback"></textarea>
                <button data-submit-feedback>Submit Feedback</button>
            </div>
            <div class="feedback-results" role="region"></div>
        `;
        container.appendChild(ui);

        const submitBtn = ui.querySelector('[data-submit-feedback]');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.submitFeedback(container);
            });
        }
    }

    submitFeedback(container) {
        const ui = container.querySelector('.feedback-interface');
        if (!ui) return;
        
        const explanationId = ui.querySelector('[data-explanation-id]').value;
        const feedback = ui.querySelector('[data-feedback]').value;
        const resultsDiv = ui.querySelector('.feedback-results');
        
        if (!explanationId || !feedback || !resultsDiv) {
            if (!explanationId || !feedback) alert('Please fill all fields');
            return;
        }

        resultsDiv.innerHTML = `
            <h3>Feedback Submitted</h3>
            <p>Explanation: ${explanationId}</p>
            <p>Thank you for your feedback!</p>
        `;
    }
}

const explanationFeedbackSystem = new ExplanationFeedbackSystem();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExplanationFeedbackSystem;
}

