/**
 * Industrial IoT
 * Industrial IoT platform
 */

class IndustrialIoT {
    constructor() {
        this.facilities = new Map();
        this.machines = new Map();
        this.productionLines = new Map();
        this.init();
    }

    init() {
        this.trackEvent('i_nd_us_tr_ia_li_ot_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("i_nd_us_tr_ia_li_ot_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createFacility(facilityId, facilityData) {
        const facility = {
            id: facilityId,
            ...facilityData,
            name: facilityData.name || facilityId,
            location: facilityData.location || '',
            productionLines: [],
            machines: [],
            createdAt: new Date()
        };
        
        this.facilities.set(facilityId, facility);
        console.log(`Industrial facility created: ${facilityId}`);
        return facility;
    }

    createProductionLine(facilityId, lineId, lineData) {
        const facility = this.facilities.get(facilityId);
        if (!facility) {
            throw new Error('Facility not found');
        }
        
        const line = {
            id: lineId,
            facilityId,
            ...lineData,
            name: lineData.name || lineId,
            machines: [],
            status: 'operational',
            createdAt: new Date()
        };
        
        this.productionLines.set(lineId, line);
        facility.productionLines.push(lineId);
        
        return line;
    }

    registerMachine(facilityId, lineId, machineId, machineData) {
        const facility = this.facilities.get(facilityId);
        const line = this.productionLines.get(lineId);
        
        if (!facility || !line) {
            throw new Error('Facility or production line not found');
        }
        
        const machine = {
            id: machineId,
            facilityId,
            lineId,
            ...machineData,
            name: machineData.name || machineId,
            type: machineData.type || 'cnc',
            status: 'idle',
            efficiency: 0,
            createdAt: new Date()
        };
        
        this.machines.set(machineId, machine);
        line.machines.push(machineId);
        facility.machines.push(machineId);
        
        return machine;
    }

    async updateMachineStatus(machineId, status, metrics = {}) {
        const machine = this.machines.get(machineId);
        if (!machine) {
            throw new Error('Machine not found');
        }
        
        machine.status = status;
        machine.efficiency = metrics.efficiency || machine.efficiency;
        machine.lastUpdate = new Date();
        
        return machine;
    }

    getFacility(facilityId) {
        return this.facilities.get(facilityId);
    }

    getProductionLine(lineId) {
        return this.productionLines.get(lineId);
    }

    getMachine(machineId) {
        return this.machines.get(machineId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.industrialIot = new IndustrialIoT();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IndustrialIoT;
}

