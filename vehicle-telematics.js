/**
 * Vehicle Telematics
 * Vehicle telematics data collection
 */

class VehicleTelematics {
    constructor() {
        this.vehicles = new Map();
        this.telemetry = new Map();
        this.init();
    }

    init() {
        this.trackEvent('v_eh_ic_le_te_le_ma_ti_cs_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("v_eh_ic_le_te_le_ma_ti_cs_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerVehicle(vehicleId, vehicleData) {
        const vehicle = {
            id: vehicleId,
            ...vehicleData,
            name: vehicleData.name || vehicleId,
            make: vehicleData.make || '',
            model: vehicleData.model || '',
            vin: vehicleData.vin || this.generateVIN(),
            status: 'active',
            createdAt: new Date()
        };
        
        this.vehicles.set(vehicleId, vehicle);
        console.log(`Vehicle registered: ${vehicleId}`);
        return vehicle;
    }

    async recordTelemetry(vehicleId, telemetryData) {
        const vehicle = this.vehicles.get(vehicleId);
        if (!vehicle) {
            throw new Error('Vehicle not found');
        }
        
        const telemetry = {
            id: `telemetry_${Date.now()}`,
            vehicleId,
            ...telemetryData,
            speed: telemetryData.speed || 0,
            rpm: telemetryData.rpm || 0,
            fuelLevel: telemetryData.fuelLevel || 100,
            latitude: telemetryData.latitude || 0,
            longitude: telemetryData.longitude || 0,
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.telemetry.set(telemetry.id, telemetry);
        
        return telemetry;
    }

    getVehicleTelemetry(vehicleId, startDate = null, endDate = null) {
        let telemetry = Array.from(this.telemetry.values())
            .filter(t => t.vehicleId === vehicleId);
        
        if (startDate) {
            telemetry = telemetry.filter(t => t.timestamp >= startDate);
        }
        
        if (endDate) {
            telemetry = telemetry.filter(t => t.timestamp <= endDate);
        }
        
        return telemetry.sort((a, b) => b.timestamp - a.timestamp);
    }

    generateVIN() {
        return Array.from({ length: 17 }, () => 
            'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'[
                Math.floor(Math.random() * 33)
            ]
        ).join('');
    }

    getVehicle(vehicleId) {
        return this.vehicles.get(vehicleId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.vehicleTelematics = new VehicleTelematics();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VehicleTelematics;
}

