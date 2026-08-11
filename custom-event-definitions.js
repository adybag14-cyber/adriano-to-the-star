/**
 * Custom Event Definitions
 * Define custom events for tracking
 */

class CustomEventDefinitions {
    constructor() {
        this.definitions = new Map();
        this.init();
    }
    
    init() {
        this.setupEventDefinitions();
        this.trackEvent('custom_event_defs_initialized');
    }
    
    setupEventDefinitions() {
        // Setup event definitions
    }
    
    defineEvent(name, config) {
        // Define custom event
        const definition = {
            name,
            schema: config.schema || {},
            required: config.required || [],
            validation: config.validation || null,
            createdAt: Date.now()
        };
        
        this.definitions.set(name, definition);
        return definition;
    }
    
    async validateEvent(eventName, data) {
        // Validate event against definition
        const definition = this.definitions.get(eventName);
        if (!definition) {
            return { valid: false, error: 'Event not defined' };
        }
        
        // Check required fields
        for (const field of definition.required) {
            if (!(field in data)) {
                return { valid: false, error: `Missing required field: ${field}` };
            }
        }
        
        // Run custom validation
        if (definition.validation) {
            const result = definition.validation(data);
            if (!result) {
                return { valid: false, error: 'Validation failed' };
            }
        }
        
        return { valid: true };
    }
    
    getDefinition(eventName) {
        // Get event definition
        return this.definitions.get(eventName);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`custom_event_defs_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.customEventDefinitions = new CustomEventDefinitions(); });
} else {
    window.customEventDefinitions = new CustomEventDefinitions();
}

