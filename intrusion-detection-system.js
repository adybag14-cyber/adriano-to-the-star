/**
 * Intrusion Detection System
 * Network and system intrusion detection
 */

class IntrusionDetectionSystem {
    constructor() {
        this.alerts = new Map();
        this.rules = new Map();
        this.events = new Map();
        this.init();
    }

    init() {
        this.trackEvent('i_nt_ru_si_on_de_te_ct_io_ns_ys_te_m_initialized');
        this.loadDefaultRules();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("i_nt_ru_si_on_de_te_ct_io_ns_ys_te_m_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadDefaultRules() {
        const rules = [
            { id: 'rule1', pattern: /failed login/i, type: 'brute_force', severity: 'high' },
            { id: 'rule2', pattern: /port scan|nmap/i, type: 'port_scan', severity: 'medium' },
            { id: 'rule3', pattern: /sql injection|union select/i, type: 'sql_injection', severity: 'high' },
            { id: 'rule4', pattern: /xss|script tag/i, type: 'xss', severity: 'medium' }
        ];
        
        rules.forEach(rule => {
            this.rules.set(rule.id, rule);
        });
    }

    analyzeEvent(event) {
        const eventData = {
            id: `event_${Date.now()}`,
            ...event,
            timestamp: new Date(event.timestamp || Date.now()),
            analyzed: false,
            threats: [],
            createdAt: new Date()
        };
        
        const detectedThreats = [];
        
        this.rules.forEach((rule, ruleId) => {
            const eventText = JSON.stringify(event).toLowerCase();
            if (rule.pattern.test(eventText)) {
                detectedThreats.push({
                    ruleId,
                    type: rule.type,
                    severity: rule.severity,
                    description: this.getThreatDescription(rule.type)
                });
            }
        });
        
        eventData.threats = detectedThreats;
        eventData.analyzed = true;
        eventData.isThreat = detectedThreats.length > 0;
        
        this.events.set(eventData.id, eventData);
        
        if (eventData.isThreat) {
            this.createAlert(eventData);
        }
        
        return eventData;
    }

    getThreatDescription(type) {
        const descriptions = {
            'brute_force': 'Brute force attack detected',
            'port_scan': 'Port scanning activity detected',
            'sql_injection': 'SQL injection attempt detected',
            'xss': 'Cross-site scripting attempt detected'
        };
        
        return descriptions[type] || 'Unknown threat';
    }

    createAlert(event) {
        const alert = {
            id: `alert_${Date.now()}`,
            eventId: event.id,
            severity: event.threats[0]?.severity || 'medium',
            type: event.threats[0]?.type || 'unknown',
            description: event.threats[0]?.description || 'Threat detected',
            timestamp: new Date(),
            status: 'active',
            createdAt: new Date()
        };
        
        this.alerts.set(alert.id, alert);
        return alert;
    }

    getAlerts(severity = null) {
        if (severity) {
            return Array.from(this.alerts.values())
                .filter(a => a.severity === severity);
        }
        return Array.from(this.alerts.values());
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.intrusionDetectionSystem = new IntrusionDetectionSystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IntrusionDetectionSystem;
}

