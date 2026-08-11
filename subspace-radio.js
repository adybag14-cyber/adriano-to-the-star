/**
 * Sub-Space Radio Core (UPGRADED)
 * Foundational FTL communication logic with signal degradation and packet loss.
 */
class SubspaceRadio {
    constructor() {
        this.frequency = 1240.5; // MHz
        this.packetLossBase = 0.02;
    }

    sendData(payload, distanceLY) {
        const loss = this.packetLossBase * distanceLY;
        return {
            delivered: Math.random() > loss,
            latencySec: distanceLY * 0.1, // 10% speed of light overhead
            lossRating: loss
        };
    }
}
if (typeof module !== 'undefined') module.exports = SubspaceRadio;