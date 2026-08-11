/**
 * Water Management
 * Water consumption monitoring and management
 */

class WaterManagement {
    constructor() {
        this.facilities = new Map();
        this.meters = new Map();
        this.readings = new Map();
        this.init();
    }

    init() {
        this.trackEvent('w_at_er_ma_na_ge_me_nt_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("w_at_er_ma_na_ge_me_nt_" + eventName, 1, data);
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
        console.log(`Water facility created: ${facilityId}`);
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
            type: meterData.type || 'water',
            unit: meterData.unit || 'L',
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
    window.waterManagement = new WaterManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WaterManagement;
}

