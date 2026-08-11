/**
 * Explanation Preference Settings
 * Manages user preferences for explanations
 */

class ExplanationPreferenceSettings {
    constructor() {
        this.preferences = new Map();
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
        const containers = document.querySelectorAll('[data-preference-settings]');
        containers.forEach(container => {
            this.setupPreferenceInterface(container);
        });
    }

    setupPreferenceInterface(container) {
        if (container.querySelector('.preference-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'preference-interface';
        ui.innerHTML = `
            <div class="preference-controls">
                <input type="text" data-user-id placeholder="User ID">
                <select data-preference-type>
                    <option value="notifications">Notifications</option>
                    <option value="display">Display</option>
                    <option value="language">Language</option>
                </select>
                <button data-save-preference>Save Preference</button>
            </div>
            <div class="preference-results" role="region"></div>
        `;
        container.appendChild(ui);

        const saveBtn = ui.querySelector('[data-save-preference]');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.savePreference(container);
            });
        }
    }

    savePreference(container) {
        const ui = container.querySelector('.preference-interface');
        if (!ui) return;
        
        const userId = ui.querySelector('[data-user-id]').value;
        const preferenceType = ui.querySelector('[data-preference-type]').value;
        const resultsDiv = ui.querySelector('.preference-results');
        
        if (!userId || !resultsDiv) {
            if (!userId) alert('Please enter user ID');
            return;
        }

        resultsDiv.innerHTML = `
            <h3>Preference Saved</h3>
            <p>User: ${userId}</p>
            <p>Type: ${preferenceType}</p>
        `;
    }
}

const explanationPreferenceSettings = new ExplanationPreferenceSettings();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExplanationPreferenceSettings;
}

