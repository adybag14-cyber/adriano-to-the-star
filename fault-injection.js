/**
 * Fault Injection
 * Fault injection testing
 */

class FaultInjection {
    constructor() {
        this.injectors = new Map();
        this.faults = new Map();
        this.init();
    }

    init() {
        this.trackEvent('f_au_lt_in_je_ct_io_n_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("f_au_lt_in_je_ct_io_n_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createInjector(injectorId, injectorData) {
        const injector = {
            id: injectorId,
            ...injectorData,
            name: injectorData.name || injectorId,
            target: injectorData.target || '',
            faultType: injectorData.faultType || 'latency',
            enabled: injectorData.enabled !== false,
            createdAt: new Date()
        };
        
        this.injectors.set(injectorId, injector);
        console.log(`Fault injector created: ${injectorId}`);
        return injector;
    }

    async inject(injectorId, request) {
        const injector = this.injectors.get(injectorId);
        if (!injector) {
            throw new Error('Injector not found');
        }
        
        if (!injector.enabled) {
            return { injected: false, request };
        }
        
        const fault = {
            id: `fault_${Date.now()}`,
            injectorId,
            type: injector.faultType,
            request,
            injectedAt: new Date(),
            createdAt: new Date()
        };
        
        this.faults.set(fault.id, fault);
        
        const modifiedRequest = this.applyFault(injector, request);
        
        return { injected: true, fault, modifiedRequest };
    }

    applyFault(injector, request) {
        if (injector.faultType === 'latency') {
            return { ...request, delay: 1000 };
        } else if (injector.faultType === 'error') {
            return { ...request, error: 'Injected error' };
        } else if (injector.faultType === 'timeout') {
            return { ...request, timeout: true };
        }
        
        return request;
    }

    getInjector(injectorId) {
        return this.injectors.get(injectorId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.faultInjection = new FaultInjection();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FaultInjection;
}

