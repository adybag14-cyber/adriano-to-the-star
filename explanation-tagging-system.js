/**
 * Explanation Tagging System
 * Tags explanations
 */

class ExplanationTaggingSystem {
    constructor() {
        this.tags = new Map();
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
        const containers = document.querySelectorAll('[data-explanation-tagging]');
        containers.forEach(container => {
            this.setupTaggingInterface(container);
        });
    }

    setupTaggingInterface(container) {
        if (container.querySelector('.tagging-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'tagging-interface';
        ui.innerHTML = `
            <div class="tagging-controls">
                <input type="text" data-explanation-id placeholder="Explanation ID">
                <input type="text" data-tags placeholder="Tags (comma-separated)">
                <button data-add-tags>Add Tags</button>
            </div>
            <div class="tagging-results" role="region"></div>
        `;
        container.appendChild(ui);

        const addBtn = ui.querySelector('[data-add-tags]');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.addTags(container);
            });
        }
    }

    addTags(container) {
        const ui = container.querySelector('.tagging-interface');
        if (!ui) return;
        
        const explanationId = ui.querySelector('[data-explanation-id]').value;
        const tags = ui.querySelector('[data-tags]').value;
        const resultsDiv = ui.querySelector('.tagging-results');
        
        if (!explanationId || !tags || !resultsDiv) {
            if (!explanationId || !tags) alert('Please fill all fields');
            return;
        }

        resultsDiv.innerHTML = `
            <h3>Tags Added</h3>
            <p>Explanation: ${explanationId}</p>
            <p>Tags: ${tags}</p>
        `;
    }
}

const explanationTaggingSystem = new ExplanationTaggingSystem();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExplanationTaggingSystem;
}

