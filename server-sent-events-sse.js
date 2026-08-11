/**
 * Server-Sent Events (SSE)
 * Server-Sent Events implementation
 */

class ServerSentEventsSSE {
    constructor() {
        this.eventSource = null;
        this.listeners = new Map();
        this.init();
    }
    
    init() {
        this.connect();
    }
    
    connect() {
        // Connect to SSE endpoint
        this.eventSource = new EventSource('/api/events');
        
        this.eventSource.onopen = () => {
            console.log('SSE connected');
        };
        
        this.eventSource.onerror = (error) => {
            console.error('SSE error:', error);
        };
        
        this.eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };
    }
    
    on(event, callback) {
        // Register event listener
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
            this.eventSource.addEventListener(event, (e) => {
                const data = JSON.parse(e.data);
                this.handleMessage({ type: event, ...data });
            });
        }
        this.listeners.get(event).push(callback);
    }
    
    handleMessage(data) {
        // Handle incoming message
        if (this.listeners.has(data.type)) {
            this.listeners.get(data.type).forEach(callback => {
                callback(data);
            });
        }
    }
    
    close() {
        // Close SSE connection
        if (this.eventSource) {
            this.eventSource.close();
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.serverSentEventsSSE = new ServerSentEventsSSE(); });
} else {
    window.serverSentEventsSSE = new ServerSentEventsSSE();
}
