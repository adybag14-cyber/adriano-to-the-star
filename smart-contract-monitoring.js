/**
 * Smart Contract Monitoring
 * Smart contract monitoring and alerting
 */

class SmartContractMonitoring {
    constructor() {
        this.monitors = new Map();
        this.contracts = new Map();
        this.events = new Map();
        this.alerts = new Map();
        this.init();
    }

    init() {
        this.trackEvent('s_ma_rt_co_nt_ra_ct_mo_ni_to_ri_ng_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_ma_rt_co_nt_ra_ct_mo_ni_to_ri_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerContract(contractId, contractData) {
        const contract = {
            id: contractId,
            ...contractData,
            address: contractData.address || '',
            abi: contractData.abi || [],
            network: contractData.network || 'mainnet',
            createdAt: new Date()
        };
        
        this.contracts.set(contractId, contract);
        console.log(`Contract registered for monitoring: ${contractId}`);
        return contract;
    }

    createMonitor(monitorId, monitorData) {
        const monitor = {
            id: monitorId,
            ...monitorData,
            contractId: monitorData.contractId,
            events: monitorData.events || [],
            thresholds: monitorData.thresholds || {},
            enabled: monitorData.enabled !== false,
            createdAt: new Date()
        };
        
        this.monitors.set(monitorId, monitor);
        console.log(`Monitor created: ${monitorId}`);
        return monitor;
    }

    recordEvent(contractId, eventData) {
        const contract = this.contracts.get(contractId);
        if (!contract) {
            throw new Error('Contract not found');
        }
        
        const event = {
            id: `event_${Date.now()}`,
            contractId,
            ...eventData,
            name: eventData.name || 'Unknown',
            blockNumber: eventData.blockNumber || 0,
            transactionHash: eventData.transactionHash || this.generateHash(),
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.events.set(event.id, event);
        
        this.checkMonitors(contractId, event);
        
        return event;
    }

    checkMonitors(contractId, event) {
        this.monitors.forEach((monitor, monitorId) => {
            if (monitor.contractId === contractId && monitor.enabled) {
                if (monitor.events.includes(event.name)) {
                    this.createAlert(monitorId, event);
                }
            }
        });
    }

    createAlert(monitorId, event) {
        const alert = {
            id: `alert_${Date.now()}`,
            monitorId,
            eventId: event.id,
            severity: 'medium',
            message: `Event detected: ${event.name}`,
            timestamp: new Date(),
            status: 'active',
            createdAt: new Date()
        };
        
        this.alerts.set(alert.id, alert);
        return alert;
    }

    generateHash() {
        return '0x' + Array.from({ length: 64 }, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }

    getContract(contractId) {
        return this.contracts.get(contractId);
    }

    getMonitor(monitorId) {
        return this.monitors.get(monitorId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.smartContractMonitoring = new SmartContractMonitoring();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartContractMonitoring;
}


