/**
 * IoT Hardware Security
 * Hardware security for IoT devices
 */

class IoTHardwareSecurity {
    constructor() {
        this.devices = new Map();
        this.trustZones = new Map();
        this.secureElements = new Map();
        this.init();
    }

    init() {
        this.trackEvent('i_ot_ha_rd_wa_re_se_cu_ri_ty_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("i_ot_ha_rd_wa_re_se_cu_ri_ty_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async createTrustZone(zoneId, zoneData) {
        const zone = {
            id: zoneId,
            ...zoneData,
            name: zoneData.name || zoneId,
            level: zoneData.level || 'secure',
            status: 'active',
            createdAt: new Date()
        };
        
        this.trustZones.set(zoneId, zone);
        return zone;
    }

    async enableSecureElement(deviceId, elementData) {
        const element = {
            id: `elem_${Date.now()}`,
            deviceId,
            ...elementData,
            type: elementData.type || 'TPM',
            status: 'enabled',
            createdAt: new Date()
        };

        this.secureElements.set(element.id, element);
        return element;
    }

    getDevice(deviceId) {
        return this.devices.get(deviceId);
    }

    getAllDevices() {
        return Array.from(this.devices.values());
    }
}

module.exports = IoTHardwareSecurity;

