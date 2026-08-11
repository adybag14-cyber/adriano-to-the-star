/**
 * WebSocket Reconnection System with Message Queue
 * 
 * Implements WebSocket reconnection logic with queue for missed messages.
 * 
 * @module WebSocketReconnectionSystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class WebSocketReconnectionSystem {
    constructor(url, protocols = []) {
        this.url = url;
        this.protocols = protocols;
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = Infinity;
        this.reconnectDelay = 1000;
        this.maxReconnectDelay = 30000;
        this.reconnectBackoffMultiplier = 2;
        this.messageQueue = [];
        this.isManualClose = false;
        this.listeners = new Map();
        this.reconnectTimer = null;
        this.heartbeatInterval = null;
        this.heartbeatTimeout = 30000;
        this.pendingPing = null;
    }

    /**
     * Connect to WebSocket
     * @public
     */
    connect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.warn('WebSocket already connected');
            return;
        }

        try {
            this.ws = new WebSocket(this.url, this.protocols);
            this.setupEventHandlers();
        } catch (error) {
            console.error('WebSocket connection error:', error);
            this.scheduleReconnect();
        }
    }

    /**
     * Set up event handlers
     * @private
     */
    setupEventHandlers() {
        this.ws.onopen = (event) => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;
            this.isManualClose = false;
            this.startHeartbeat();
            this.flushMessageQueue();
            this.emit('open', event);
        };

        this.ws.onmessage = (event) => {
            // Handle heartbeat pong
            if (event.data === 'pong') {
                if (this.pendingPing) {
                    clearTimeout(this.pendingPing);
                    this.pendingPing = null;
                }
                return;
            }

            this.emit('message', event);
        };

        this.ws.onerror = (event) => {
            console.error('WebSocket error:', event);
            this.emit('error', event);
        };

        this.ws.onclose = (event) => {
            console.log('WebSocket closed:', event.code, event.reason);
            this.stopHeartbeat();
            this.emit('close', event);

            if (!this.isManualClose) {
                this.scheduleReconnect();
            }
        };
    }

    /**
     * Schedule reconnection
     * @private
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            this.emit('maxReconnectAttemptsReached');
            return;
        }

        const delay = Math.min(
            this.reconnectDelay * Math.pow(this.reconnectBackoffMultiplier, this.reconnectAttempts),
            this.maxReconnectDelay
        );

        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

        this.reconnectTimer = setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
        }, delay);
    }

    /**
     * Start heartbeat
     * @private
     */
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send('ping');
                
                // Set timeout for pong response
                this.pendingPing = setTimeout(() => {
                    console.warn('Heartbeat timeout, reconnecting...');
                    this.ws.close();
                }, this.heartbeatTimeout);
            }
        }, this.heartbeatTimeout);
    }

    /**
     * Stop heartbeat
     * @private
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        if (this.pendingPing) {
            clearTimeout(this.pendingPing);
            this.pendingPing = null;
        }
    }

    /**
     * Send message
     * @public
     * @param {*} data - Data to send
     */
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
                const message = typeof data === 'string' ? data : JSON.stringify(data);
                this.ws.send(message);
            } catch (error) {
                console.error('Error sending message:', error);
                this.queueMessage(data);
            }
        } else {
            this.queueMessage(data);
        }
    }

    /**
     * Queue message for later sending
     * @private
     * @param {*} data - Data to queue
     */
    queueMessage(data) {
        this.messageQueue.push({
            data,
            timestamp: Date.now()
        });
        console.log('Message queued, queue size:', this.messageQueue.length);
    }

    /**
     * Flush message queue
     * @private
     */
    flushMessageQueue() {
        if (this.messageQueue.length === 0) {
            return;
        }

        console.log(`Flushing ${this.messageQueue.length} queued messages`);

        while (this.messageQueue.length > 0) {
            const queuedMessage = this.messageQueue.shift();
            try {
                const message = typeof queuedMessage.data === 'string' 
                    ? queuedMessage.data 
                    : JSON.stringify(queuedMessage.data);
                this.ws.send(message);
            } catch (error) {
                console.error('Error flushing queued message:', error);
                // Re-queue if send fails
                this.messageQueue.unshift(queuedMessage);
                break;
            }
        }
    }

    /**
     * Add event listener
     * @public
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * Remove event listener
     * @public
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    off(event, callback) {
        if (!this.listeners.has(event)) {
            return;
        }
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    /**
     * Emit event
     * @private
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        if (!this.listeners.has(event)) {
            return;
        }
        this.listeners.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event listener for '${event}':`, error);
            }
        });
    }

    /**
     * Close connection
     * @public
     */
    close() {
        this.isManualClose = true;
        this.stopHeartbeat();
        
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    /**
     * Get connection state
     * @public
     * @returns {string} Connection state
     */
    getState() {
        if (!this.ws) {
            return 'CLOSED';
        }
        const states = {
            [WebSocket.CONNECTING]: 'CONNECTING',
            [WebSocket.OPEN]: 'OPEN',
            [WebSocket.CLOSING]: 'CLOSING',
            [WebSocket.CLOSED]: 'CLOSED'
        };
        return states[this.ws.readyState] || 'UNKNOWN';
    }

    /**
     * Get queue size
     * @public
     * @returns {number} Queue size
     */
    getQueueSize() {
        return this.messageQueue.length;
    }
}

// Export for use
window.WebSocketReconnectionSystem = WebSocketReconnectionSystem;

