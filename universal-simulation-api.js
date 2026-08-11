/**
 * 🌐 EXOPLANET PIONEER: UNIVERSAL SIMULATION API
 * Item 7004: Public Interface for Third-Party "Omniverse Apps".
 * 
 * Allows external scripts or "simulated apps" within the game to 
 * query the state of the reality they inhabit.
 */

class UniversalSimulationAPI {
    constructor() {
        this.version = "1.0.0-OMEGA";
        this.registeredApps = new Set();
        console.log(`🌐 Universal Simulation API ${this.version} exported to Global Namespace.`);
    }

    /**
     * Get the current physical constants of the simulation.
     */
    getConstants() {
        return window.omegaEngine?.constants || {
            GRAVITY: 9.81,
            LIGHT_SPEED: 299792458
        };
    }

    /**
     * Get the current "Universal Intent" from the Galactic Oversoul.
     */
    getOversoulState() {
        return window.galacticOversoul?.getIntentSummary() || { status: "STABLE" };
    }

    /**
     * Query planetary data from the starmap.
     */
    getPlanetaryAtlas() {
        return window.game?.planets || [];
    }

    /**
     * Send a "Mesh Event" to the P2P network.
     */
    broadcastEvent(type, payload) {
        if (window.meshEngine) {
            window.meshEngine.updateState(`APP_EVENT_${type}`, payload);
            return true;
        }
        return false;
    }

    /**
     * Register a simulated application.
     */
    registerApp(appName) {
        this.registeredApps.add(appName);
        console.log(`[API] App registered: ${appName}`);
        return {
            api: this,
            deregister: () => this.registeredApps.delete(appName)
        };
    }
}

export const universalAPI = new UniversalSimulationAPI();
window.EP_API = universalAPI;
