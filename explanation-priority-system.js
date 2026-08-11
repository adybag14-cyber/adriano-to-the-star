/**
 * Explanation Priority System
 * Manages priorities for explanations
 */

class ExplanationPrioritySystem {
    constructor() {
        this.priorities = new Map();
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
        const containers = document.querySelectorAll('[data-priority-system]');
        containers.forEach(container => {
            this.setupPriorityInterface(container);
        });
    }

    setupPriorityInterface(container) {
        if (container.querySelector('.priority-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'priority-interface';
        ui.innerHTML = `
            <div class="priority-controls">
                <input type="text" data-explanation-id placeholder="Explanation ID">
                <select data-priority>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                </select>
                <button data-set-priority>Set Priority</button>
            </div>
            <div class="priority-results" role="region"></div>
        `;
        container.appendChild(ui);

        const setBtn = ui.querySelector('[data-set-priority]');
        if (setBtn) {
            setBtn.addEventListener('click', () => {
                this.setPriority(container);
            });
        }
    }

    setPriority(container) {
        const ui = container.querySelector('.priority-interface');
        if (!ui) return;
        
        const explanationId = ui.querySelector('[data-explanation-id]').value;
        const priority = ui.querySelector('[data-priority]').value;
        const resultsDiv = ui.querySelector('.priority-results');
        
        if (!explanationId || !resultsDiv) {
            if (!explanationId) alert('Please enter explanation ID');
            return;
        }

        resultsDiv.innerHTML = `
            <h3>Priority Set</h3>
            <p>Explanation: ${explanationId}</p>
            <p>Priority: ${priority}</p>
        `;
    }
}

const explanationPrioritySystem = new ExplanationPrioritySystem();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExplanationPrioritySystem;
}

