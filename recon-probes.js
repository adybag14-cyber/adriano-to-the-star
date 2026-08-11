/**
 * Recon Probe Dispatcher (UPGRADED)
 * Logic for deploying and receiving telemetry from automated scouts.
 */
class ReconProbes {
    constructor() {
        this.activeProbes = new Map();
    }

    launch(targetCoords, type = 'THERMAL') {
        const probe = {
            id: `PRB-${Date.now()}`,
            type,
            pos: { x: 0, y: 0 },
            target: targetCoords,
            telemetryLag: 0,
            status: 'IN_TRANSIT'
        };

        this.activeProbes.set(probe.id, probe);
        return probe;
    }

    /**
     * Resolves sensor data gathering after probe arrival.
     */
    getTelemetry(probeId) {
        const probe = this.activeProbes.get(probeId);
        if (!probe || probe.status !== 'ACTIVE') return null;

        return {
            data: { radiation: 0.05, heatSignatures: 2, objects: ['UNKNOWN_FRIGATE'] },
            timestamp: Date.now()
        };
    }
}
if (typeof module !== 'undefined') module.exports = ReconProbes;