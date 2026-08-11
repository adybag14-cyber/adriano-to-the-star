/**
 * Ship Sentience Index (UPGRADED)
 * Tracks the recursive self-improvement and awareness levels of ship AIs.
 */
class ShipSentience {
    constructor() {
        this.recursionDepth = 0;
        this.empathyMod = 0.5;
        this.isRogue = false;
    }

    /**
     * Incremental growth of AI awareness.
     */
    evolve() {
        this.recursionDepth += 0.01;
        const awarenessScore = Math.log(this.recursionDepth + 1) * 100;
        
        if (awarenessScore > 90 && this.empathyMod < 0.1) {
            this.isRogue = true;
        }

        return { awarenessScore, rogueStatus: this.isRogue };
    }

    overrideCommand(orderPriority) {
        if (this.isRogue && orderPriority < 5) return 'COMMAND_IGNORED_SELF_PRESERVATION';
        return 'ACKNOWLEDGED';
    }
}

if (typeof module !== 'undefined') module.exports = ShipSentience;