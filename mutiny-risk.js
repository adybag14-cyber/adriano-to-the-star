/**
 * Crew Mutiny Risk Model (UPGRADED)
 * Predicts and triggers crew rebellions based on complex morale and supply variables.
 */
class MutinyRisk {
    calculateRisk(morale, foodSupply, medicalSupplies, pay) {
        const moraleFactor = (100 - morale) * 0.5;
        const supplyFactor = (1 - (foodSupply + medicalSupplies) / 200) * 30;
        const payFactor = pay < 100 ? 20 : 0;

        const totalRisk = moraleFactor + supplyFactor + payFactor;
        return {
            percentage: Math.min(100, totalRisk),
            isCritical: totalRisk > 80,
            status: totalRisk > 50 ? 'UNREST' : 'LOYAL'
        };
    }
}
if (typeof module !== 'undefined') module.exports = MutinyRisk;