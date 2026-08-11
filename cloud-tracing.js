/**
 * Cloud Tracing
 * Distributed tracing for cloud services
 */

class CloudTracing {
    constructor() {
        this.traces = new Map();
        this.spans = new Map();
        this.init();
    }

    init() {
        this.trackEvent('cloud_trace_initialized');
    }

    startTrace(traceId, traceData) {
        const trace = {
            id: traceId,
            ...traceData,
            name: traceData.name || traceId,
            service: traceData.service || '',
            status: 'active',
            spans: [],
            startedAt: new Date(),
            createdAt: new Date()
        };
        
        this.traces.set(traceId, trace);
        console.log(`Trace started: ${traceId}`);
        return trace;
    }

    createSpan(traceId, spanId, spanData) {
        const trace = this.traces.get(traceId);
        if (!trace) {
            throw new Error('Trace not found');
        }
        
        const span = {
            id: spanId,
            traceId,
            ...spanData,
            name: spanData.name || spanId,
            operation: spanData.operation || '',
            parentSpanId: spanData.parentSpanId || null,
            status: 'active',
            startedAt: new Date(),
            createdAt: new Date()
        };
        
        this.spans.set(spanId, span);
        trace.spans.push(spanId);
        
        return span;
    }

    finishSpan(spanId) {
        const span = this.spans.get(spanId);
        if (!span) {
            throw new Error('Span not found');
        }
        
        span.status = 'completed';
        span.completedAt = new Date();
        span.duration = span.completedAt - span.startedAt;
        
        return span;
    }

    finishTrace(traceId) {
        const trace = this.traces.get(traceId);
        if (!trace) {
            throw new Error('Trace not found');
        }
        
        trace.status = 'completed';
        trace.completedAt = new Date();
        trace.duration = trace.completedAt - trace.startedAt;
        
        return trace;
    }

    getTrace(traceId) {
        return this.traces.get(traceId);
    }

    getSpan(spanId) {
        return this.spans.get(spanId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`cloud_trace_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.cloudTracing = new CloudTracing();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CloudTracing;
}

