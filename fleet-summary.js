/**
 * Fleet Logistics Summary (UPGRADED)
 * Strategic reporting on resource coverage, fuel endurance, and readiness.
 */
class FleetSummary {
    generate(ships) {
        const totalFuel = ships.reduce((a, b) => a + b.fuel, 0);
        const avgIntegrity = ships.reduce((a, b) => a + b.integrity, 0) / ships.length;
        
        return {
            readiness: avgIntegrity > 80 ? 'READY' : 'DEGRADED',
            estimatedRangeLY: totalFuel / 1000,
            vessels: ships.length
        };
    }
}
if (typeof module !== 'undefined') module.exports = FleetSummary;