/**
 * Starship Medical Bay (UPGRADED)
 * Advanced healing logic for casualties, managing bio-regenerators and surgery suites.
 */
class ShipMedbay {
    constructor() {
        this.beds = 10;
        this.bioGelLevel = 1000; // Liters
        this.activePatients = [];
    }

    admitPatient(casualty) {
        if (this.activePatients.length >= this.beds) return false;
        
        const treatment = {
            id: casualty.id,
            severity: casualty.severity, // 0.0 to 1.0
            progress: 0,
            startTime: Date.now()
        };
        
        this.activePatients.push(treatment);
        return true;
    }

    processHealing(deltaTime) {
        this.activePatients.forEach((p, idx) => {
            const healingRate = 0.05 / p.severity;
            const cost = healingRate * 10;
            
            if (this.bioGelLevel >= cost) {
                p.progress += healingRate * deltaTime;
                this.bioGelLevel -= cost;
            }

            if (p.progress >= 1.0) {
                this.activePatients.splice(idx, 1);
            }
        });
    }
}
if (typeof module !== 'undefined') module.exports = ShipMedbay;