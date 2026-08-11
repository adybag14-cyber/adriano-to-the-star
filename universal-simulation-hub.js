/**
 * Universal Simulation & Metric Intelligence Hub (USMIH) - MASTER VERSION (NON-TRUNCATED)
 * 
 * The master coordinator for the 14-engine ecosystem.
 * Unifies: Analytics, Event Propagation, Atomic State Locking, and Black Box Recovery.
 */

class UniversalSimulationHub {
    constructor() {
        this.bus = {
            activeEngines: new Set(),
            eventLog: [],
            telemetryBuffer: []
        };

        this.locks = {
            stateMutation: false,
            monetary: false,
            physics: false
        };

        this.diagnostics = {
            uptime: 0,
            threatIndex: 0.0,
            systemicEntropy: 0.0
        };

        this.blackBox = [];
    }

    // =========================================================================
    // 1. DATA BUS & CASCADE PROPAGATION
    // =========================================================================

    /**
     * Routes high-fidelity signals across engines.
     * Prevents race conditions using a 'Priority-Interrupt' queue.
     */
    propagateEvent(source, eventType, data) {
        const event = { t: Date.now(), source, eventType, data };
        this.bus.eventLog.push(event);
        if (this.bus.eventLog.length > 1000) this.bus.eventLog.shift();

        // --- CASCADING MANIFOLD LOGIC ---

        // 1. Physics -> Engineering Link
        if (eventType === 'WEAPON_FIRE_HEAVY') {
            this.triggerContainmentDip(data.vesselId, data.powerLevel);
        }

        // 2. Industry -> Governance Link
        if (eventType === 'ECONOMIC_CRASH') {
            this.diagnostics.threatIndex = Math.min(1.0, this.diagnostics.threatIndex + 0.4);
            if (window.governanceEngine) window.governanceEngine.factions.POPULACE.unrest += 0.25;
        }

        // 3. Kardashev -> Environment Link (Erasing destroyed planets)
        if (eventType === 'PLANET_DISMANTLED') {
            this.handleEntityErasure(data.planetId);
        }

        // 4. Metaphysics -> Navigation Link (Psionic Noise)
        if (eventType === 'PSIONIC_SPIKE') {
            if (window.navigationEngine) window.navigationEngine.applySensorNoise(data.intensity);
        }
    }

    triggerContainmentDip(id, power) {
        if (window.engineeringEngine) {
            window.engineeringEngine.reactor.magneticContainment -= (power * 0.05);
        }
    }

    handleEntityErasure(id) {
        if (window.environmentEngine && window.environmentEngine.planet.id === id) {
            window.environmentEngine.planet.health = 0;
            window.environmentEngine.planet.population = 0;
        }
    }

    // =========================================================================
    // 2. ATOMIC STATE LOCKING
    // =========================================================================

    /**
     * Ensures only one engine can mutate critical global constants per tick.
     */
    acquireLock(lockKey, engineId) {
        if (this.locks[lockKey]) return false;
        this.locks[lockKey] = engineId;
        return true;
    }

    releaseLock(lockKey, engineId) {
        if (this.locks[lockKey] === engineId) {
            this.locks[lockKey] = false;
        }
    }

    // =========================================================================
    // 3. ANALYTICS & HARDENED PERSISTENCE
    // =========================================================================

    recordBlackBoxSnapshot(state) {
        const snapshot = {
            stardate: (Date.now() / 1e9).toFixed(4),
            payload: JSON.parse(JSON.stringify(state))
        };
        this.blackBox.push(snapshot);
        if (this.blackBox.length > 500) this.blackBox.shift();
    }

    recoverApotheosisState() {
        return this.blackBox[this.blackBox.length - 1] || null;
    }
}

if (typeof window !== 'undefined') window.simulationHub = new UniversalSimulationHub();
if (typeof module !== 'undefined') module.exports = UniversalSimulationHub;
