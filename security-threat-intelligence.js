/**
 * Security Threat Intelligence
 * Threat intelligence collection and analysis
 */

class SecurityThreatIntelligence {
    constructor() {
        this.threats = new Map();
        this.indicators = new Map();
        this.feeds = new Map();
        this.init();
    }

    init() {
        this.trackEvent('s_ec_ur_it_yt_hr_ea_ti_nt_el_li_ge_nc_e_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_ec_ur_it_yt_hr_ea_ti_nt_el_li_ge_nc_e_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerThreat(threatId, threatData) {
        const threat = {
            id: threatId,
            ...threatData,
            name: threatData.name || threatId,
            type: threatData.type || 'malware',
            severity: threatData.severity || 'medium',
            indicators: threatData.indicators || [],
            createdAt: new Date()
        };
        
        this.threats.set(threatId, threat);
        console.log(`Threat registered: ${threatId}`);
        return threat;
    }

    addIndicator(indicatorId, indicatorData) {
        const indicator = {
            id: indicatorId,
            ...indicatorData,
            type: indicatorData.type || 'ip',
            value: indicatorData.value || '',
            threatId: indicatorData.threatId || null,
            confidence: indicatorData.confidence || 'medium',
            createdAt: new Date()
        };
        
        this.indicators.set(indicatorId, indicator);
        console.log(`Indicator added: ${indicatorId}`);
        return indicator;
    }

    registerFeed(feedId, feedData) {
        const feed = {
            id: feedId,
            ...feedData,
            name: feedData.name || feedId,
            source: feedData.source || '',
            type: feedData.type || 'ioc',
            enabled: feedData.enabled !== false,
            lastUpdate: null,
            createdAt: new Date()
        };
        
        this.feeds.set(feedId, feed);
        console.log(`Threat feed registered: ${feedId}`);
        return feed;
    }

    checkIndicator(value, type = 'auto') {
        const detectedIndicators = [];
        
        this.indicators.forEach((indicator, indicatorId) => {
            if (type === 'auto' || indicator.type === type) {
                if (indicator.value === value || 
                    (typeof indicator.value === 'string' && indicator.value.includes(value))) {
                    detectedIndicators.push(indicator);
                }
            }
        });
        
        return {
            detected: detectedIndicators.length > 0,
            indicators: detectedIndicators,
            threatLevel: this.calculateThreatLevel(detectedIndicators)
        };
    }

    calculateThreatLevel(indicators) {
        if (indicators.length === 0) return 'low';
        
        const highConfidence = indicators.filter(i => i.confidence === 'high').length;
        if (highConfidence > 0) return 'high';
        
        const mediumConfidence = indicators.filter(i => i.confidence === 'medium').length;
        if (mediumConfidence > 0) return 'medium';
        
        return 'low';
    }

    getThreat(threatId) {
        return this.threats.get(threatId);
    }

    getIndicators(threatId = null) {
        if (threatId) {
            return Array.from(this.indicators.values())
                .filter(i => i.threatId === threatId);
        }
        return Array.from(this.indicators.values());
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.securityThreatIntelligence = new SecurityThreatIntelligence();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityThreatIntelligence;
}


