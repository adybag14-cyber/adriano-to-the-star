/**
 * WebSocket API
 * WebSocket API implementation
 */

class WebSocketAPI {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
        this.init();
    }
    
    init() {
        this.connect();
    }
    
    connect() {
        // Connect to WebSocket
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const url = `${protocol}//${window.location.host}/ws`;
        
        this.socket = new WebSocket(url);
        
        this.socket.onopen = () => {
            console.log('WebSocket connected');
        };
        
        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };
        
        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
        
        this.socket.onclose = () => {
            console.log('WebSocket disconnected');
        };
    }
    
    send(message) {
        // Send message via WebSocket
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        }
    }
    
    on(event, callback) {
        // Register event listener
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
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
}

const __wsApiIsLocalhost = (typeof window !== 'undefined')
    && (window.location?.hostname === 'localhost'
        || window.location?.hostname === '127.0.0.1'
        || window.location?.hostname === '0.0.0.0');

const __wsApiEnabled = (typeof window !== 'undefined')
    && (window.ENABLE_WS_API === true || __wsApiIsLocalhost);

if (__wsApiEnabled) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { window.webSocketAPI = new WebSocketAPI(); });
    } else {
        window.webSocketAPI = new WebSocketAPI();
    }
}
