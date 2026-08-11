/**
 * Loyalty Reinforcement Program (UPGRADED)
 * Strategic social engineering for maintaining starship and faction discipline.
 */
class LoyaltyProgram {
    applyPropaganda(crewCount, effectiveness) {
        return {
            loyaltyGain: crewCount * effectiveness * 0.01,
            moraleCost: crewCount * 0.05 // Propaganda can cause stress
        };
    }

    issueBonus(credits) {
        return { loyaltyGain: credits / 1000 };
    }
}
if (typeof module !== 'undefined') module.exports = LoyaltyProgram;
