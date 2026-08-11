/**
 * Form Analytics
 * Analytics for form interactions
 */

class FormAnalytics {
    constructor() {
        this.formData = new Map();
        this.init();
    }
    
    init() {
        this.setupFormTracking();
    }
    
    setupFormTracking() {
        // Track form interactions
        document.querySelectorAll('form').forEach(form => {
            const formId = form.id || form.name || 'form_' + Date.now();
            
            // Track form start
            form.addEventListener('focusin', (e) => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    this.trackFormEvent(formId, 'focus', e.target.name || e.target.id);
                }
            }, true);
            
            // Track form submission
            form.addEventListener('submit', (e) => {
                this.trackFormEvent(formId, 'submit', null);
            });
            
            // Track form abandonment
            form.addEventListener('focusout', () => {
                setTimeout(() => {
                    if (!document.activeElement || !form.contains(document.activeElement)) {
                        this.trackFormEvent(formId, 'abandon', null);
                    }
                }, 1000);
            });
        });
    }
    
    trackFormEvent(formId, event, field) {
        // Track form event
        if (!this.formData.has(formId)) {
            this.formData.set(formId, {
                id: formId,
                events: [],
                startTime: Date.now()
            });
        }
        
        const form = this.formData.get(formId);
        form.events.push({
            event,
            field,
            timestamp: Date.now()
        });
    }
    
    async getFormAnalytics(formId) {
        // Get form analytics
        const form = this.formData.get(formId);
        if (!form) return null;
        
        const events = form.events;
        const submits = events.filter(e => e.event === 'submit').length;
        const abandons = events.filter(e => e.event === 'abandon').length;
        const duration = events.length > 0 ? events[events.length - 1].timestamp - form.startTime : 0;
        
        return {
            formId,
            submits,
            abandons,
            completionRate: events.length > 0 ? (submits / (submits + abandons)) * 100 : 0,
            averageDuration: duration,
            fieldInteractions: this.getFieldStats(events)
        };
    }
    
    getFieldStats(events) {
        // Get field interaction statistics
        const fieldCounts = {};
        events.filter(e => e.field).forEach(e => {
            fieldCounts[e.field] = (fieldCounts[e.field] || 0) + 1;
        });
        return fieldCounts;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.formAnalytics = new FormAnalytics(); });
} else {
    window.formAnalytics = new FormAnalytics();
}

