class AutomatedReportingSystem {
    constructor() {
        this.jobs = new Map();
    }
    schedule(name, cronLikeMs, handler) {
        if (typeof handler !== 'function') return null;
        const id = name || `job_${Date.now()}`;
        const job = { id, interval: cronLikeMs, handler, lastRun: null };
        if (job.interval > 0) {
            job.timer = setInterval(async () => {
                job.lastRun = new Date();
                try { 
                    await Promise.resolve(handler()); 
                    this.trackEvent('report_job_success', { jobId: id });
                } catch (err) {
                    this.trackEvent('report_job_failed', { jobId: id, error: err.message });
                }
            }, job.interval);
        }
        this.jobs.set(id, job);
        this.trackEvent('report_job_scheduled', { jobId: id, interval: cronLikeMs });
        return job;
    }
    cancel(name) {
        const job = this.jobs.get(name);
        if (job?.timer) clearInterval(job.timer);
        const result = this.jobs.delete(name);
        if (result) this.trackEvent('report_job_cancelled', { jobId: name });
        return result;
    }
    list() {
        return Array.from(this.jobs.values()).map(j => ({ id: j.id, interval: j.interval, lastRun: j.lastRun }));
    }

    trackEvent(eventName, data = {}) {
        if (typeof window !== 'undefined' && window.performanceMonitoring && typeof window.performanceMonitoring.recordMetric === 'function') {
            try {
                window.performanceMonitoring.recordMetric(`reporting:${eventName}`, 1, {
                    source: 'automated-reporting-system',
                    ...data
                });
            } catch (e) {
                // Ignore
            }
        }
    }
}
const automatedReportingSystem = new AutomatedReportingSystem();
if (typeof window !== 'undefined') {
    window.automatedReportingSystem = automatedReportingSystem;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutomatedReportingSystem;
}
