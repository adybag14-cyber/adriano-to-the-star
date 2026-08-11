/**
 * Explanation API
 * API for accessing explanations
 */

class ExplanationAPI {
    constructor() {
        this.endpoints = new Map();
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
        const containers = document.querySelectorAll('[data-explanation-api]');
        containers.forEach(container => {
            this.setupAPIInterface(container);
        });
    }

    setupAPIInterface(container) {
        if (container.querySelector('.api-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'api-interface';
        ui.innerHTML = `
            <div class="api-controls">
                <input type="text" data-endpoint placeholder="API Endpoint">
                <button data-call-api>Call API</button>
            </div>
            <div class="api-results" role="region"></div>
        `;
        container.appendChild(ui);

        const callBtn = ui.querySelector('[data-call-api]');
        if (callBtn) {
            callBtn.addEventListener('click', () => {
                this.callAPI(container);
            });
        }
    }

    callAPI(container) {
        const ui = container.querySelector('.api-interface');
        if (!ui) return;
        
        const endpoint = ui.querySelector('[data-endpoint]').value;
        const resultsDiv = ui.querySelector('.api-results');
        
        if (!endpoint || !resultsDiv) {
            if (!endpoint) alert('Please enter endpoint');
            return;
        }

        resultsDiv.innerHTML = `
            <h3>API Response</h3>
            <p>Endpoint: ${endpoint}</p>
            <p>Status: Success</p>
        `;
    }
}

const explanationAPI = new ExplanationAPI();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExplanationAPI;
}

