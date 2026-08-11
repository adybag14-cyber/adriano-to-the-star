/**
 * Fighter Auto-Repair Bay (UPGRADED)
 * Robotic throughput management for squadron maintenance and rearming.
 */
class FighterRepairBay {
    constructor() {
        this.naniteReserve = 5000; // Liters
        this.slots = 4;
        this.repairing = [];
    }

    addForRepair(craft) {
        if (this.repairing.length >= this.slots) return false;
        
        const repairJob = {
            id: craft.id,
            damage: 100 - craft.integrity,
            startTime: Date.now()
        };
        
        this.repairing.push(repairJob);
        return true;
    }

    /**
     * Processes repair ticks based on nanite flow.
     */
    processRepairs(deltaTime) {
        this.repairing.forEach((job, index) => {
            const repairRate = 5; // 5% per tick
            const cost = repairRate * 10;
            
            if (this.naniteReserve >= cost) {
                job.damage -= repairRate;
                this.naniteReserve -= cost;
            }

            if (job.damage <= 0) {
                this.repairing.splice(index, 1);
            }
        });
    }
}

if (typeof module !== 'undefined') module.exports = FighterRepairBay;