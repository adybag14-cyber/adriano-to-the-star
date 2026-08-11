/**
 * IoT Data Processing
 * IoT data processing and transformation
 */

class IoTDataProcessing {
    constructor() {
        this.processors = new Map();
        this.jobs = new Map();
        this.pipelines = new Map();
        this.init();
    }

    init() {
        this.trackEvent('i_ot_da_ta_pr_oc_es_si_ng_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("i_ot_da_ta_pr_oc_es_si_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createProcessor(processorId, processorData) {
        const processor = {
            id: processorId,
            ...processorData,
            name: processorData.name || processorId,
            type: processorData.type || 'filter',
            config: processorData.config || {},
            createdAt: new Date()
        };
        
        this.processors.set(processorId, processor);
        console.log(`Data processor created: ${processorId}`);
        return processor;
    }

    createPipeline(pipelineId, pipelineData) {
        const pipeline = {
            id: pipelineId,
            ...pipelineData,
            name: pipelineData.name || pipelineId,
            processors: pipelineData.processors || [],
            status: 'inactive',
            createdAt: new Date()
        };
        
        this.pipelines.set(pipelineId, pipeline);
        console.log(`Processing pipeline created: ${pipelineId}`);
        return pipeline;
    }

    async process(pipelineId, data) {
        const pipeline = this.pipelines.get(pipelineId);
        if (!pipeline) {
            throw new Error('Pipeline not found');
        }
        
        const job = {
            id: `job_${Date.now()}`,
            pipelineId,
            input: data,
            output: null,
            status: 'processing',
            startedAt: new Date(),
            createdAt: new Date()
        };
        
        this.jobs.set(job.id, job);
        
        let processedData = data;
        
        for (const processorId of pipeline.processors) {
            const processor = this.processors.get(processorId);
            if (processor) {
                processedData = this.applyProcessor(processor, processedData);
            }
        }
        
        job.status = 'completed';
        job.completedAt = new Date();
        job.output = processedData;
        
        return job;
    }

    applyProcessor(processor, data) {
        if (processor.type === 'filter') {
            return data.filter(item => this.evaluateFilter(processor.config, item));
        } else if (processor.type === 'transform') {
            return data.map(item => this.transformItem(processor.config, item));
        } else if (processor.type === 'aggregate') {
            return this.aggregateData(processor.config, data);
        }
        return data;
    }

    evaluateFilter(config, item) {
        return true;
    }

    transformItem(config, item) {
        return item;
    }

    aggregateData(config, data) {
        return { count: data.length, sum: data.reduce((a, b) => a + (b.value || 0), 0) };
    }

    getPipeline(pipelineId) {
        return this.pipelines.get(pipelineId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.iotDataProcessing = new IoTDataProcessing();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IoTDataProcessing;
}
