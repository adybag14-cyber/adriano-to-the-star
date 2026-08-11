/**
 * Ballistic Trajectory Calculator (UPGRADED)
 * Vector-based physics solver for unguided kinetic projectiles in void space.
 */
class BallisticCalc {
    /**
     * Solves for the required launch vector to hit a moving target.
     */
    solveTrajectory(origin, target, slugVelocity) {
        // Simple linear intercept: P_target + V_target * t = P_origin + V_slug * t
        const dx = target.pos.x - origin.x;
        const dy = target.pos.y - origin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const timeToHit = dist / (slugVelocity + target.velocity.relativeToOrigin);
        
        return {
            interceptPos: {
                x: target.pos.x + target.velocity.x * timeToHit,
                y: target.pos.y + target.velocity.y * timeToHit
            },
            launchAngle: Math.atan2(dy, dx),
            timeToImpact: timeToHit
        };
    }
}
if (typeof module !== 'undefined') module.exports = BallisticCalc;