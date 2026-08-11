/**
 * Emergency Escape Pod Logic (UPGRADED)
 * Models crew survival probability, launch window constraints, and recovery coordinates.
 */
class EscapePodLogic {
    constructor() {
        this.pods = [];
    }

    /**
     * Initiates emergency ejection.
     */
    launchPods(shipPos, crewCount, hullStability) {
        const podsNeeded = Math.ceil(crewCount / 4);
        const failChance = (1 - hullStability); // Stability < 1 increases fail risk

        const results = [];
        for (let i = 0; i < podsNeeded; i++) {
            if (Math.random() > failChance) {
                results.push({
                    id: `POD-${Date.now()}-${i}`,
                    coords: { x: shipPos.x + (Math.random() - 0.5) * 10, y: shipPos.y + (Math.random() - 0.5) * 10 },
                    status: 'IN_VOID',
                    oxygen: 48 // Hours
                });
            }
        }
        this.pods.push(...results);
        return results;
    }

    getRecoveryWindow(pod) {
        return pod.oxygen;
    }
}
if (typeof module !== 'undefined') module.exports = EscapePodLogic;