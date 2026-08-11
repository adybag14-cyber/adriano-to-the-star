/**
 * Explanation Metadata Management
 * Manages metadata for explanations
 */

class ExplanationMetadataManagement {
    constructor() {
        this.metadata = new Map();
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
        const containers = document.querySelectorAll('[data-metadata-management]');
        containers.forEach(container => {
            this.setupMetadataInterface(container);
        });
    }

    setupMetadataInterface(container) {
        if (container.querySelector('.metadata-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'metadata-interface';
        ui.innerHTML = `
            <div class="metadata-controls">
                <input type="text" data-explanation-id placeholder="Explanation ID">
                <input type="text" data-key placeholder="Metadata Key">
                <input type="text" data-value placeholder="Metadata Value">
                <button data-add-metadata>Add Metadata</button>
            </div>
            <div class="metadata-results" role="region"></div>
        `;
        container.appendChild(ui);

        const addBtn = ui.querySelector('[data-add-metadata]');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.addMetadata(container);
            });
        }
    }

    addMetadata(container) {
        const ui = container.querySelector('.metadata-interface');
        if (!ui) return;
        
        const explanationId = ui.querySelector('[data-explanation-id]').value;
        const key = ui.querySelector('[data-key]').value;
        const value = ui.querySelector('[data-value]').value;
        const resultsDiv = ui.querySelector('.metadata-results');
        
        if (!explanationId || !key || !value || !resultsDiv) {
            if (!explanationId || !key || !value) alert('Please fill all fields');
            return;
        }

        resultsDiv.innerHTML = `
            <h3>Metadata Added</h3>
            <p>Explanation: ${explanationId}</p>
            <p>${key}: ${value}</p>
        `;
    }
}

const explanationMetadataManagement = new ExplanationMetadataManagement();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExplanationMetadataManagement;
}

