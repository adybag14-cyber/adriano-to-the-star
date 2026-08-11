/**
 * Squad Deployment Logic (UPGRADED)
 * Manages the tactical grouping, role assignment, and fuel allocation for squadrons.
 */
class SquadDeployment {
    constructor() {
        this.squadrons = new Map();
    }

    /**
     * Forms a tactical unit for a mission.
     */
    formSquadron(name, craftIds, role = 'STRIKE') {
        const squadron = {
            name,
            members: craftIds,
            role,
            cohesion: 1.0,
            status: 'STANDBY',
            target: null
        };

        if (role === 'ESCORT') squadron.cohesion = 1.2;
        
        this.squadrons.set(name, squadron);
        return squadron;
    }

    getCombatReadiness(name) {
        const squad = this.squadrons.get(name);
        if (!squad) return 0;
        return squad.members.length * squad.cohesion;
    }
}

if (typeof module !== 'undefined') module.exports = SquadDeployment;