/**
 * Telemetry Processing
 * Telemetry data processing and transformation
 */

class TelemetryProcessing {
    constructor() {
        this.processors = new Map();
        this.jobs = new Map();
        this.init();
    }

    init() {
        this.trackEvent('t_el_em_et_ry_pr_oc_es_si_ng_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("t_el_em_et_ry_pr_oc_es_si_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createProcessor(processorId, processorData) {
        const processor = {
            id: processorId,
            ...processorData,
            name: processorData.name || processorId,
            type: processorData.type || 'stream',
            rules: processorData.rules || [],
            enabled: processorData.enabled !== false,
            createdAt: new Date()
        };
        
        this.processors.set(processorId, processor);
        console.log(`Telemetry processor created: ${processorId}`);
        return processor;
    }

    async process(processorId, telemetryData) {
        const processor = this.processors.get(processorId);
        if (!processor) {
            throw new Error('Processor not found');
        }
        
        const job = {
            id: `job_${Date.now()}`,
            processorId,
            input: telemetryData,
            output: null,
            status: 'processing',
            startedAt: new Date(),
            createdAt: new Date()
        };
        
        this.jobs.set(job.id, job);
        
        let processed = telemetryData;
        
        processor.rules.forEach(rule => {
            processed = this.applyRule(rule, processed);
        });
        
        job.output = processed;
        job.status = 'completed';
        job.completedAt = new Date();
        
        return job;
    }

    applyRule(rule, data) {
        if (rule.type === 'filter') {
            return this.filterData(rule, data);
        } else if (rule.type === 'transform') {
            return this.transformData(rule, data);
        } else if (rule.type === 'aggregate') {
            return this.aggregateData(rule, data);
        }
        return data;
    }

    filterData(rule, data) {
        if (Array.isArray(data)) {
            return data.filter(item => this.evaluateCondition(rule.condition, item));
        }
        return this.evaluateCondition(rule.condition, data) ? data : null;
    }

    transformData(rule, data) {
        if (Array.isArray(data)) {
            return data.map(item => ({ ...item, ...rule.transform }));
        }
        return { ...data, ...rule.transform };
    }

    aggregateData(rule, data) {
        if (!Array.isArray(data) || data.length === 0) {
            return { count: 0, avg: 0 };
        }
        
        const values = data.map(d => d.value || 0);
        return {
            count: values.length,
            avg: values.reduce((sum, v) => sum + v, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values)
        };
    }

    evaluateCondition(condition, item) {
        if (!condition) return true;
        return item[condition.field] === condition.value;
    }

    getProcessor(processorId) {
        return this.processors.get(processorId);
    }

    getJob(jobId) {
        return this.jobs.get(jobId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.telemetryProcessing = new TelemetryProcessing();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TelemetryProcessing;
}

