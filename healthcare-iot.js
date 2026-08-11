/**
 * Healthcare IoT
 * Healthcare IoT device management
 */

class HealthcareIoT {
    constructor() {
        this.facilities = new Map();
        this.patients = new Map();
        this.devices = new Map();
        this.init();
    }

    init() {
        this.trackEvent('h_ea_lt_hc_ar_ei_ot_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("h_ea_lt_hc_ar_ei_ot_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createFacility(facilityId, facilityData) {
        const facility = {
            id: facilityId,
            ...facilityData,
            name: facilityData.name || facilityId,
            type: facilityData.type || 'hospital',
            patients: [],
            devices: [],
            createdAt: new Date()
        };
        
        this.facilities.set(facilityId, facility);
        console.log(`Healthcare facility created: ${facilityId}`);
        return facility;
    }

    registerPatient(facilityId, patientId, patientData) {
        const facility = this.facilities.get(facilityId);
        if (!facility) {
            throw new Error('Facility not found');
        }
        
        const patient = {
            id: patientId,
            facilityId,
            ...patientData,
            name: patientData.name || patientId,
            devices: [],
            createdAt: new Date()
        };
        
        this.patients.set(patientId, patient);
        facility.patients.push(patientId);
        
        return patient;
    }

    registerDevice(patientId, deviceId, deviceData) {
        const patient = this.patients.get(patientId);
        if (!patient) {
            throw new Error('Patient not found');
        }
        
        const device = {
            id: deviceId,
            patientId,
            ...deviceData,
            name: deviceData.name || deviceId,
            type: deviceData.type || 'monitor',
            status: 'active',
            createdAt: new Date()
        };
        
        this.devices.set(deviceId, device);
        patient.devices.push(deviceId);
        
        const facility = this.facilities.get(patient.facilityId);
        if (facility && !facility.devices.includes(deviceId)) {
            facility.devices.push(deviceId);
        }
        
        return device;
    }

    async recordVitalSigns(deviceId, vitalSigns) {
        const device = this.devices.get(deviceId);
        if (!device) {
            throw new Error('Device not found');
        }
        
        return {
            deviceId,
            patientId: device.patientId,
            vitalSigns,
            timestamp: new Date()
        };
    }

    getFacility(facilityId) {
        return this.facilities.get(facilityId);
    }

    getPatient(patientId) {
        return this.patients.get(patientId);
    }

    getDevice(deviceId) {
        return this.devices.get(deviceId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.healthcareIot = new HealthcareIoT();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HealthcareIoT;
}

