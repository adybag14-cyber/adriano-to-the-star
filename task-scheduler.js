/**
 * Task Scheduler
 * @class TaskScheduler
 * @description Schedules and executes tasks at specified times or intervals.
 */
class TaskScheduler {
    constructor() {
        this.tasks = new Map();
        this.schedules = new Map();
        this.init();
    }

    init() {
        this.trackEvent('t_as_ks_ch_ed_ul_er_initialized');
        this.startScheduler();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("t_as_ks_ch_ed_ul_er_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Schedule task.
     * @param {string} taskId - Task identifier.
     * @param {object} taskData - Task data.
     */
    scheduleTask(taskId, taskData) {
        this.tasks.set(taskId, {
            ...taskData,
            id: taskId,
            name: taskData.name,
            handler: taskData.handler,
            schedule: taskData.schedule,
            nextRun: this.calculateNextRun(taskData.schedule),
            status: 'scheduled',
            createdAt: new Date()
        });
        console.log(`Task scheduled: ${taskId}`);
    }

    /**
     * Calculate next run time.
     * @param {object} schedule - Schedule configuration.
     * @returns {Date} Next run time.
     */
    calculateNextRun(schedule) {
        if (schedule.type === 'once') {
            return new Date(schedule.datetime);
        } else if (schedule.type === 'interval') {
            return new Date(Date.now() + schedule.interval);
        } else if (schedule.type === 'cron') {
            // Placeholder for cron parsing
            return new Date(Date.now() + 60000); // 1 minute default
        }
        return new Date();
    }

    /**
     * Start scheduler.
     */
    startScheduler() {
        setInterval(() => {
            this.checkAndExecuteTasks();
        }, 1000); // Check every second
    }

    /**
     * Check and execute tasks.
     */
    checkAndExecuteTasks() {
        const now = new Date();
        for (const task of this.tasks.values()) {
            if (task.status === 'scheduled' && task.nextRun <= now) {
                this.executeTask(task.id);
            }
        }
    }

    /**
     * Execute task.
     * @param {string} taskId - Task identifier.
     */
    async executeTask(taskId) {
        const task = this.tasks.get(taskId);
        if (!task) return;

        task.status = 'running';
        task.lastRun = new Date();

        try {
            await task.handler();
            task.status = 'scheduled';
            task.nextRun = this.calculateNextRun(task.schedule);
            console.log(`Task executed: ${taskId}`);
        } catch (error) {
            task.status = 'failed';
            task.error = error.message;
            console.error(`Task failed: ${taskId}`, error);
        }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.taskScheduler = new TaskScheduler();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaskScheduler;
}

