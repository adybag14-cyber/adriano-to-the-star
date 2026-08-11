/**
 * Crew Training Simulator (UPGRADED)
 * In-game system for improving ship personnel proficiency through time-based cycles.
 */
class CrewTraining {
    constructor(fleet) {
        this.fleet = fleet;
        this.activeSimulations = new Map();
    }

    /**
     * Starts a training cycle for a ship's crew.
     */
    startCycle(shipId, programType) {
        const programs = {
            'GUNNERY': { duration: 3600, bonus: 'accuracy' },
            'ENGINEERING': { duration: 7200, bonus: 'repairSpeed' },
            'NAVIGATION': { duration: 1800, bonus: 'evasion' }
        };

        const program = programs[programType];
        const cycle = {
            shipId,
            type: programType,
            endTime: Date.now() + (program.duration * 1000),
            progress: 0
        };

        this.activeSimulations.set(shipId, cycle);
        return cycle;
    }

    updateProgress() {
        const now = Date.now();
        this.activeSimulations.forEach((cycle, shipId) => {
            if (now >= cycle.endTime) {
                this.applyBonus(shipId, cycle.type);
                this.activeSimulations.delete(shipId);
            }
        });
    }

    applyBonus(shipId, type) {
        const ship = this.fleet.ships.get(shipId);
        if (ship) ship.xp += 50; // Proficiency gain
    }
}
if (typeof module !== 'undefined') module.exports = CrewTraining;