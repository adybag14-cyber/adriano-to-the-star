/**
 * Explanation Event System
 * Manages events for explanations
 */

class ExplanationEventSystem {
    constructor() {
        this.events = new Map();
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
        const containers = document.querySelectorAll('[data-event-system]');
        containers.forEach(container => {
            this.setupEventInterface(container);
        });
    }

    setupEventInterface(container) {
        if (container.querySelector('.event-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'event-interface';
        ui.innerHTML = `
            <div class="event-controls">
                <input type="text" data-event-name placeholder="Event Name">
                <input type="text" data-event-data placeholder="Event Data">
                <button data-emit-event>Emit Event</button>
            </div>
            <div class="event-results" role="region"></div>
        `;
        container.appendChild(ui);

        const emitBtn = ui.querySelector('[data-emit-event]');
        if (emitBtn) {
            emitBtn.addEventListener('click', () => {
                this.emitEvent(container);
            });
        }
    }

    emitEvent(container) {
        const ui = container.querySelector('.event-interface');
        if (!ui) return;
        
        const eventName = ui.querySelector('[data-event-name]').value;
        const eventData = ui.querySelector('[data-event-data]').value;
        const resultsDiv = ui.querySelector('.event-results');
        
        if (!eventName || !resultsDiv) {
            if (!eventName) alert('Please enter event name');
            return;
        }

        resultsDiv.innerHTML = `
            <h3>Event Emitted</h3>
            <p>Event: ${eventName}</p>
            <p>Data: ${eventData || 'None'}</p>
        `;
    }
}

const explanationEventSystem = new ExplanationEventSystem();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExplanationEventSystem;
}

