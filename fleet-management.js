/**
 * Fleet Management
 * Fleet tracking and management system
 */

class FleetManagement {
    constructor() {
        this.fleets = new Map();
        this.vehicles = new Map();
        this.trips = new Map();
        this.init();
    }

    init() {
        this.trackEvent('f_le_et_ma_na_ge_me_nt_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("f_le_et_ma_na_ge_me_nt_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createFleet(fleetId, fleetData) {
        const fleet = {
            id: fleetId,
            ...fleetData,
            name: fleetData.name || fleetId,
            vehicles: [],
            createdAt: new Date()
        };
        
        this.fleets.set(fleetId, fleet);
        console.log(`Fleet created: ${fleetId}`);
        return fleet;
    }

    registerVehicle(fleetId, vehicleId, vehicleData) {
        const fleet = this.fleets.get(fleetId);
        if (!fleet) {
            throw new Error('Fleet not found');
        }
        
        const vehicle = {
            id: vehicleId,
            fleetId,
            ...vehicleData,
            name: vehicleData.name || vehicleId,
            make: vehicleData.make || '',
            model: vehicleData.model || '',
            licensePlate: vehicleData.licensePlate || '',
            status: 'available',
            currentLocation: null,
            createdAt: new Date()
        };
        
        this.vehicles.set(vehicleId, vehicle);
        fleet.vehicles.push(vehicleId);
        
        return vehicle;
    }

    async startTrip(vehicleId, tripData) {
        const vehicle = this.vehicles.get(vehicleId);
        if (!vehicle) {
            throw new Error('Vehicle not found');
        }
        
        if (vehicle.status !== 'available') {
            throw new Error('Vehicle is not available');
        }
        
        const trip = {
            id: `trip_${Date.now()}`,
            vehicleId,
            ...tripData,
            origin: tripData.origin || '',
            destination: tripData.destination || '',
            status: 'in_progress',
            startedAt: new Date(),
            createdAt: new Date()
        };
        
        this.trips.set(trip.id, trip);
        
        vehicle.status = 'in_use';
        
        return trip;
    }

    async endTrip(tripId, endLocation) {
        const trip = this.trips.get(tripId);
        if (!trip) {
            throw new Error('Trip not found');
        }
        
        const vehicle = this.vehicles.get(trip.vehicleId);
        if (vehicle) {
            vehicle.status = 'available';
            vehicle.currentLocation = endLocation;
        }
        
        trip.status = 'completed';
        trip.endedAt = new Date();
        trip.endLocation = endLocation;
        
        return trip;
    }

    getFleet(fleetId) {
        return this.fleets.get(fleetId);
    }

    getVehicle(vehicleId) {
        return this.vehicles.get(vehicleId);
    }

    getTrip(tripId) {
        return this.trips.get(tripId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.fleetManagement = new FleetManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FleetManagement;
}

