/**
 * Decloak Delay Logic (UPGRADED)
 * Models the tactical vulnerability window when a ship transitions from stealth.
 */
class DecloakLogic {
    /**
     * Calculates the time a ship is visible but unable to fire.
     */
    getDecloakWindow(shipSize, energyReserves) {
        const base = shipSize / 100;
        const powerDrainPenalty = (1 - (energyReserves / 1000)) * 5;
        return (base + powerDrainPenalty) * 1000; // ms
    }
}
if (typeof module !== 'undefined') module.exports = DecloakLogic;