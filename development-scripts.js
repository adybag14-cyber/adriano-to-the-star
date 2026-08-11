/**
 * Development Scripts
 * @class DevelopmentScripts
 * @description Manages development scripts for common tasks.
 */
class DevelopmentScripts {
    constructor() {
        this.scripts = new Map();
        this.init();
    }

    init() {
        this.trackEvent('d_ev_el_op_me_nt_sc_ri_pt_s_initialized');
        this.setupDefaultScripts();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("d_ev_el_op_me_nt_sc_ri_pt_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    setupDefaultScripts() {
        this.scripts.set('setup', {
            name: 'setup',
            description: 'Setup development environment',
            command: 'npm install'
        });

        this.scripts.set('test', {
            name: 'test',
            description: 'Run tests',
            command: 'npm test'
        });

        this.scripts.set('lint', {
            name: 'lint',
            description: 'Lint code',
            command: 'npm run lint'
        });
    }

    /**
     * Add script.
     * @param {string} scriptName - Script name.
     * @param {object} scriptData - Script data.
     */
    addScript(scriptName, scriptData) {
        this.scripts.set(scriptName, {
            ...scriptData,
            name: scriptName
        });
        console.log(`Development script added: ${scriptName}`);
    }

    /**
     * Get script.
     * @param {string} scriptName - Script name.
     * @returns {object} Script data.
     */
    getScript(scriptName) {
        return this.scripts.get(scriptName);
    }

    /**
     * List all scripts.
     * @returns {Array<object>} All scripts.
     */
    listScripts() {
        return Array.from(this.scripts.values());
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.developmentScripts = new DevelopmentScripts();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DevelopmentScripts;
}

