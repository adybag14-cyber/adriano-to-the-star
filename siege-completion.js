/**
 * Siege Completion Logic
 * Final resolution handler for planetary surrender or conquest.
 */
class SiegeCompletion {
    checkSurrenderCondition(planet) {
        const moraleThreshold = 15;
        const destructionThreshold = 80; // %

        if (planet.morale < moraleThreshold) return 'SURRENDER_DUE_TO_MORALE';
        if (planet.structuralIntegrity < (100 - destructionThreshold)) return 'SURRENDER_DUE_TO_DESTRUCTION';
        
        return 'RESISTANCE_CONTINUES';
    }

    resolveConquest(planet, conqueror) {
        planet.owner = conqueror.id;
        planet.unrest = 100; // High unrest after conquest
        return { status: 'CONQUERED', date: new Date() };
    }
}

if (typeof module !== 'undefined') module.exports = SiegeCompletion;
