/**
 * API Request Tracing
 * Distributed tracing for API requests
 */

class APIRequestTracing {
    constructor() {
        this.traces = new Map();
        this.spans = new Map();
        this.init();
    }

    init() {
        this.trackEvent('tracing_initialized');
    }

    startTrace(traceId, operation, metadata = {}) {
        const trace = {
            id: traceId,
            operation,
            startTime: Date.now(),
            spans: [],
            metadata,
            status: 'active'
        };
        
        this.traces.set(traceId, trace);
        console.log(`Trace started: ${traceId}`);
        return trace;
    }

    startSpan(traceId, spanId, operation, parentSpanId = null) {
        const trace = this.traces.get(traceId);
        if (!trace) {
            throw new Error('Trace does not exist');
        }
        
        const span = {
            id: spanId,
            traceId,
            parentSpanId,
            operation,
            startTime: Date.now(),
            endTime: null,
            duration: null,
            tags: {},
            logs: [],
            status: 'active'
        };
        
        this.spans.set(spanId, span);
        trace.spans.push(spanId);
        
        console.log(`Span started: ${spanId}`);
        return span;
    }

    endSpan(spanId, status = 'success') {
        const span = this.spans.get(spanId);
        if (!span) {
            throw new Error('Span does not exist');
        }
        
        span.endTime = Date.now();
        span.duration = span.endTime - span.startTime;
        span.status = status;
        
        console.log(`Span ended: ${spanId}, duration: ${span.duration}ms`);
        return span;
    }

    addSpanTag(spanId, key, value) {
        const span = this.spans.get(spanId);
        if (!span) {
            throw new Error('Span does not exist');
        }
        
        span.tags[key] = value;
    }

    addSpanLog(spanId, message, data = {}) {
        const span = this.spans.get(spanId);
        if (!span) {
            throw new Error('Span does not exist');
        }
        
        span.logs.push({
            message,
            data,
            timestamp: Date.now()
        });
    }

    endTrace(traceId, status = 'success') {
        const trace = this.traces.get(traceId);
        if (!trace) {
            throw new Error('Trace does not exist');
        }
        
        trace.endTime = Date.now();
        trace.duration = trace.endTime - trace.startTime;
        trace.status = status;
        
        console.log(`Trace ended: ${traceId}, duration: ${trace.duration}ms`);
        return trace;
    }

    getTrace(traceId) {
        const trace = this.traces.get(traceId);
        if (!trace) {
            return null;
        }
        
        const spans = trace.spans.map(spanId => this.spans.get(spanId));
        return {
            ...trace,
            spans
        };
    }

    getAllTraces() {
        return Array.from(this.traces.values());
    }

    getSpan(spanId) {
        return this.spans.get(spanId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`tracing_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiRequestTracing = new APIRequestTracing();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIRequestTracing;
}

