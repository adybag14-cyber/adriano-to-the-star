/**
 * Edge Data Processing
 * Edge device data processing
 */

class EdgeDataProcessing {
    constructor() {
        this.processors = new Map();
        this.jobs = new Map();
        this.init();
    }

    init() {
        this.trackEvent('edge_data_proc_initialized');
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
        console.log(`Data processor created: ${processorId}`);
        return processor;
    }

    async processData(processorId, data) {
        const processor = this.processors.get(processorId);
        if (!processor) {
            throw new Error('Processor not found');
        }
        
        const job = {
            id: `job_${Date.now()}`,
            processorId,
            input: data,
            output: null,
            status: 'processing',
            startedAt: new Date(),
            createdAt: new Date()
        };
        
        this.jobs.set(job.id, job);
        
        let processedData = data;
        
        processor.rules.forEach(rule => {
            processedData = this.applyRule(rule, processedData);
        });
        
        job.output = processedData;
        job.status = 'completed';
        job.completedAt = new Date();
        
        return job;
    }

    applyRule(rule, data) {
        if (rule.type === 'filter') {
            return data.filter(item => this.evaluateCondition(rule.condition, item));
        } else if (rule.type === 'transform') {
            return data.map(item => ({ ...item, ...rule.transform }));
        }
        return data;
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

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`edge_data_proc_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.edgeDataProcessing = new EdgeDataProcessing();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EdgeDataProcessing;
}


