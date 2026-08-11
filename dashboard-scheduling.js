/**
 * Dashboard Scheduling
 * Schedules dashboard generation and delivery
 */

class DashboardScheduling {
    constructor() {
        this.schedules = [];
        this.init();
    }

    init() {
        this.trackEvent('dashboard_scheduling_initialized');
    }

    scheduleDashboard(dashboardId, schedule) {
        const scheduled = {
            id: `schedule_${Date.now()}`,
            dashboardId,
            schedule: {
                frequency: schedule.frequency, // daily, weekly, monthly
                time: schedule.time,
                recipients: schedule.recipients || []
            },
            nextRun: this.calculateNextRun(schedule),
            enabled: true,
            createdAt: new Date()
        };
        
        this.schedules.push(scheduled);
        return scheduled;
    }

    calculateNextRun(schedule) {
        const now = new Date();
        const nextRun = new Date(now);
        
        switch (schedule.frequency) {
            case 'daily':
                nextRun.setDate(nextRun.getDate() + 1);
                break;
            case 'weekly':
                nextRun.setDate(nextRun.getDate() + 7);
                break;
            case 'monthly':
                nextRun.setMonth(nextRun.getMonth() + 1);
                break;
        }
        
        if (schedule.time) {
            const [hours, minutes] = schedule.time.split(':');
            nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        }
        
        return nextRun;
    }

    getScheduledDashboards() {
        const now = new Date();
        return this.schedules.filter(s => 
            s.enabled && s.nextRun <= now
        );
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`dashboard_scheduling_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize
const dashboardScheduling = new DashboardScheduling();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardScheduling;
}


