/**
 * 🛗 EXOPLANET PIONEER: SPACE ELEVATOR LOGISTICS
 * Item 4006: Space Elevator logistics with real-time climber car management.
 */

class SpaceElevatorLogistics {
    constructor() {
        this.climbers = [];
        this.trackLength = 36000; // km (Geostationary)
        this.baseSpeed = 500; // km/h
        console.log("🛗 Space Elevator: Tether anchored. Logistics active.");
    }

    /**
     * Dispatch a cargo climber from surface to orbit.
     */
    dispatchClimber(cargo) {
        const id = `CLIMBER-${Date.now()}`;
        this.climbers.push({
            id,
            position: 0, // km
            destination: this.trackLength,
            cargo,
            status: "ASCENDING"
        });
        console.log(`[LOGISTICS] Climber ${id} dispatched with ${cargo.type}.`);
    }

    /**
     * Update climber positions.
     */
    updatePositions(dt) {
        this.climbers.forEach(c => {
            const direction = c.destination > c.position ? 1 : -1;
            c.position += direction * this.baseSpeed * (dt / 3600); // per hour
            
            if (Math.abs(c.destination - c.position) < 10) {
                c.position = c.destination;
                this._onArrived(c);
            }
        });
        
        // Remove arrived climbers
        this.climbers = this.climbers.filter(c => c.status !== "ARRIVED");
    }

    _onArrived(climber) {
        console.log(`✨ [LOGISTICS] Climber ${climber.id} arrived at destination.`);
        climber.status = "ARRIVED";
        this.fireEvent("CARGO_DELIVERED", climber.cargo);
    }

    fireEvent(type, data) {
        window.dispatchEvent(new CustomEvent(type, { detail: data }));
    }
}

export const elevatorLogistics = new SpaceElevatorLogistics();
window.elevatorLogistics = elevatorLogistics;
