/**
 * Milestone Celebrations
 * Celebrates user milestones
 */

class MilestoneCelebrations {
    constructor() {
        this.milestones = new Map();
        this.init();
    }
    
    init() {
        this.setupMilestones();
    }
    
    setupMilestones() {
        // Setup milestones
    }
    
    async checkMilestone(userId, metric, value) {
        const milestones = [100, 500, 1000, 5000, 10000];
        const reached = milestones.filter(m => value >= m && !this.hasReached(userId, metric, m));
        
        if (reached.length > 0) {
            const milestone = reached[reached.length - 1];
            await this.celebrate(userId, metric, milestone);
            return { reached: true, milestone };
        }
        
        return { reached: false };
    }
    
    hasReached(userId, metric, milestone) {
        const key = `${userId}_${metric}_${milestone}`;
        return this.milestones.has(key);
    }
    
    async celebrate(userId, metric, milestone) {
        const key = `${userId}_${metric}_${milestone}`;
        this.milestones.set(key, { celebrated: true, celebratedAt: Date.now() });
        
        if (window.toastNotificationQueue) {
            window.toastNotificationQueue.show(`Milestone reached: ${milestone} ${metric}!`, 'success');
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.milestoneCelebrations = new MilestoneCelebrations(); });
} else {
    window.milestoneCelebrations = new MilestoneCelebrations();
}
