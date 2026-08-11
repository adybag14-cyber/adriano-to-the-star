/**
 * Tactical Point Defense (UPGRADED)
 * Multi-threaded interception logic for incoming kinetic and missile threats.
 */
class PointDefense {
    constructor(turretCount = 8) {
        this.turrets = Array(turretCount).fill(null).map((_, i) => ({
            id: i,
            status: 'READY',
            ammo: 5000,
            heat: 0,
            target: null
        }));
        this.interceptionLog = [];
    }

    /**
     * Resolves interception for a volley of incoming threats.
     */
    interceptVolley(incomingThreats) {
        const results = [];
        
        incomingThreats.forEach(threat => {
            const activeTurret = this.turrets.find(t => t.status === 'READY' && t.heat < 80);
            
            if (activeTurret) {
                const hit = this.calculateHitProbability(threat, activeTurret);
                activeTurret.ammo -= 50;
                activeTurret.heat += 5;
                
                if (hit) {
                    results.push({ threatId: threat.id, status: 'DESTROYED' });
                } else {
                    results.push({ threatId: threat.id, status: 'MISSED' });
                }
            } else {
                results.push({ threatId: threat.id, status: 'NO_TURRETS_AVAILABLE' });
            }
        });

        this.coolTurrets();
        return results;
    }

    calculateHitProbability(threat, turret) {
        // Base 85% chance, reduced by threat velocity and distance
        const base = 0.85;
        const velocityPenalty = (threat.velocity / 10000) * 0.2;
        const heatPenalty = (turret.heat / 100) * 0.1;
        return Math.random() < (base - velocityPenalty - heatPenalty);
    }

    coolTurrets() {
        this.turrets.forEach(t => t.heat = Math.max(0, t.heat - 2));
    }
}

if (typeof module !== 'undefined') module.exports = PointDefense;