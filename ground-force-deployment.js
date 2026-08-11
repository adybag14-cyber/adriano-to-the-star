/**
 * Ground Force Deployment Logic
 * Coordinates the tactical unloading of mechs, tanks, and infantry from dropships.
 */
class GroundForceDeployment {
    constructor() {
        this.combatUnits = [];
    }

    deployUnit(type, landingZone) {
        const unit = {
            id: `UNIT-${type}-${Date.now()}`,
            type,
            status: 'DEPLOYING',
            combatReadiness: 0,
            location: landingZone
        };

        // Simulate deployment time
        setTimeout(() => {
            unit.status = 'ACTIVE';
            unit.combatReadiness = 100;
        }, unit.type === 'MECH' ? 10000 : 2000);

        this.combatUnits.push(unit);
        return unit;
    }

    getInvasionStrength() {
        return this.combatUnits.reduce((acc, u) => acc + (u.status === 'ACTIVE' ? 100 : 0), 0);
    }
}

if (typeof module !== 'undefined') module.exports = GroundForceDeployment;
