/**
 * Security Configuration Management
 * Security configuration and compliance management
 */

class SecurityConfigurationManagement {
    constructor() {
        this.configurations = new Map();
        this.baselines = new Map();
        this.assessments = new Map();
        this.init();
    }

    init() {
        this.trackEvent('sec_config_mgmt_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`sec_config_mgmt_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    createBaseline(baselineId, baselineData) {
        const baseline = {
            id: baselineId,
            ...baselineData,
            name: baselineData.name || baselineId,
            standards: baselineData.standards || [],
            settings: baselineData.settings || {},
            createdAt: new Date()
        };
        
        this.baselines.set(baselineId, baseline);
        console.log(`Security baseline created: ${baselineId}`);
        return baseline;
    }

    registerConfiguration(configId, configData) {
        const config = {
            id: configId,
            ...configData,
            system: configData.system || '',
            settings: configData.settings || {},
            createdAt: new Date()
        };
        
        this.configurations.set(configId, config);
        console.log(`Configuration registered: ${configId}`);
        return config;
    }

    assessConfiguration(configId, baselineId) {
        const config = this.configurations.get(configId);
        const baseline = this.baselines.get(baselineId);
        
        if (!config) {
            throw new Error('Configuration not found');
        }
        if (!baseline) {
            throw new Error('Baseline not found');
        }
        
        const deviations = [];
        let compliant = true;
        
        Object.keys(baseline.settings).forEach(key => {
            const baselineValue = baseline.settings[key];
            const configValue = config.settings[key];
            
            if (configValue !== baselineValue) {
                compliant = false;
                deviations.push({
                    setting: key,
                    expected: baselineValue,
                    actual: configValue
                });
            }
        });
        
        const assessment = {
            id: `assessment_${Date.now()}`,
            configId,
            baselineId,
            compliant,
            deviations,
            complianceScore: this.calculateComplianceScore(baseline.settings, config.settings),
            assessedAt: new Date(),
            createdAt: new Date()
        };
        
        this.assessments.set(assessment.id, assessment);
        
        return assessment;
    }

    calculateComplianceScore(baselineSettings, configSettings) {
        const total = Object.keys(baselineSettings).length;
        if (total === 0) return 100;
        
        let compliant = 0;
        Object.keys(baselineSettings).forEach(key => {
            if (baselineSettings[key] === configSettings[key]) {
                compliant++;
            }
        });
        
        return (compliant / total) * 100;
    }

    getConfiguration(configId) {
        return this.configurations.get(configId);
    }

    getBaseline(baselineId) {
        return this.baselines.get(baselineId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.securityConfigurationManagement = new SecurityConfigurationManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityConfigurationManagement;
}

