/**
 * Jump Disruptor (UPGRADED)
 * High-stakes logic for scrambing a target ship's navigational data-link.
 */
class JumpDisruptor {
    /**
     * Attempts to force a jump drive reboot on target.
     */
    disrupt(targetDrivePrecision, disruptorPower) {
        const failChance = (disruptorPower / targetDrivePrecision) * 0.5;
        const success = Math.random() < failChance;
        
        return {
            success,
            rebootTime: success ? 30 : 0,
            message: success ? 'JUMP_CALC_DATA_SCRAMBLED' : 'DISRUPTION_RESISTED'
        };
    }
}
if (typeof module !== 'undefined') module.exports = JumpDisruptor;