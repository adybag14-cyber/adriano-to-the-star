/**
 * Energy Management
 * Energy consumption monitoring and management
 */

class EnergyManagement {
    constructor() {
        this.facilities = new Map();
        this.meters = new Map();
        this.readings = new Map();
        this.init();
    }

    init() {
        this.trackEvent('e_ne_rg_ym_an_ag_em_en_t_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("e_ne_rg_ym_an_ag_em_en_t_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createFacility(facilityId, facilityData) {
        const facility = {
            id: facilityId,
            ...facilityData,
            name: facilityData.name || facilityId,
            location: facilityData.location || '',
            meters: [],
            createdAt: new Date()
        };
        
        this.facilities.set(facilityId, facility);
        console.log(`Energy facility created: ${facilityId}`);
        return facility;
    }

    registerMeter(facilityId, meterId, meterData) {
        const facility = this.facilities.get(facilityId);
        if (!facility) {
            throw new Error('Facility not found');
        }
        
        const meter = {
            id: meterId,
            facilityId,
            ...meterData,
            name: meterData.name || meterId,
            type: meterData.type || 'electricity',
            unit: meterData.unit || 'kWh',
            createdAt: new Date()
        };
        
        this.meters.set(meterId, meter);
        facility.meters.push(meterId);
        
        return meter;
    }

    async recordReading(meterId, value, timestamp = null) {
        const meter = this.meters.get(meterId);
        if (!meter) {
            throw new Error('Meter not found');
        }
        
        const reading = {
            id: `reading_${Date.now()}`,
            meterId,
            facilityId: meter.facilityId,
            value,
            unit: meter.unit,
            timestamp: timestamp || new Date(),
            createdAt: new Date()
        };
        
        this.readings.set(reading.id, reading);
        
        return reading;
    }

    getConsumption(facilityId, startDate = null, endDate = null) {
        let readings = Array.from(this.readings.values())
            .filter(r => r.facilityId === facilityId);
        
        if (startDate) {
            readings = readings.filter(r => r.timestamp >= startDate);
        }
        
        if (endDate) {
            readings = readings.filter(r => r.timestamp <= endDate);
        }
        
        const total = readings.reduce((sum, r) => sum + (r.value || 0), 0);
        
        return {
            facilityId,
            total,
            readings: readings.length,
            average: readings.length > 0 ? total / readings.length : 0
        };
    }

    getFacility(facilityId) {
        return this.facilities.get(facilityId);
    }

    getMeter(meterId) {
        return this.meters.get(meterId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.energyManagement = new EnergyManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnergyManagement;
}

