/**
 * Flight Recorder (Black Box) (UPGRADED)
 * Hardened telemetry storage for recovering data after ship destruction.
 */
class FlightRecorder {
    constructor() {
        this.buffer = [];
        this.isHardened = true;
    }

    recordTick(telemetry) {
        this.buffer.push({ ...telemetry, t: Date.now() });
        if (this.buffer.length > 1000) this.buffer.shift();
    }

    recoverData(hullIntegrity) {
        if (hullIntegrity > 0) return this.buffer;
        return Math.random() > 0.1 ? this.buffer : 'DATA_CORRUPTED';
    }
}
if (typeof module !== 'undefined') module.exports = FlightRecorder;